from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.data_access.entities.models import Campus, POI, POIMedia


def get_campus(session: Session, slug: str) -> Campus | None:
    return session.scalar(select(Campus).where(Campus.slug == slug))


def update_campus(session: Session, campus: Campus, values: dict[str, object]) -> Campus:
    for key, value in values.items():
        setattr(campus, key, value)
    _bump_campus_version(campus)
    session.commit()
    session.refresh(campus)
    return campus


def list_active_pois(session: Session, campus_id: str) -> list[POI]:
    statement = (
        select(POI)
        .where(
            POI.campus_id == campus_id,
            POI.is_active.is_(True),
            POI.is_deleted.is_(False),
        )
        .options(selectinload(POI.media))
        .order_by(POI.display_order, POI.title_vi)
    )
    return list(session.scalars(statement).all())


def get_poi(session: Session, poi_id: str, *, include_deleted: bool = False) -> POI | None:
    statement = (
        select(POI)
        .where(POI.id == poi_id)
        .options(selectinload(POI.media))
    )
    if not include_deleted:
        statement = statement.where(POI.is_deleted.is_(False))
    return session.scalar(statement)


def _bump_campus_version(campus: Campus) -> None:
    parts = campus.data_version.removeprefix("v").split(".")
    if len(parts) == 3 and all(part.isdigit() for part in parts):
        major, minor, patch = (int(part) for part in parts)
        campus.data_version = f"v{major}.{minor}.{patch + 1}"
    else:
        campus.data_version = f"v{uuid4().hex[:12]}"
    campus.updated_at = datetime.now(UTC)


def create_poi(session: Session, campus: Campus, values: dict[str, object]) -> POI:
    poi = POI(campus_id=campus.id, **values)
    session.add(poi)
    _bump_campus_version(campus)
    session.commit()
    return get_poi(session, poi.id) or poi


def update_poi(session: Session, poi: POI, campus: Campus, values: dict[str, object]) -> POI:
    for key, value in values.items():
        setattr(poi, key, value)
    _bump_campus_version(campus)
    session.commit()
    return get_poi(session, poi.id) or poi


def soft_delete_poi(session: Session, poi: POI, campus: Campus) -> None:
    poi.is_deleted = True
    poi.deleted_at = datetime.now(UTC)
    _bump_campus_version(campus)
    session.commit()


def get_media(session: Session, media_id: str) -> POIMedia | None:
    return session.get(POIMedia, media_id)


def add_media(session: Session, campus: Campus, media: POIMedia) -> POIMedia:
    session.add(media)
    _bump_campus_version(campus)
    session.commit()
    session.refresh(media)
    return media