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

    # Weather / ambience background
    weather_provider: str = Field(
        default="auto",
        alias="WEATHER_PROVIDER",
        description="Weather source: auto, bom, or open_meteo",
    )
    weather_latitude: float | None = Field(default=None, alias="WEATHER_LATITUDE")
    weather_longitude: float | None = Field(default=None, alias="WEATHER_LONGITUDE")
    weather_location_name: str = Field(default="", alias="WEATHER_LOCATION_NAME")
    weather_timezone: str = Field(default="auto", alias="WEATHER_TIMEZONE")
    weather_refresh_seconds: float = Field(default=900.0, alias="WEATHER_REFRESH_SECONDS")
    bom_product_id: str = Field(
        default="",
        alias="BOM_PRODUCT_ID",
        description="BOM observation product ID, e.g. IDN60801 for NSW",
    )
    bom_station_id: str = Field(
        default="",
        alias="BOM_STATION_ID",
        description="BOM station WMO ID from the JSON feed URL, e.g. 94768",
    )

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

    @field_validator("weather_provider")
    @classmethod
    def validate_weather_provider(cls, value: str) -> str:
        allowed = {"auto", "bom", "open_meteo"}
        normalized = value.strip().lower()
        if normalized not in allowed:
            allowed_list = ", ".join(sorted(allowed))
            raise ValueError(f"WEATHER_PROVIDER must be one of: {allowed_list}")
        return normalized

    @property
    def bom_configured(self) -> bool:
        return bool(self.bom_product_id and self.bom_station_id)

    @property
    def open_meteo_configured(self) -> bool:
        return self.weather_latitude is not None and self.weather_longitude is not None

    @property
    def resolved_weather_provider(self) -> str:
        if self.weather_provider == "bom":
            return "bom"
        if self.weather_provider == "open_meteo":
            return "open_meteo"
        if self.bom_configured:
            return "bom"
        return "open_meteo"

    @property
    def weather_configured(self) -> bool:
        if self.weather_provider == "bom":
            return self.bom_configured
        if self.weather_provider == "open_meteo":
            return self.open_meteo_configured
        return self.bom_configured or self.open_meteo_configured
