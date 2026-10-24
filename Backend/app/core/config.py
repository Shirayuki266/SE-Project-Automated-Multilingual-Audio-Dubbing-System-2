import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hệ Thống Thuyết Minh Tự Động Việt Nam Quốc Tự"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "vietnam_quoc_tu_db"
    
    # Security
    JWT_SECRET: str = "vnqt-secret-spiritual-audio-pwa-2026-secure-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours as per UC07 specs
    
    # Static & Storage Paths
    BASE_DIR: Path = BASE_DIR
    STATIC_DIR: Path = BASE_DIR / "static"
    AUDIO_DIR: Path = BASE_DIR / "static" / "audio"
    IMAGES_DIR: Path = BASE_DIR / "static" / "images"
    QR_DIR: Path = BASE_DIR / "static" / "qr"
    DATA_DIR: Path = BASE_DIR / "data"
    
    # Edge-TTS
    TTS_VOICE_VI: str = "vi-VN-HoaiMyNeural"
    TTS_VOICE_EN: str = "en-US-JennyNeural"
    
    # Gemini 2.5 Flash / ProxyPal
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    PROXYPAL_URL: Optional[str] = os.getenv("PROXYPAL_URL", "https://generativelanguage.googleapis.com/v1beta")
    PROXYPAL_KEY: Optional[str] = os.getenv("PROXYPAL_KEY", "")
    
    # Public Base URL (for QR DeepLinks and Audio URLs)
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for folder in [settings.STATIC_DIR, settings.AUDIO_DIR, settings.IMAGES_DIR, settings.QR_DIR, settings.DATA_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
