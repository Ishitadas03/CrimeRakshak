"""Authentication & user-management business logic.

Everything that touches the ``users`` / ``roles`` / ``refresh_tokens`` tables in
service of login, registration, and token lifecycle lives here. Routers stay
thin and delegate to these functions.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.rbac import RefreshToken, Role, User


class AuthError(Exception):
    """Raised for expected auth failures; routers map these to HTTP 4xx."""

    def __init__(self, message: str, code: str = "auth_error"):
        super().__init__(message)
        self.message = message
        self.code = code


# ── User lookup ─────────────────────────────────────────────────────────────
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.scalar(select(User).where(User.username == username))


def get_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    """Look up by username OR email (the login form accepts either)."""
    return db.scalar(
        select(User).where(or_(User.username == identifier, User.email == identifier))
    )


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


# ── Registration ─────────────────────────────────────────────────────────────
def register_user(
    db: Session,
    *,
    username: str,
    email: str,
    password: str,
    district_id: Optional[int] = None,
    role_names: Optional[list[str]] = None,
) -> User:
    if get_user_by_identifier(db, username) or get_user_by_identifier(db, email):
        raise AuthError("username or email already registered", code="already_exists")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        district_id=district_id,
        is_active=True,
    )

    # Assign a default role when none specified so new accounts are least-privilege.
    roles_to_assign = role_names or ["viewer"]
    resolved = db.scalars(
        select(Role).where(Role.role_name.in_(roles_to_assign))
    ).all()
    if resolved:
        user.roles = list(resolved)
        # Keep the legacy single-role FK in sync with the primary role.
        user.role_id = resolved[0].role_id

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Authentication ───────────────────────────────────────────────────────────
def authenticate(db: Session, identifier: str, password: str) -> User:
    """Validate credentials, applying lockout policy. Raises ``AuthError``."""
    user = get_user_by_identifier(db, identifier)

    # Uniform failure to avoid leaking which usernames exist. Still run a hash
    # verify against a dummy to reduce timing differences on unknown users.
    if user is None:
        verify_password(password, _DUMMY_HASH)
        raise AuthError("invalid credentials", code="invalid_credentials")

    if user.is_locked:
        raise AuthError(
            "account temporarily locked due to failed login attempts",
            code="account_locked",
        )

    if not user.is_active:
        raise AuthError("account is disabled", code="account_disabled")

    if not verify_password(password, user.password_hash):
        _register_failed_login(db, user)
        raise AuthError("invalid credentials", code="invalid_credentials")

    # Success: reset counters and stamp last login.
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return user


def _register_failed_login(db: Session, user: User) -> None:
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
        user.locked_until = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCOUNT_LOCKOUT_MINUTES
        )
        user.failed_login_attempts = 0
    db.commit()


# A precomputed bcrypt hash of a random string; only used to equalize timing.
_DUMMY_HASH = "$2b$12$abcdefghijklmnopqrstuuMxHxU8t8y1zJ8gk2yq5nJc6oQ0m2VpS"


# ── Token issuance & rotation ────────────────────────────────────────────────
def issue_token_pair(
    db: Session,
    user: User,
    *,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> tuple[str, str, datetime]:
    """Create an access token and a persisted refresh token.

    Returns ``(access_token, refresh_token, access_expires_at)``.
    """
    access_token, access_exp = create_access_token(
        user.user_id,
        extra_claims={
            "username": user.username,
            "roles": sorted(user.role_names),
        },
    )
    refresh_token, jti, refresh_exp = create_refresh_token(user.user_id)

    db.add(
        RefreshToken(
            jti=jti,
            user_id=user.user_id,
            expires_at=refresh_exp,
            user_agent=(user_agent or "")[:255] or None,
            ip_address=ip_address,
        )
    )
    db.commit()
    return access_token, refresh_token, access_exp


def rotate_refresh_token(
    db: Session,
    jti: str,
    user_id: int,
    *,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> tuple[str, str, datetime]:
    """Validate a refresh token's ``jti``, revoke it, and issue a fresh pair.

    Rotation defends against refresh-token replay: each refresh token is
    single-use. Reuse of an already-revoked token is treated as a breach signal
    and all of the user's refresh tokens are revoked.
    """
    stored = db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
    if stored is None or stored.user_id != user_id:
        raise AuthError("refresh token not recognized", code="invalid_refresh")

    if stored.revoked:
        # Replay of a rotated token — revoke the whole family defensively.
        revoke_all_user_tokens(db, user_id)
        raise AuthError("refresh token reuse detected", code="refresh_reuse")

    if not stored.is_active:
        raise AuthError("refresh token expired", code="expired_refresh")

    user = get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise AuthError("user no longer active", code="account_disabled")

    stored.revoked = True
    db.commit()

    return issue_token_pair(db, user, user_agent=user_agent, ip_address=ip_address)


def revoke_refresh_token(db: Session, jti: str) -> None:
    stored = db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
    if stored is not None and not stored.revoked:
        stored.revoked = True
        db.commit()


def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    """Revoke every active refresh token for a user (logout-all). Returns count."""
    tokens = db.scalars(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.revoked == False  # noqa: E712
        )
    ).all()
    for t in tokens:
        t.revoked = True
    db.commit()
    return len(tokens)


# ── Password management ──────────────────────────────────────────────────────
def change_password(
    db: Session, user: User, current_password: str, new_password: str
) -> None:
    if not verify_password(current_password, user.password_hash):
        raise AuthError("current password is incorrect", code="invalid_credentials")
    user.password_hash = hash_password(new_password)
    db.commit()
    # Force re-auth everywhere after a password change.
    revoke_all_user_tokens(db, user.user_id)
