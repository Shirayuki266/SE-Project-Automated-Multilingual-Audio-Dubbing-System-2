from datetime import UTC, datetime, timedelta
from dataclasses import dataclass
import hashlib
import hmac
import secrets

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.config import Settings
from app.data_access.entities.models import AdminUser
from app.data_access.repositories import auth_repository


class AuthenticationError(Exception):
    pass


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str


def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Mật khẩu không được dài quá 72 byte")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def _token_hash(token: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()


def _create_token(
    admin: AdminUser,
    *,
    token_type: str,
    secret: str,
    lifetime: timedelta,
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": admin.id,
        "username": admin.username,
        "role": admin.role,
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def _create_token_pair(admin: AdminUser, settings: Settings) -> TokenPair:
    return TokenPair(
        access_token=_create_token(
            admin,
            token_type="access",
            secret=settings.jwt_secret,
            lifetime=timedelta(minutes=settings.access_token_minutes),
        ),
        refresh_token=_create_token(
            admin,
            token_type="refresh",
            secret=settings.refresh_token_secret,
            lifetime=timedelta(days=settings.refresh_token_days),
        ),
    )


def _decode_token(token: str, secret: str, expected_type: str) -> dict[str, object]:
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.InvalidTokenError as error:
        raise AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn") from error
    if payload.get("type") != expected_type or not isinstance(payload.get("sub"), str):
        raise AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    return payload


def _is_locked(admin: AdminUser, now: datetime) -> bool:
    locked_until = admin.locked_until
    if locked_until is None:
        return False
    if locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=UTC)
    return locked_until > now


def authenticate_admin(
    session: Session,
    settings: Settings,
    login: str,
    password: str,
) -> tuple[AdminUser, TokenPair]:
    admin = auth_repository.get_admin_by_login(session, login)
    if admin is None or not admin.is_active or _is_locked(admin, datetime.now(UTC)):
        raise AuthenticationError("Tài khoản hoặc mật khẩu không chính xác")

    if len(password.encode("utf-8")) > 72 or not bcrypt.checkpw(
        password.encode("utf-8"),
        admin.password_hash.encode("ascii"),
    ):
        now = datetime.now(UTC)
        locked_until = admin.locked_until
        expired_lock = locked_until is not None and not _is_locked(admin, now)
        attempts = 1 if expired_lock else admin.failed_login_attempts + 1
        auth_repository.record_failed_login(session, admin, attempts)
        raise AuthenticationError("Tài khoản hoặc mật khẩu không chính xác")

    token_pair = _create_token_pair(admin, settings)
    auth_repository.record_successful_login(
        session,
        admin,
        _token_hash(token_pair.refresh_token, settings.refresh_token_secret),
    )
    return admin, token_pair


def refresh_tokens(
    session: Session,
    settings: Settings,
    refresh_token: str,
) -> tuple[AdminUser, TokenPair]:
    payload = _decode_token(
        refresh_token,
        settings.refresh_token_secret,
        "refresh",
    )
    admin = auth_repository.get_admin(session, str(payload["sub"]))
    old_hash = _token_hash(refresh_token, settings.refresh_token_secret)
    if (
        admin is None
        or not admin.is_active
        or admin.refresh_token_hash is None
        or not hmac.compare_digest(admin.refresh_token_hash, old_hash)
    ):
        raise AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    token_pair = _create_token_pair(admin, settings)
    new_hash = _token_hash(token_pair.refresh_token, settings.refresh_token_secret)
    if not auth_repository.rotate_refresh_token(session, admin, old_hash, new_hash):
        raise AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã được sử dụng")
    return admin, token_pair


def require_access_admin(
    session: Session,
    settings: Settings,
    access_token: str,
) -> AdminUser:
    payload = _decode_token(access_token, settings.jwt_secret, "access")
    admin = auth_repository.get_admin(session, str(payload["sub"]))
    if admin is None or not admin.is_active:
        raise AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    return admin


def logout_admin(session: Session, admin: AdminUser) -> None:
    auth_repository.revoke_refresh_token(session, admin)


def bootstrap_admin(
    session: Session,
    settings: Settings,
) -> None:
    values = (
        settings.bootstrap_admin_username,
        settings.bootstrap_admin_email,
        settings.bootstrap_admin_password,
    )
    if not any(values):
        return
    if not all(values):
        raise RuntimeError(
            "Phải cấu hình đầy đủ BOOTSTRAP_ADMIN_USERNAME, "
            "BOOTSTRAP_ADMIN_EMAIL và BOOTSTRAP_ADMIN_PASSWORD"
        )
    assert settings.bootstrap_admin_username is not None
    assert settings.bootstrap_admin_email is not None
    assert settings.bootstrap_admin_password is not None
    if auth_repository.get_admin_by_login(session, settings.bootstrap_admin_username):
        return
    auth_repository.create_admin(
        session,
        username=settings.bootstrap_admin_username,
        email=settings.bootstrap_admin_email,
        password_hash=hash_password(settings.bootstrap_admin_password),
        full_name=settings.bootstrap_admin_username,
    )
