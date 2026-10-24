from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    media_type: str
    file_url: str
    file_size: int
    duration_seconds: int | None
    display_order: int


class POIRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    campus_id: str
    title_vi: str
    title_en: str | None
    description_vi: str
    description_en: str | None
    latitude: float
    longitude: float
    geofence_radius: int
    qr_code_url: str | None
    is_active: bool
    display_order: int
    location_type: str
    created_at: datetime
    media: list[MediaRead] = Field(default_factory=list)


class POICreate(BaseModel):
    title_vi: str = Field(min_length=1, max_length=200)
    title_en: str | None = Field(default=None, max_length=200)
    description_vi: str = Field(min_length=1, max_length=10000)
    description_en: str | None = Field(default=None, max_length=10000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    geofence_radius: int = Field(ge=5, le=100)
    location_type: Literal["OUTDOOR", "INDOOR"] = "OUTDOOR"
    is_active: bool = True
    display_order: int = Field(default=0, ge=0)


class POIUpdate(BaseModel):
    title_vi: str | None = Field(default=None, min_length=1, max_length=200)
    title_en: str | None = Field(default=None, max_length=200)
    description_vi: str | None = Field(default=None, min_length=1, max_length=10000)
    description_en: str | None = Field(default=None, max_length=10000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius: int | None = Field(default=None, ge=5, le=100)
    location_type: Literal["OUTDOOR", "INDOOR"] | None = None
    is_active: bool | None = None
    display_order: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def reject_empty_update(self) -> "POIUpdate":
        if not self.model_fields_set:
            raise ValueError("Cần cung cấp ít nhất một trường cần cập nhật")
        nullable_fields = {"title_en", "description_en"}
        invalid_nulls = {
            field
            for field in self.model_fields_set - nullable_fields
            if getattr(self, field) is None
        }
        if invalid_nulls:
            raise ValueError("Các trường bắt buộc không được phép nhận giá trị null")
        return self


class CampusVersionRead(BaseModel):
    version: str
    last_updated: datetime


class CampusPOIListRead(BaseModel):
    campus_slug: str
    data_version: str
    pois: list[POIRead]


class POIDetailRead(BaseModel):
    poi: POIRead
    data_version: str
    pois: list[POIRead]