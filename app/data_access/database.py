from collections.abc import Generator
import sqlite3

from fastapi import Request
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import Settings


def create_database_engine(settings: Settings) -> Engine:
    connect_args = (
        {"check_same_thread": False}
        if settings.database_url.startswith("sqlite")
        else {}
    )
    pool_class = (
        StaticPool
        if settings.database_url in {"sqlite://", "sqlite:///:memory:"}
        else None
    )
    engine = create_engine(
        settings.database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        **({"poolclass": pool_class} if pool_class is not None else {}),
    )

    if settings.database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(
            connection: sqlite3.Connection,
            _: object,
        ) -> None:
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def get_db(request: Request) -> Generator[Session, None, None]:
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    with session_factory() as session:
        yield session


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings
