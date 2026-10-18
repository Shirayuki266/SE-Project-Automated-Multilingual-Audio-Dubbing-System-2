from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.data_access.entities.models import AdminUser


def get_admin_by_login(session: Session, login: str) -> AdminUser | None:
    normalized_login = login.strip().casefold()
    return session.scalar(
        select(AdminUser).where(
            or_(
                func.lower(AdminUser.username) == normalized_login,
                func.lower(AdminUser.email) == normalized_login,
            )
        )
    )


def get_admin(session: Session, admin_id: str) -> AdminUser | None:
    return session.get(AdminUser, admin_id)


def create_admin(
    session: Session,
    *,
    username: str,
    email: str,
    password_hash: str,
    full_name: str,
    role: str = "SUPER_ADMIN",
) -> AdminUser:
    admin = AdminUser(
        username=username.strip().casefold(),
        email=email.strip().casefold(),
        password_hash=password_hash,
        full_name=full_name,
        role=role,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


def record_failed_login(session: Session, admin: AdminUser, attempts: int) -> None:
    admin.failed_login_attempts = attempts
    if attempts >= 5:
        admin.locked_until = datetime.now(UTC).replace(microsecond=0) + timedelta(minutes=15)
    session.commit()


def record_successful_login(session: Session, admin: AdminUser, token_hash: str) -> None:
    admin.failed_login_attempts = 0
    admin.locked_until = None
    admin.last_login = datetime.now(UTC)
    admin.refresh_token_hash = token_hash
    session.commit()


def rotate_refresh_token(
    session: Session,
    admin: AdminUser,
    old_hash: str,
    new_hash: str,
) -> bool:
    result = session.execute(
        update(AdminUser)
        .where(
            AdminUser.id == admin.id,
            AdminUser.refresh_token_hash == old_hash,
            AdminUser.is_active.is_(True),
        )
        .values(refresh_token_hash=new_hash)
    )
    session.commit()
    return result.rowcount == 1


def revoke_refresh_token(session: Session, admin: AdminUser) -> None:
    admin.refresh_token_hash = None
    session.commit()
