"""Application configuration."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from yalexs.const import Brand


class Settings(BaseSettings):
    """Home dashboard settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Yale lock
    yale_brand: str = Field(default="yale_access", alias="YALE_BRAND")
    yale_login_method: str = Field(default="email", alias="YALE_LOGIN_METHOD")
    yale_username: str = Field(default="", alias="YALE_USERNAME")
    yale_password: str = Field(default="", alias="YALE_PASSWORD")
    yale_lock_id: str = Field(
        default="",
        alias="YALE_LOCK_ID",
        description="Optional lock ID. Uses the first lock when empty.",
    )
    yale_auth_cache_file: Path = Field(
        default=Path(".yale_auth_cache"),
        alias="YALE_AUTH_CACHE_FILE",
    )
    yale_poll_interval_seconds: float = Field(
        default=15.0,
        alias="YALE_POLL_INTERVAL_SECONDS",
    )
    yale_activity_limit: int = Field(default=25, alias="YALE_ACTIVITY_LIMIT")

    # UniFi Protect
    unifi_host: str = Field(default="", alias="UNIFI_HOST")
    unifi_port: int = Field(default=443, alias="UNIFI_PORT")
    unifi_username: str = Field(default="", alias="UNIFI_USERNAME")
    unifi_password: str = Field(default="", alias="UNIFI_PASSWORD")
    unifi_api_key: str = Field(default="", alias="UNIFI_API_KEY")
    unifi_verify_ssl: bool = Field(default=False, alias="UNIFI_VERIFY_SSL")
    unifi_camera_id: str = Field(
        default="",
        alias="UNIFI_CAMERA_ID",
        description="Optional camera ID. Uses the first camera when empty.",
    )
    unifi_snapshot_width: int = Field(default=1280, alias="UNIFI_SNAPSHOT_WIDTH")
    unifi_snapshot_height: int = Field(default=720, alias="UNIFI_SNAPSHOT_HEIGHT")
    unifi_snapshot_refresh_seconds: float = Field(
        default=2.0,
        alias="UNIFI_SNAPSHOT_REFRESH_SECONDS",
    )

    # Web server
    dashboard_host: str = Field(default="127.0.0.1", alias="DASHBOARD_HOST")
    dashboard_port: int = Field(default=8080, alias="DASHBOARD_PORT")

    @field_validator("yale_brand")
    @classmethod
    def validate_yale_brand(cls, value: str) -> str:
        allowed = {brand.value for brand in Brand}
        if value not in allowed:
            allowed_list = ", ".join(sorted(allowed))
            raise ValueError(f"YALE_BRAND must be one of: {allowed_list}")
        return value

    @property
    def yale_brand_enum(self) -> Brand:
        return Brand(self.yale_brand)

    @property
    def yale_configured(self) -> bool:
        return bool(self.yale_username and self.yale_password)

    @property
    def unifi_configured(self) -> bool:
        return bool(self.unifi_host and self.unifi_username and self.unifi_password)
