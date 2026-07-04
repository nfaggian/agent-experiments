"""Tests for weather ambience."""

from __future__ import annotations


import pytest
from fastapi.testclient import TestClient

from yale_lock.config import Settings
from yale_lock.weather import (
    TimeOfDay,
    WeatherCondition,
    time_of_day_from_hour,
    weather_condition_from_code,
)


@pytest.mark.parametrize(
    ("hour", "is_day", "expected"),
    [
        (3, None, TimeOfDay.NIGHT),
        (6, None, TimeOfDay.DAWN),
        (9, None, TimeOfDay.MORNING),
        (14, None, TimeOfDay.AFTERNOON),
        (19, None, TimeOfDay.EVENING),
        (22, None, TimeOfDay.NIGHT),
        (12, False, TimeOfDay.NIGHT),
    ],
)
def test_time_of_day_from_hour(hour: int, is_day: bool | None, expected: TimeOfDay) -> None:
    assert time_of_day_from_hour(hour, is_day=is_day) == expected


@pytest.mark.parametrize(
    ("code", "expected"),
    [
        (0, WeatherCondition.CLEAR),
        (2, WeatherCondition.PARTLY_CLOUDY),
        (3, WeatherCondition.CLOUDY),
        (45, WeatherCondition.FOG),
        (61, WeatherCondition.RAIN),
        (71, WeatherCondition.SNOW),
        (95, WeatherCondition.STORM),
    ],
)
def test_weather_condition_from_code(code: int, expected: WeatherCondition) -> None:
    assert weather_condition_from_code(code) == expected


def test_ambience_endpoint(test_client: TestClient) -> None:
    response = test_client.get("/api/ambience")
    assert response.status_code == 200
    payload = response.json()
    assert "time_of_day" in payload
    assert "weather" in payload
    assert "provider" in payload
    assert payload["time_of_day"] in {item.value for item in TimeOfDay}


def test_settings_prefers_bom_when_configured() -> None:
    settings = Settings(
        WEATHER_PROVIDER="auto",
        BOM_PRODUCT_ID="IDN60801",
        BOM_STATION_ID="94768",
    )
    assert settings.resolved_weather_provider == "bom"
    assert settings.weather_configured is True


def test_settings_open_meteo_provider() -> None:
    settings = Settings(
        WEATHER_PROVIDER="open_meteo",
        WEATHER_LATITUDE=-33.9,
        WEATHER_LONGITUDE=151.2,
    )
    assert settings.resolved_weather_provider == "open_meteo"
    assert settings.weather_configured is True
