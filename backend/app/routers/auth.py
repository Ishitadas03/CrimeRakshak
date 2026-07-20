"""Authentication endpoints: register, login, token refresh, logout, profile."""
from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_active_user
from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import REFRESH_TOKEN_TYPE, decode_token
from app.models.rbac import User
from app.schemas.auth import (
    MessageResponse,
    PasswordChange,
    Token,
    TokenRefreshRequest,
    UserRead,
    UserRegister,
)
from app.services import audit, auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user (default role: viewer)",
)
def register(
    payload: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    try:
        user = auth_service.register_user(
            db,
            username=payload.username,
            email=payload.email,
            password=payload.password,
            district_id=payload.district_id,
        )
    except AuthError as exc:
        audit.record(
            db,
            action="user.register",
            resource=payload.username,
            status="failure",
            ip_address=ip,
            detail={"reason": exc.code},
        )
        raise ConflictError(exc.message, code=exc.code)

    audit.record(
        db,
        action="user.register",
        user_id=user.user_id,
        resource=user.username,
        ip_address=ip,
    )
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="OAuth2 password-flow login (form-encoded)",
)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Accepts ``application/x-www-form-urlencoded`` with ``username`` &
    ``password`` fields (per OAuth2). ``username`` may be a username or email."""
    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent")
    try:
        user = auth_service.authenticate(db, form_data.username, form_data.password)
    except AuthError as exc:
        audit.record(
            db,
            action="auth.login",
            resource=form_data.username,
            status="failure",
            ip_address=ip,
            detail={"reason": exc.code},
        )
        raise UnauthorizedError(exc.message, code=exc.code)

    access_token, refresh_token, access_exp = auth_service.issue_token_pair(
        db, user, user_agent=user_agent, ip_address=ip
    )
    audit.record(
        db, action="auth.login", user_id=user.user_id, ip_address=ip
    )
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=access_exp,
    )


@router.post(
    "/refresh",
    response_model=Token,
    summary="Exchange a refresh token for a new token pair (rotating)",
)
def refresh(
    payload: TokenRefreshRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent")
    try:
        claims = decode_token(payload.refresh_token, expected_type=REFRESH_TOKEN_TYPE)
    except JWTError:
        raise UnauthorizedError("invalid refresh token", code="invalid_refresh")

    jti = claims.get("jti")
    sub = claims.get("sub")
    if not jti or not sub:
        raise UnauthorizedError("invalid refresh token", code="invalid_refresh")

    try:
        access_token, refresh_token, access_exp = auth_service.rotate_refresh_token(
            db, jti, int(sub), user_agent=user_agent, ip_address=ip
        )
    except AuthError as exc:
        audit.record(
            db,
            action="auth.refresh",
            user_id=int(sub) if str(sub).isdigit() else None,
            status="failure",
            ip_address=ip,
            detail={"reason": exc.code},
        )
        raise UnauthorizedError(exc.message, code=exc.code)

    audit.record(db, action="auth.refresh", user_id=int(sub), ip_address=ip)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=access_exp,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke the presented refresh token",
)
def logout(
    payload: TokenRefreshRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        claims = decode_token(payload.refresh_token, expected_type=REFRESH_TOKEN_TYPE)
        jti = claims.get("jti")
    except JWTError:
        raise BadRequestError("invalid refresh token", code="invalid_refresh")

    if jti:
        auth_service.revoke_refresh_token(db, jti)
    audit.record(
        db,
        action="auth.logout",
        user_id=current_user.user_id,
        ip_address=get_client_ip(request),
    )
    return MessageResponse(detail="logged out")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="Revoke all refresh tokens for the current user",
)
def logout_all(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    count = auth_service.revoke_all_user_tokens(db, current_user.user_id)
    audit.record(
        db,
        action="auth.logout_all",
        user_id=current_user.user_id,
        ip_address=get_client_ip(request),
        detail={"revoked": count},
    )
    return MessageResponse(detail=f"revoked {count} session(s)")


@router.get("/me", response_model=UserRead, summary="Current authenticated user")
def read_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password (revokes all existing sessions)",
)
def change_password(
    payload: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        auth_service.change_password(
            db, current_user, payload.current_password, payload.new_password
        )
    except AuthError as exc:
        audit.record(
            db,
            action="auth.change_password",
            user_id=current_user.user_id,
            status="failure",
            ip_address=get_client_ip(request),
            detail={"reason": exc.code},
        )
        raise BadRequestError(exc.message, code=exc.code)

    audit.record(
        db,
        action="auth.change_password",
        user_id=current_user.user_id,
        ip_address=get_client_ip(request),
    )
    return MessageResponse(detail="password updated; please log in again")
