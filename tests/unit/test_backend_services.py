import pytest
from pydantic import ValidationError

from app.business_logic.helpers.geofence import distance_meters, is_inside_boundary
from app.business_logic.services.audio_stream_service import (
    InvalidByteRange,
    parse_byte_range,
)
from app.config import Settings


def test_haversine_distance_is_zero_for_same_point() -> None:
    assert distance_meters(10.7769, 106.6672, 10.7769, 106.6672) == 0


def test_haversine_distance_between_nearby_points() -> None:
    distance = distance_meters(0, 0, 0, 0.001)
    assert 110 < distance < 112


def test_point_in_polygon_checks_longitude_latitude_order() -> None:
    polygon = [(106.0, 10.0), (107.0, 10.0), (107.0, 11.0), (106.0, 11.0)]
    assert is_inside_boundary(10.5, 106.5, polygon)
    assert not is_inside_boundary(11.5, 106.5, polygon)


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        ("bytes=0-4", (0, 4)),
        ("bytes=5-", (5, 9)),
        ("bytes=-3", (7, 9)),
        ("bytes=8-50", (8, 9)),
    ],
)
def test_parse_byte_range(header: str, expected: tuple[int, int]) -> None:
    assert parse_byte_range(header, 10) == expected


@pytest.mark.parametrize("header", ["items=0-1", "bytes=10-", "bytes=7-3", "bytes=1-2,4-5"])
def test_reject_unsatisfiable_or_multiple_byte_ranges(header: str) -> None:
    with pytest.raises(InvalidByteRange):
        parse_byte_range(header, 10)


def test_production_requires_distinct_strong_jwt_secrets() -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            app_env="production",
            jwt_secret="short-secret",
            refresh_token_secret="another-short-secret",
        )
