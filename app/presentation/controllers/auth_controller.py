from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.business_logic.services import auth_service
from app.business_logic.services.auth_service import AuthenticationError
from app.config import Settings
from app.data_access.database import get_app_settings, get_db
from app.data_access.entities.models import AdminUser
from app.presentation.dtos.auth import AccessTokenResponse, AdminRead, LoginRequest
from app.presentation.middlewares.auth import get_current_admin


router = APIRouter(prefix="/auth", tags=["Authentication"])
REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, settings: Settings, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.refresh_cookie_secure or settings.app_env.casefold() == "production",
        samesite="strict",
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.refresh_cookie_secure or settings.app_env.casefold() == "production",
        samesite="strict",
        path="/api/v1/auth",
    )


def _raise_unauthorized(error: AuthenticationError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=str(error),
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/login", response_model=AccessTokenResponse)
def login(
    request: LoginRequest,
    response: Response,
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> AccessTokenResponse:
    try:
        _, tokens = auth_service.authenticate_admin(
            session,
            settings,
            request.login,
            request.password,
        )
    except AuthenticationError as error:
        raise _raise_unauthorized(error) from error
    _set_refresh_cookie(response, settings, tokens.refresh_token)
    return AccessTokenResponse(
        access_token=tokens.access_token,
        expires_in=settings.access_token_minutes * 60,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    request: Request,
    response: Response,
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> AccessTokenResponse:
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise _raise_unauthorized(
            AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
        )
    try:
        _, tokens = auth_service.refresh_tokens(session, settings, refresh_token)
    except AuthenticationError as error:
        _clear_refresh_cookie(response, settings)
        raise _raise_unauthorized(error) from error
    _set_refresh_cookie(response, settings, tokens.refresh_token)
    return AccessTokenResponse(
        access_token=tokens.access_token,
        expires_in=settings.access_token_minutes * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    admin: AdminUser = Depends(get_current_admin),
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> Response:
    auth_service.logout_admin(session, admin)
    _clear_refresh_cookie(response, settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=AdminRead)
def get_current_admin_profile(
    admin: AdminUser = Depends(get_current_admin),
) -> AdminRead:
    return AdminRead(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        full_name=admin.full_name,
        role=admin.role,
    )
