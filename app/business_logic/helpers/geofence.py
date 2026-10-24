from math import atan2, cos, radians, sin, sqrt
from collections.abc import Sequence


EARTH_RADIUS_METERS = 6_371_000


def distance_meters(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    lat_a, lat_b = radians(latitude_a), radians(latitude_b)
    delta_latitude = radians(latitude_b - latitude_a)
    delta_longitude = radians(longitude_b - longitude_a)
    haversine = (
        sin(delta_latitude / 2) ** 2
        + cos(lat_a) * cos(lat_b) * sin(delta_longitude / 2) ** 2
    )
    angular_distance = 2 * atan2(sqrt(haversine), sqrt(1 - haversine))
    return EARTH_RADIUS_METERS * angular_distance


def is_inside_boundary(
    latitude: float,
    longitude: float,
    polygon: Sequence[Sequence[float]],
) -> bool:
    if len(polygon) < 3:
        return False

    inside = False
    previous_longitude, previous_latitude = polygon[-1]

    for current_longitude, current_latitude in polygon:
        crosses_latitude = (current_latitude > latitude) != (
            previous_latitude > latitude
        )
        if crosses_latitude:
            crossing_longitude = (
                (previous_longitude - current_longitude)
                * (latitude - current_latitude)
                / (previous_latitude - current_latitude)
                + current_longitude
            )
            if longitude > crossing_longitude:
                inside = not inside
        previous_longitude, previous_latitude = current_longitude, current_latitude

    return inside
