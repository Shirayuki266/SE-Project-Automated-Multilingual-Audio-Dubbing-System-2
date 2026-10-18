from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ListeningEventCreate(BaseModel):
    poi_id: str = Field(min_length=1, max_length=36)
    language_code: str = Field(pattern="^(vi|en)$")
    trigger_source: str = Field(pattern="^(GPS_GEOFENCE|QR_CODE|MANUAL_CLICK)$")
    duration_listened_seconds: int = Field(ge=0, le=86400)
    completed: bool = False


class ListeningEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    poi_id: str
    language_code: str
    trigger_source: str
    duration_listened_seconds: int
    completed: bool
    created_at: datetime
