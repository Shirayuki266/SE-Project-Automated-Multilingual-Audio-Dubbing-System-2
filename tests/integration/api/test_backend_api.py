from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.data_access.entities.models import POIMedia


POI_PAYLOAD = {
    "title_vi": "Đại Chánh Điện",
    "title_en": "Main Hall",
    "description_vi": "Mô tả tiếng Việt.",
    "description_en": "English description.",
    "latitude": 10.77691234,
    "longitude": 106.66721234,
    "geofence_radius": 30,
    "location_type": "INDOOR",
}


def _create_poi(client: TestClient) -> dict:
    response = client.post("/api/v1/admin/pois", json=POI_PAYLOAD)
    assert response.status_code == 201, response.text
    return response.json()


def test_public_cache_qr_cold_start_and_soft_delete(admin_client: TestClient) -> None:
    client = admin_client
    poi = _create_poi(client)
    assert poi["latitude"] == 10.776912
    assert poi["longitude"] == 106.667212
    assert poi["qr_code_url"] == f"/poi/{poi['id']}"

    listing = client.get("/api/v1/campuses/viet-nam-quoc-tu/pois")
    assert listing.status_code == 200
    etag = listing.headers["ETag"]
    assert len(listing.json()["pois"]) == 1
    assert client.get(
        "/api/v1/campuses/viet-nam-quoc-tu/pois",
        headers={"If-None-Match": etag},
    ).status_code == 304

    deep_link = client.get(f"/api/v1/pois/{poi['id']}")
    assert deep_link.status_code == 200
    assert deep_link.json()["poi"]["id"] == poi["id"]
    assert [item["id"] for item in deep_link.json()["pois"]] == [poi["id"]]

    qr = client.get(f"/api/v1/admin/pois/{poi['id']}/qrcode")
    assert qr.status_code == 200
    assert qr.headers["content-type"].startswith("image/svg+xml")
    assert b"<svg" in qr.content
    qr_png = client.get(
        f"/api/v1/admin/pois/{poi['id']}/qrcode",
        params={"output_format": "png"},
    )
    assert qr_png.status_code == 200
    with Image.open(BytesIO(qr_png.content)) as qr_image:
        assert qr_image.size == (1000, 1000)

    updated = client.put(
        f"/api/v1/admin/pois/{poi['id']}",
        json={"title_en": "Main Prayer Hall"},
    )
    assert updated.status_code == 200
    assert updated.json()["title_en"] == "Main Prayer Hall"
    new_version = client.get("/api/v1/campuses/viet-nam-quoc-tu/version").json()
    assert new_version["version"] != listing.json()["data_version"]

    assert client.delete(f"/api/v1/admin/pois/{poi['id']}").status_code == 204
    assert client.get(f"/api/v1/pois/{poi['id']}").status_code == 404
    assert client.get("/api/v1/campuses/viet-nam-quoc-tu/pois").json()["pois"] == []


def test_poi_management_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/admin/pois", json=POI_PAYLOAD)
    assert response.status_code == 401


def test_poi_validation_and_boundary_validation(admin_client: TestClient) -> None:
    _create_poi(admin_client)
    invalid_radius = admin_client.post(
        "/api/v1/admin/pois",
        json=POI_PAYLOAD | {"geofence_radius": 101},
    )
    assert invalid_radius.status_code == 422

    boundary = admin_client.put(
        "/api/v1/admin/campuses/viet-nam-quoc-tu",
        json={
            "boundary_polygon": [
                [106.0, 10.0],
                [107.0, 10.0],
                [107.0, 11.0],
                [106.0, 11.0],
            ]
        },
    )
    assert boundary.status_code == 200, boundary.text
    public_campus = admin_client.get("/api/v1/campuses/viet-nam-quoc-tu")
    assert public_campus.status_code == 200
    assert public_campus.json()["status"] == "ACTIVE"

    outside = admin_client.post(
        "/api/v1/admin/pois",
        json=POI_PAYLOAD | {"latitude": 12, "longitude": 106.5},
    )
    assert outside.status_code == 400
    assert outside.json()["detail"] == "Tọa độ ngoài ranh giới Việt Nam Quốc Tự"

    boundary_excluding_existing_poi = admin_client.put(
        "/api/v1/admin/campuses/viet-nam-quoc-tu",
        json={
            "boundary_polygon": [
                [110.0, 10.0],
                [111.0, 10.0],
                [111.0, 11.0],
                [110.0, 11.0],
            ]
        },
    )
    assert boundary_excluding_existing_poi.status_code == 400


