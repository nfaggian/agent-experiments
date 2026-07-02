"""Weather and time-of-day ambience for the dashboard background."""

from __future__ import annotations

import logging
from datetime import datetime
from enum import StrEnum
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from yale_lock.config import Settings
from yale_lock.models import AmbienceSnapshot

_LOGGER = logging.getLogger(__name__)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class TimeOfDay(StrEnum):
    NIGHT = "night"
    DAWN = "dawn"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


class WeatherCondition(StrEnum):
    CLEAR = "clear"
    PARTLY_CLOUDY = "partly-cloudy"
    CLOUDY = "cloudy"
    FOG = "fog"
    RAIN = "rain"
    SNOW = "snow"
    STORM = "storm"


WEATHER_LABELS = {
    WeatherCondition.CLEAR: "Clear",
    WeatherCondition.PARTLY_CLOUDY: "Partly cloudy",
    WeatherCondition.CLOUDY: "Cloudy",
    WeatherCondition.FOG: "Foggy",
    WeatherCondition.RAIN: "Rainy",
    WeatherCondition.SNOW: "Snowy",
    WeatherCondition.STORM: "Stormy",
}


def time_of_day_from_hour(hour: int, *, is_day: bool | None = None) -> TimeOfDay:
    if is_day is False or hour >= 21 or hour < 5:
        return TimeOfDay.NIGHT
    if hour < 7:
        return TimeOfDay.DAWN
    if hour < 12:
        return TimeOfDay.MORNING
    if hour < 17:
        return TimeOfDay.AFTERNOON
    if hour < 21:
        return TimeOfDay.EVENING
    return TimeOfDay.NIGHT


def weather_condition_from_code(code: int) -> WeatherCondition:
    if code == 0:
        return WeatherCondition.CLEAR
    if code in {1, 2}:
        return WeatherCondition.PARTLY_CLOUDY
    if code == 3:
        return WeatherCondition.CLOUDY
    if code in {45, 48}:
        return WeatherCondition.FOG
    if code in {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82}:
        return WeatherCondition.RAIN
    if code in {71, 73, 75, 77, 85, 86}:
        return WeatherCondition.SNOW
    if code in {95, 96, 99}:
        return WeatherCondition.STORM
    return WeatherCondition.CLOUDY


def build_ambience_snapshot(
    *,
    configured: bool,
    time_of_day: TimeOfDay,
    weather: WeatherCondition,
    temperature_c: float | None = None,
    cloud_cover: int | None = None,
    is_day: bool = True,
    timezone: str | None = None,
    location_name: str | None = None,
    local_time: datetime | None = None,
    message: str | None = None,
) -> AmbienceSnapshot:
    return AmbienceSnapshot(
        configured=configured,
        time_of_day=time_of_day.value,
        weather=weather.value,
        weather_label=WEATHER_LABELS[weather],
        temperature_c=temperature_c,
        cloud_cover=cloud_cover,
        is_day=is_day,
        timezone=timezone,
        location_name=location_name,
        local_time=local_time,
        message=message,
    )


class WeatherService:
    """Fetches local weather from Open-Meteo (no API key required)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._snapshot = build_ambience_snapshot(
            configured=settings.weather_configured,
            time_of_day=TimeOfDay.MORNING,
            weather=WeatherCondition.CLEAR,
            message="Weather location not configured",
        )

    @property
    def snapshot(self) -> AmbienceSnapshot:
        return self._snapshot

    async def refresh(self) -> AmbienceSnapshot:
        if not self._settings.weather_configured:
            now = datetime.now().astimezone()
            time_of_day = time_of_day_from_hour(now.hour)
            self._snapshot = build_ambience_snapshot(
                configured=False,
                time_of_day=time_of_day,
                weather=WeatherCondition.CLEAR,
                local_time=now,
                message="Set WEATHER_LATITUDE and WEATHER_LONGITUDE in .env",
            )
            return self._snapshot

        try:
            payload = await self._fetch_open_meteo()
            current = payload["current"]
            timezone = payload.get("timezone", "UTC")
            local_time = datetime.fromisoformat(current["time"]).replace(
                tzinfo=ZoneInfo(timezone)
            )
            weather_code = int(current["weather_code"])
            is_day = bool(current["is_day"])
            condition = weather_condition_from_code(weather_code)
            time_of_day = time_of_day_from_hour(local_time.hour, is_day=is_day)

            self._snapshot = build_ambience_snapshot(
                configured=True,
                time_of_day=time_of_day,
                weather=condition,
                temperature_c=float(current["temperature_2m"]),
                cloud_cover=int(current.get("cloud_cover", 0)),
                is_day=is_day,
                timezone=timezone,
                location_name=self._settings.weather_location_name or None,
                local_time=local_time,
            )
        except Exception as exc:
            _LOGGER.exception("Weather refresh failed")
            now = datetime.now().astimezone()
            self._snapshot = build_ambience_snapshot(
                configured=True,
                time_of_day=time_of_day_from_hour(now.hour),
                weather=WeatherCondition.CLOUDY,
                local_time=now,
                message=str(exc),
            )

        return self._snapshot

    async def _fetch_open_meteo(self) -> dict[str, Any]:
        params = {
            "latitude": self._settings.weather_latitude,
            "longitude": self._settings.weather_longitude,
            "current": "temperature_2m,is_day,weather_code,cloud_cover",
            "timezone": self._settings.weather_timezone or "auto",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            payload: dict[str, Any] = response.json()
            return payload
