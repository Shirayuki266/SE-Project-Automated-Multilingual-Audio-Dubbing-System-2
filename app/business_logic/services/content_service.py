from sqlalchemy.orm import Session
from uuid import uuid4

from app.business_logic.helpers.geofence import is_inside_boundary
from app.data_access.entities.models import Campus, POI
from app.data_access.repositories import content_repository


CAMPUS_SLUG = "viet-nam-quoc-tu"


def require_campus(session: Session, slug: str = CAMPUS_SLUG) -> Campus:
    campus = content_repository.get_campus(session, slug)
    if campus is None:
        raise LookupError("Không tìm thấy khuôn viên")
    return campus


def update_campus(
    session: Session,
    campus: Campus,
    values: dict[str, object],
) -> Campus:
    if not values:
        raise ValueError("Cần cung cấp ít nhất một trường cần cập nhật")
    values = dict(values)
    for coordinate in ("latitude", "longitude"):
        if coordinate in values and values[coordinate] is not None:
            values[coordinate] = round(float(values[coordinate]), 6)
    boundary_value = values.get("boundary_polygon", campus.boundary_polygon)
    if boundary_value is not None:
        if not isinstance(boundary_value, list):
            raise ValueError("Ranh giới khuôn viên không hợp lệ")
        boundary: list[list[float]] = []
        for point in boundary_value:
            if not isinstance(point, list) or len(point) != 2:
                raise ValueError("Ranh giới phải gồm các cặp tọa độ kinh độ/vĩ độ")
            longitude, latitude = point
            if not isinstance(longitude, (int, float)) or not isinstance(
                latitude, (int, float)
            ):
                raise ValueError("Ranh giới phải gồm các cặp tọa độ kinh độ/vĩ độ")
            boundary.append([float(longitude), float(latitude)])
        outside_pois = [
            poi
            for poi in content_repository.list_active_pois(session, campus.id)
            if not is_inside_boundary(
                float(poi.latitude),
                float(poi.longitude),
                boundary,
            )
        ]
        if outside_pois:
            raise ValueError("Ranh giới mới phải bao gồm toàn bộ POI đang hoạt động")
    return content_repository.update_campus(session, campus, values)


def list_public_pois(session: Session, campus: Campus) -> list[POI]:
    return content_repository.list_active_pois(session, campus.id)


def get_public_poi(session: Session, poi_id: str) -> POI:
    poi = content_repository.get_poi(session, poi_id)
    if poi is None or not poi.is_active:
        raise LookupError("Không tìm thấy điểm tham quan")
    return poi


def create_poi(session: Session, campus: Campus, values: dict[str, object]) -> POI:
    normalized_values = dict(values)
    poi_id = str(uuid4())
    normalized_values["id"] = poi_id
    normalized_values["qr_code_url"] = f"/poi/{poi_id}"
    latitude = round(float(normalized_values["latitude"]), 6)
    longitude = round(float(normalized_values["longitude"]), 6)
    _validate_campus_boundary(campus, latitude, longitude)
    normalized_values["latitude"] = latitude
    normalized_values["longitude"] = longitude
    return content_repository.create_poi(session, campus, normalized_values)


def update_poi(
    session: Session,
    campus: Campus,
    poi_id: str,
    values: dict[str, object],
) -> POI:
    poi = content_repository.get_poi(session, poi_id)
    if poi is None:
        raise LookupError("Không tìm thấy điểm tham quan")
    if not values:
        raise ValueError("Cần cung cấp ít nhất một trường cần cập nhật")

    normalized_values = dict(values)
    for coordinate in ("latitude", "longitude"):
        if coordinate in normalized_values:
            normalized_values[coordinate] = round(float(normalized_values[coordinate]), 6)
    latitude = float(normalized_values.get("latitude", poi.latitude))
    longitude = float(normalized_values.get("longitude", poi.longitude))
    _validate_campus_boundary(campus, latitude, longitude)
    return content_repository.update_poi(session, poi, campus, normalized_values)


def soft_delete_poi(
    session: Session,
    campus: Campus,
    poi_id: str,
) -> None:
    poi = content_repository.get_poi(session, poi_id)
    if poi is None:
        raise LookupError("Không tìm thấy điểm tham quan")
    content_repository.soft_delete_poi(session, poi, campus)


def etag_for_version(version: str) -> str:
    return f'"{version}"'


def matches_etag(header: str | None, etag: str) -> bool:
    if header is None:
        return False
    requested = {item.strip() for item in header.split(",")}
    return "*" in requested or etag in requested or f"W/{etag}" in requested


def _validate_campus_boundary(
    campus: Campus,
    latitude: float,
    longitude: float,
) -> None:
    if campus.boundary_polygon and not is_inside_boundary(
        latitude,
        longitude,
        campus.boundary_polygon,
    ):
        raise ValueError("Tọa độ ngoài ranh giới Việt Nam Quốc Tự")