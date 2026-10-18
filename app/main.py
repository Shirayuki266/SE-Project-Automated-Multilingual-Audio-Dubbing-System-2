from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.business_logic.services import auth_service
from app.config import Settings, get_settings
from app.data_access.database import create_database_engine, get_db
from app.data_access.entities.models import Base, Campus
from app.presentation.controllers import (
    analytics_controller,
    auth_controller,
    campus_controller,
    content_controller,
    media_controller,
)
from app.presentation.middlewares.rate_limit import RateLimitMiddleware


logger = logging.getLogger(__name__)
CAMPUS_SLUG = "viet-nam-quoc-tu"


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    engine = create_database_engine(app_settings)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        Base.metadata.create_all(bind=engine)
        with session_factory() as session:
            if session.query(Campus).filter_by(slug=CAMPUS_SLUG).first() is None:
                session.add(
                    Campus(
                        slug=CAMPUS_SLUG,
                        name="Việt Nam Quốc Tự",
                        address="244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh",
                    )
                )
                session.commit()
            auth_service.bootstrap_admin(session, app_settings)
        logger.info("Backend started in %s environment", app_settings.app_env)
        yield
        engine.dispose()

    application = FastAPI(
        title="Việt Nam Quốc Tự API",
        version="1.0.0",
        debug=app_settings.debug,
        lifespan=lifespan,
    )
    application.state.settings = app_settings
    application.state.engine = engine
    application.state.session_factory = session_factory
    application.add_middleware(RateLimitMiddleware)
    application.include_router(auth_controller.router, prefix="/api/v1")
    application.include_router(content_controller.router, prefix="/api/v1")
    application.include_router(campus_controller.router, prefix="/api/v1")
    application.include_router(media_controller.router, prefix="/api/v1")
    application.include_router(analytics_controller.router, prefix="/api/v1")

    @application.get("/healthz", tags=["Health"])
    def health_check(session: Session = Depends(get_db)) -> dict[str, str]:
        session.execute(text("SELECT 1"))
        return {"status": "ok"}

    return application


app = create_app()