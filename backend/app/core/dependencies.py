"""FastAPI dependencies for authentication and RBAC authorization.

This is the enforcement layer:

  - ``get_current_user``     validates the bearer access token → User
  - ``get_current_active_user`` additionally requires the account be enabled
  - ``require_roles(...)``   dependency factory gating on role membership
  - ``require_permissions(...)`` dependency factory gating on permission codes

Superusers bypass role/permission checks.
"""
from typing import Callable

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select
import os
import requests
import logging

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.core.database import get_db
from app.models.rbac import User, Role
from app.services import auth_service
from clerk_backend_api import Clerk

logger = logging.getLogger(__name__)

clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY or "missing_secret_key")
_clerk_jwks_cache = None

def get_clerk_jwks():
    global _clerk_jwks_cache
    if _clerk_jwks_cache is None:
        url = "https://api.clerk.com/v1/jwks"
        headers = {}
        secret = settings.CLERK_SECRET_KEY
        if secret:
            headers["Authorization"] = f"Bearer {secret}"
        resp = requests.get(url, headers=headers)
        if resp.ok:
            _clerk_jwks_cache = resp.json()
        else:
            logger.error(f"Failed to fetch Clerk JWKS: {resp.text}")
            raise Exception("Failed to fetch Clerk JWKS")
    return _clerk_jwks_cache

def verify_clerk_token(token: str):
    jwks = get_clerk_jwks()
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise UnauthorizedError("could not validate credentials")
    
    rsa_key = {}
    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header.get("kid"):
            rsa_key = key
            break
            
    if not rsa_key:
        raise UnauthorizedError("could not validate credentials")
        
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise UnauthorizedError(f"could not validate credentials: {str(e)}")

# ``tokenUrl`` is what Swagger's "Authorize" button posts to.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    scheme_name="OAuth2PasswordBearer",
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = verify_clerk_token(token)
    except Exception as e:
        # Fallback to local token for backwards compatibility during transition
        try:
            payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
            user_id = int(payload.get("sub", 0))
            user = auth_service.get_user_by_id(db, user_id)
            if user: return user
        except:
            pass
        raise UnauthorizedError(f"could not validate credentials: {e}")

    clerk_id = payload.get("sub")
    if not clerk_id:
        raise UnauthorizedError("could not validate credentials")

    user = db.execute(select(User).where(User.clerk_id == clerk_id)).scalar_one_or_none()

    if user is None:
        try:
            clerk_user = clerk_client.users.get(user_id=clerk_id)
            email = clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else f"{clerk_id}@clerk.local"
            username = clerk_user.username or email.split("@")[0]
        except Exception as e:
            logger.error(f"Failed to fetch clerk user {clerk_id}: {e}")
            email = f"{clerk_id}@clerk.local"
            username = clerk_id
            
        user = User(
            clerk_id=clerk_id,
            email=email,
            username=username,
            password_hash="clerk-managed"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    public_metadata = payload.get("public_metadata", {})
    roles_claim = public_metadata.get("roles", [])
    if isinstance(roles_claim, str):
        roles_claim = [roles_claim]
        
    if roles_claim:
        roles = []
        for role_name in roles_claim:
            role = db.execute(select(Role).where(Role.role_name == role_name)).scalar_one_or_none()
            if role:
                roles.append(role)
        if set(r.role_name for r in user.roles) != set(roles_claim):
            user.roles = roles
            db.commit()
            db.refresh(user)

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise ForbiddenError("inactive account")
    if current_user.is_locked:
        raise ForbiddenError("account is locked")
    return current_user


def require_roles(*required: str, require_all: bool = False) -> Callable:
    """Dependency factory: caller must have (any|all of) the given roles.

    Usage::

        @router.get("/x", dependencies=[Depends(require_roles("admin"))])
    """

    def _dependency(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_superuser:
            return current_user
        held = current_user.role_names
        needed = set(required)
        ok = needed.issubset(held) if require_all else bool(needed & held)
        if not ok:
            raise ForbiddenError(
                f"requires role(s): {', '.join(sorted(needed))}"
            )
        return current_user

    return _dependency


def require_permissions(*required: str, require_all: bool = True) -> Callable:
    """Dependency factory: caller must hold the given permission code(s).

    Defaults to ``require_all=True`` (must hold every listed permission).
    """

    def _dependency(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_superuser:
            return current_user
        held = current_user.permission_codes
        needed = set(required)
        ok = needed.issubset(held) if require_all else bool(needed & held)
        if not ok:
            raise ForbiddenError(
                f"requires permission(s): {', '.join(sorted(needed))}"
            )
        return current_user

    return _dependency


def get_client_ip(request: Request) -> str | None:
    """Best-effort client IP, honoring a single proxy hop via X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
