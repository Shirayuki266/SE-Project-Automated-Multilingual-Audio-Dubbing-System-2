from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    debug: bool = False
    database_url: str = "sqlite:///./vietnamquoctu.db"
    jwt_secret: str = "development-jwt-secret-change-before-deployment-1234567890"
    refresh_token_secret: str = "development-refresh-secret-change-before-deployment-abcdefghi"
    access_token_minutes: int = Field(default=15, ge=1, le=60)
    refresh_token_days: int = Field(default=7, ge=1, le=30)
    media_storage_path: Path = Path("var/media")
    public_base_url: str = "http://localhost:8000"
    bootstrap_admin_username: str | None = "admin"
    bootstrap_admin_email: str | None = "admin@vietnamquoctu.local"
    bootstrap_admin_password: str | None = "Admin123!@#2024"
    refresh_cookie_secure: bool = False

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.app_env.casefold() == "production":
            secrets_to_check = (self.jwt_secret, self.refresh_token_secret)
            if any(
                len(secret) < 32
                or secret.startswith(("development-", "replace-with-"))
                for secret in secrets_to_check
            ) or secrets_to_check[0] == secrets_to_check[1]:
                raise ValueError(
                    "Production JWT secrets must be unique random strings "
                    "containing at least 32 characters"
                )
        bootstrap_values = (
            self.bootstrap_admin_username,
            self.bootstrap_admin_email,
            self.bootstrap_admin_password,
        )
        if any(bootstrap_values) and not all(bootstrap_values):
            raise ValueError("All BOOTSTRAP_ADMIN_* values must be configured together")
        password_length = (
            len(self.bootstrap_admin_password.encode("utf-8"))
            if self.bootstrap_admin_password
            else 0
        )
        if self.bootstrap_admin_password and not 12 <= password_length <= 72:
            raise ValueError("Bootstrap admin password must be 12–72 bytes long")
        return self


def get_settings() -> Settings:
    return Settings()
