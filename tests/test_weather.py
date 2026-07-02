"""Tests for weather ambience."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

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
    assert payload["time_of_day"] in {item.value for item in TimeOfDay}
