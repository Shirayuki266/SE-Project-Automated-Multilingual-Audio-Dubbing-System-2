from datetime import datetime, timezone
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class POITranslation(BaseModel):
    language_code: str = "vi"  # 'vi' or 'en'
    title: str
    description: str
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = 0.0

class POIMedia(BaseModel):
    image_url: str
    caption_vi: Optional[str] = ""
    caption_en: Optional[str] = ""
    display_order: int = 0

class POIBase(BaseModel):
    poi_id: str
    code: str
    campus_id: str = "viet-nam-quoc-tu"
    latitude: float
    longitude: float
    geofence_radius: float = Field(default=18.0, ge=5.0, le=50.0)
    location_type: str = "outdoor"  # 'outdoor' or 'indoor'
    order_index: int = 0
    is_active: bool = True
    qr_code_url: Optional[str] = None
    translations: Dict[str, POITranslation]
    media: List[POIMedia] = []

class POICreate(POIBase):
    pass

class POIUpdate(BaseModel):
    code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geofence_radius: Optional[float] = None
    location_type: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None
    translations: Optional[Dict[str, POITranslation]] = None
    media: Optional[List[POIMedia]] = None

class POIResponse(POIBase):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
