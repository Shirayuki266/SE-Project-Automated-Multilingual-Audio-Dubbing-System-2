from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.business_logic.services.auth_service import (
    AuthenticationError,
    require_access_admin,
)
from app.config import Settings
from app.data_access.database import get_app_settings, get_db
from app.data_access.entities.models import AdminUser


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> AdminUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để thực hiện thao tác này",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return require_access_admin(session, settings, credentials.credentials)
    except AuthenticationError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
