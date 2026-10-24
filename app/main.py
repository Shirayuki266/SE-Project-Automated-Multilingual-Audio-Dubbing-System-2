from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.business_logic.services import auth_service
from app.config import Settings, get_settings
from app.data_access.database import create_database_engine, get_db
from app.data_access.entities.models import Base, Campus, POI
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


def _seed_demo_data(session: Session, campus: Campus) -> None:
    if campus.boundary_polygon is None:
        campus.boundary_polygon = [
            [106.6650, 10.7600],
            [106.6750, 10.7600],
            [106.6750, 10.7830],
            [106.6650, 10.7830],
        ]
        campus.latitude = 10.7715
        campus.longitude = 106.6700

    if session.query(POI).filter_by(campus_id=campus.id).count() > 0:
        return

    sample_pois = [
        {
            "id": "poi-cổng-tam-quan",
            "title_vi": "Cổng Tam Quan",
            "title_en": "Tam Quan Gate",
            "description_vi": "Lối vào chính của chùa, nơi khởi đầu hành trình chiêm bái và gặp gỡ không gian nghi lễ.",
            "description_en": "The main gate of the temple, where the pilgrimage begins and the ceremonial journey starts.",
            "latitude": 10.7662,
            "longitude": 106.6681,
            "geofence_radius": 25,
            "location_type": "OUTDOOR",
            "display_order": 1,
            "is_active": True,
        },
        {
            "id": "poi-bao-thap-13-tang",
            "title_vi": "Bảo Tháp 13 Tầng",
            "title_en": "13-Level Stupa",
            "description_vi": "Tòa tháp mang hình tượng kiến trúc cổ truyền, biểu trưng cho sự thanh tịnh và bền vững.",
            "description_en": "A towering stupa of traditional design, symbolizing purity, resilience, and spiritual continuity.",
            "latitude": 10.7671,
            "longitude": 106.6695,
            "geofence_radius": 20,
            "location_type": "OUTDOOR",
            "display_order": 2,
            "is_active": True,
        },
        {
            "id": "poi-dai-chanh-dien",
            "title_vi": "Đại Chánh Điện",
            "title_en": "Main Hall",
            "description_vi": "Không gian trung tâm, nơi diễn ra các nghi lễ và là nơi du khách ngắm cảnh tượng linh thiêng.",
            "description_en": "The central hall where ceremonies take place and where visitors contemplate the sacred atmosphere.",
            "latitude": 10.7684,
            "longitude": 106.6712,
            "geofence_radius": 30,
            "location_type": "INDOOR",
            "display_order": 3,
            "is_active": True,
        },
        {
            "id": "poi-thap-dai-hong-chung",
            "title_vi": "Tháp Đại Hồng Chung",
            "title_en": "Dai Hong Chung Tower",
            "description_vi": "Tòa tháp ấn tượng với khiếm khuyết kiến trúc và ý nghĩa biểu tượng sâu sắc trong văn hóa Phật giáo.",
            "description_en": "An iconic tower with remarkable architecture and deep symbolic meaning in Buddhist culture.",
            "latitude": 10.7690,
            "longitude": 106.6704,
            "geofence_radius": 22,
            "location_type": "OUTDOOR",
            "display_order": 4,
            "is_active": True,
        },
        {
            "id": "poi-nha-to",
            "title_vi": "Nhà Tổ",
            "title_en": "Ancestor House",
            "description_vi": "Nơi lưu giữ di sản và từng bước dạy về sự tôn kính, xuất phát điểm cho hành trình tôn giáo.",
            "description_en": "A place preserving heritage and guiding respectful learning along the spiritual journey.",
            "latitude": 10.7687,
            "longitude": 106.6724,
            "geofence_radius": 20,
            "location_type": "OUTDOOR",
            "display_order": 5,
            "is_active": True,
        },
        {
            "id": "poi-thu-vien-phat-hoc",
            "title_vi": "Thư Viện Phật Học",
            "title_en": "Buddhist Library",
            "description_vi": "Không gian lưu trữ tri thức, sách và những bài giảng giúp du khách hiểu sâu hơn lịch sử chùa.",
            "description_en": "A knowledge repository containing texts and teachings to deepen the visitor's understanding of the temple.",
            "latitude": 10.7697,
            "longitude": 106.6719,
            "geofence_radius": 18,
            "location_type": "INDOOR",
            "display_order": 6,
            "is_active": True,
        },
    ]

    for item in sample_pois:
        session.add(
            POI(
                id=item["id"],
                campus_id=campus.id,
                title_vi=item["title_vi"],
                title_en=item["title_en"],
                description_vi=item["description_vi"],
                description_en=item["description_en"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                geofence_radius=item["geofence_radius"],
                qr_code_url=f"/poi/{item['id']}",
                is_active=item["is_active"],
                display_order=item["display_order"],
                location_type=item["location_type"],
            )
        )
    session.commit()


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    engine = create_database_engine(app_settings)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        Base.metadata.create_all(bind=engine)
        with session_factory() as session:
            campus = session.query(Campus).filter_by(slug=CAMPUS_SLUG).first()
            if campus is None:
                campus = Campus(
                    slug=CAMPUS_SLUG,
                    name="Việt Nam Quốc Tự",
                    address="244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh",
                )
                session.add(campus)
                session.flush()

            if app_settings.app_env.casefold() != "test":
                _seed_demo_data(session, campus)

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

    static_dir = Path(__file__).resolve().parent / "presentation" / "static"
    application.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @application.get("/", include_in_schema=False)
    def serve_frontend() -> FileResponse:
        return FileResponse(static_dir / "index.html")

    @application.get("/admin", include_in_schema=False)
    def serve_admin() -> FileResponse:
        return FileResponse(static_dir / "admin.html")

    @application.get("/healthz", tags=["Health"])
    def health_check(session: Session = Depends(get_db)) -> dict[str, str]:
        session.execute(text("SELECT 1"))
        return {"status": "ok"}

    return application


app = create_app()