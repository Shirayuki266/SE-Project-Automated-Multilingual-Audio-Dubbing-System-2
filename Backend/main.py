import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.mongo import db_manager
from app.db.seed import seed_data
from app.services.image_generator import generate_all_temple_images
from app.api.v1.auth import router as auth_router
from app.api.v1.campuses import router as campuses_router
from app.api.v1.pois import router as pois_router
from app.api.v1.chat import router as chat_router
from app.api.v1.tts import router as tts_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Việt Nam Quốc Tự Audio Guide Backend...")
    # Initialize database
    await db_manager.connect()
    # Generate temple offline placeholder images
    generate_all_temple_images()
    # Auto-seed database with authentic POIs, QR codes, and TTS
    try:
        await seed_data()
    except Exception as e:
        logger.error(f"Error during database seed: {e}")
    logger.info("Application ready! Serving on port 8000.")
    yield
    logger.info("Shutting down backend services...")
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Hệ thống thuyết minh tự động đa ngôn ngữ cho di tích Phật giáo Việt Nam Quốc Tự",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static directory
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(campuses_router, prefix=settings.API_V1_STR)
app.include_router(pois_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(tts_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "location": "Việt Nam Quốc Tự, 244 Ba Tháng Hai, Quận 10, TP.HCM",
        "docs_url": "/docs",
        "campus_api": f"{settings.API_V1_STR}/campuses/viet-nam-quoc-tu",
        "pois_api": f"{settings.API_V1_STR}/campuses/viet-nam-quoc-tu/pois",
        "database_mode": "Live MongoDB" if db_manager.is_live_mongo else "Embedded Resilient MongoDB Engine"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
