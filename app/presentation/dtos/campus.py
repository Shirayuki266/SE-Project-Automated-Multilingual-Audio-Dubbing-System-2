from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CampusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    address: str
    latitude: float | None
    longitude: float | None
    boundary_polygon: list[list[float]] | None
    status: str
    data_version: str
    updated_at: datetime


class CampusUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    boundary_polygon: list[list[float]] | None = Field(
        default=None,
        description="Danh sách đỉnh theo thứ tự [longitude, latitude].",
    )
    status: Literal["ACTIVE", "COMING_SOON"] | None = None

    @model_validator(mode="after")
    def validate_update(self) -> "CampusUpdate":
        if not self.model_fields_set:
            raise ValueError("Cần cung cấp ít nhất một trường cần cập nhật")
        nullable_fields = {"boundary_polygon", "latitude", "longitude"}
        if any(
            getattr(self, field) is None
            for field in self.model_fields_set - nullable_fields
        ):
            raise ValueError("Các trường bắt buộc không được phép nhận giá trị null")
        polygon = self.boundary_polygon
        if polygon is not None:
            if len(polygon) < 3 or any(len(point) != 2 for point in polygon):
                raise ValueError("Ranh giới phải có ít nhất 3 cặp tọa độ kinh độ/vĩ độ")
            if any(
                not -180 <= longitude <= 180 or not -90 <= latitude <= 90
                for longitude, latitude in polygon
            ):
                raise ValueError("Tọa độ ranh giới nằm ngoài phạm vi hợp lệ")
        return self
