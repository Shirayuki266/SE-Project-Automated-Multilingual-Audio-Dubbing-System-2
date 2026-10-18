from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Campus(Base):
    __tablename__ = "campuses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(500))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    boundary_polygon: Mapped[list[list[float]] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    data_version: Mapped[str] = mapped_column(String(50), default="v1.0.0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    pois: Mapped[list["POI"]] = relationship(back_populates="campus")


class POI(Base):
    __tablename__ = "pois"
    __table_args__ = (
        Index("ix_pois_campus_visible", "campus_id", "is_active", "is_deleted"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    campus_id: Mapped[str] = mapped_column(ForeignKey("campuses.id", ondelete="CASCADE"))
    title_vi: Mapped[str] = mapped_column(String(200))
    title_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description_vi: Mapped[str] = mapped_column(String(10000))
    description_en: Mapped[str | None] = mapped_column(String(10000), nullable=True)
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    geofence_radius: Mapped[int] = mapped_column(Integer)
    qr_code_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    location_type: Mapped[str] = mapped_column(String(20), default="OUTDOOR")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    campus: Mapped[Campus] = relationship(back_populates="pois")
    media: Mapped[list["POIMedia"]] = relationship(
        back_populates="poi", cascade="all, delete-orphan", order_by="POIMedia.display_order"
    )


class POIMedia(Base):
    __tablename__ = "poi_media"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    poi_id: Mapped[str] = mapped_column(ForeignKey("pois.id", ondelete="CASCADE"), index=True)
    media_type: Mapped[str] = mapped_column(String(20))
    file_url: Mapped[str] = mapped_column(String(1000))
    storage_key: Mapped[str] = mapped_column(String(255))
    file_size: Mapped[int] = mapped_column(Integer)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bitrate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    poi: Mapped[POI] = relationship(back_populates="media")


class AdminUser(Base):
    __tablename__ = "admin_users"
    __table_args__ = (
        UniqueConstraint("username", name="uq_admin_users_username"),
        UniqueConstraint("email", name="uq_admin_users_email"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    username: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(30), default="EDITOR")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ListeningAnalytics(Base):
    __tablename__ = "listening_analytics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    poi_id: Mapped[str] = mapped_column(ForeignKey("pois.id", ondelete="CASCADE"), index=True)
    language_code: Mapped[str] = mapped_column(String(10))
    trigger_source: Mapped[str] = mapped_column(String(20))
    duration_listened_seconds: Mapped[int] = mapped_column(Integer)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
