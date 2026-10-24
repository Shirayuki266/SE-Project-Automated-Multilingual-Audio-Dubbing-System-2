from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class CampusBase(BaseModel):
    campus_id: str = "viet-nam-quoc-tu"
    name: str = "Việt Nam Quốc Tự"
    address: str = "244 đường Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh"
    center_latitude: float = 10.77185
    center_longitude: float = 106.67135
    default_zoom: float = 18.0
    description_vi: str = "Trung tâm Phật giáo quy mô và có ý nghĩa lịch sử - tâm linh quan trọng bậc nhất của TP. Hồ Chí Minh và cả nước, trụ sở Ban Trị sự GHPGVN TP.HCM."
    description_en: str = "One of the most prominent Buddhist spiritual and cultural centers in Ho Chi Minh City and Vietnam, headquarters of the Vietnam Buddhist Sangha of HCMC."
    map_image_url: Optional[str] = "/static/images/vietnam_quoc_tu_overview.jpg"

class CampusCreate(CampusBase):
    pass

class CampusUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None
    default_zoom: Optional[float] = None
    description_vi: Optional[str] = None
    description_en: Optional[str] = None
    map_image_url: Optional[str] = None

class CampusResponse(CampusBase):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
