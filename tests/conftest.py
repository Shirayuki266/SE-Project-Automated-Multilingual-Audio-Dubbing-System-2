from collections.abc import Iterator
import os

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        _env_file=None,
        app_env="test",
        database_url=os.environ.get("TEST_DATABASE_URL", "sqlite://"),
        jwt_secret="test-jwt-secret-value-that-is-long-enough",
        refresh_token_secret="test-refresh-secret-that-is-also-long-enough",
        media_storage_path=tmp_path / "media",
        bootstrap_admin_username="admin",
        bootstrap_admin_email="admin@example.com",
        bootstrap_admin_password="Test-Strong-Password-123",
    )


@pytest.fixture
def app(settings: Settings):
    application = create_app(settings)
    yield application
    from app.data_access.entities.models import Base

    Base.metadata.drop_all(bind=application.state.engine)
    application.state.engine.dispose()


@pytest.fixture
def client(app) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_client(client: TestClient) -> TestClient:
    response = client.post(
        "/api/v1/auth/login",
        json={"login": "admin", "password": "Test-Strong-Password-123"},
    )
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {access_token}"})
    return client