def test_login_lockout_refresh_rotation_and_logout(client: TestClient) -> None:
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"login": "admin", "password": "wrong-password"},
        )
        assert response.status_code == 401

    locked = client.post(
        "/api/v1/auth/login",
        json={"login": "admin", "password": "Test-Strong-Password-123"},
    )
    assert locked.status_code == 401


def test_refresh_token_rotation_and_logout(admin_client: TestClient) -> None:
    client = admin_client
    original_refresh = client.cookies.get("refresh_token")
    assert original_refresh is not None

    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200
    rotated_refresh = client.cookies.get("refresh_token")
    assert rotated_refresh != original_refresh

    client.cookies.set("refresh_token", original_refresh, path="/api/v1/auth")
    assert client.post("/api/v1/auth/refresh").status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"login": "admin", "password": "Test-Strong-Password-123"},
    )
    assert login.status_code == 200
    client.headers.update({"Authorization": f"Bearer {login.json()['access_token']}"})
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_upload_and_serve_poi_image(admin_client: TestClient) -> None:
    poi = _create_poi(admin_client)
    image_data = BytesIO()
    Image.new("RGB", (2, 2), color="red").save(image_data, format="PNG")
    invalid_upload = admin_client.post(
        f"/api/v1/admin/pois/{poi['id']}/media",
        data={"media_type": "IMAGE"},
        files={"file": ("fake.png", b"not an image", "image/png")},
    )
    assert invalid_upload.status_code == 400

    uploaded = admin_client.post(
        f"/api/v1/admin/pois/{poi['id']}/media",
        data={"media_type": "IMAGE"},
        files={"file": ("hall.png", image_data.getvalue(), "image/png")},
    )
    assert uploaded.status_code == 201, uploaded.text
    media = uploaded.json()
    response = admin_client.get(media["file_url"])
    assert response.status_code == 200
    with Image.open(BytesIO(response.content)) as served_image:
        assert served_image.getpixel((0, 0)) == (255, 0, 0)


def test_audio_range_streaming(admin_client: TestClient) -> None:
    poi = _create_poi(admin_client)
    audio_data = b"0123456789"
    settings = admin_client.app.state.settings
    settings.media_storage_path.mkdir(parents=True, exist_ok=True)
    (settings.media_storage_path / "test.mp3").write_bytes(audio_data)
    session_factory = admin_client.app.state.session_factory
    with session_factory() as session:
        session.add(
            POIMedia(
                id="audio-test",
                poi_id=poi["id"],
                media_type="AUDIO_VI",
                file_url="/api/v1/media/audio/audio-test",
                storage_key="test.mp3",
                file_size=len(audio_data),
            )
        )
        session.commit()

    response = admin_client.get(
        "/api/v1/media/audio/audio-test",
        headers={"Range": "bytes=2-5"},
    )
    assert response.status_code == 206
    assert response.content == b"2345"
    assert response.headers["Content-Range"] == "bytes 2-5/10"
    invalid_range = admin_client.get(
        "/api/v1/media/audio/audio-test",
        headers={"Range": "bytes=20-"},
    )
    assert invalid_range.status_code == 416
    assert invalid_range.headers["Content-Range"] == "bytes */10"


def test_listening_analytics(client: TestClient, admin_client: TestClient) -> None:
    poi = _create_poi(admin_client)
    event = client.post(
        "/api/v1/analytics/listening",
        json={
            "poi_id": poi["id"],
            "language_code": "vi",
            "trigger_source": "QR_CODE",
            "duration_listened_seconds": 90,
            "completed": True,
        },
    )
    assert event.status_code == 201, event.text
    assert event.json()["poi_id"] == poi["id"]
