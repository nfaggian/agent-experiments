"""Bureau of Meteorology (bom.gov.au) observation feeds."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from yale_lock.weather import (
    TimeOfDay,
    WeatherCondition,
    WEATHER_LABELS,
    time_of_day_from_hour,
)

BOM_BASE_URL = "https://reg.bom.gov.au/fwo"


def bom_feed_url(product_id: str, station_id: str) -> str:
    return f"{BOM_BASE_URL}/{product_id}/{product_id}.{station_id}.json"


def parse_bom_timestamp(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y%m%d%H%M%S").replace(tzinfo=UTC)
    except ValueError:
        return None


def parse_bom_local_hour(local_date_time_full: str) -> int | None:
    if not local_date_time_full:
        return None
    try:
        return datetime.strptime(local_date_time_full, "%Y%m%d%H%M%S").hour
    except ValueError:
        return None


def parse_rain_trace(value: str | float | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip().lower()
    if not text or text in {"-", "trace"}:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return None


def bom_condition_from_observation(obs: dict[str, Any]) -> tuple[WeatherCondition, str]:
    weather_text = str(obs.get("weather") or "-").strip()
    cloud_text = str(obs.get("cloud") or "-").strip()
    combined = f"{weather_text} {cloud_text}".lower()
    rain_mm = parse_rain_trace(obs.get("rain_trace")) or 0.0

    if any(token in combined for token in ("thunder", "storm", "lightning")):
        condition = WeatherCondition.STORM
    elif rain_mm > 0.2 or any(token in combined for token in ("rain", "shower", "drizzle")):
        condition = WeatherCondition.RAIN
    elif any(token in combined for token in ("snow", "sleet", "hail")):
        condition = WeatherCondition.SNOW
    elif any(token in combined for token in ("fog", "mist", "haze")):
        condition = WeatherCondition.FOG
    elif any(token in combined for token in ("overcast", "cloudy", "mostly cloudy")):
        condition = WeatherCondition.CLOUDY
    elif any(token in combined for token in ("part", "few")):
        condition = WeatherCondition.PARTLY_CLOUDY
    else:
        condition = WeatherCondition.CLEAR

    if weather_text not in {"", "-"}:
        label = weather_text
    elif cloud_text not in {"", "-"}:
        label = cloud_text
    else:
        label = WEATHER_LABELS[condition]

    return condition, label


def parse_bom_payload(payload: dict[str, Any]) -> dict[str, Any]:
    observations = payload.get("observations") or {}
    rows = observations.get("data") or []
    if not rows:
        raise ValueError("BOM feed returned no observation data")

    latest = rows[0]
    header = (observations.get("header") or [{}])[0]

    condition, weather_label = bom_condition_from_observation(latest)
    local_hour = parse_bom_local_hour(str(latest.get("local_date_time_full") or ""))
    is_day = local_hour is not None and 6 <= local_hour < 20
    time_of_day = (
        time_of_day_from_hour(local_hour, is_day=is_day)
        if local_hour is not None
        else TimeOfDay.AFTERNOON
    )

    station_name = str(latest.get("name") or header.get("name") or "BOM station")
    product_id = str(header.get("ID") or latest.get("history_product") or "")
    station_id = str(latest.get("wmo") or "")

    apparent = latest.get("apparent_t")
    humidity = latest.get("rel_hum")
    wind_speed = latest.get("wind_spd_kmh")
    pressure = latest.get("press") or latest.get("press_qnh")
    wind_dir = latest.get("wind_dir")

    return {
        "time_of_day": time_of_day,
        "weather": condition,
        "weather_label": weather_label,
        "temperature_c": float(latest["air_temp"]) if latest.get("air_temp") is not None else None,
        "apparent_temperature_c": float(apparent) if apparent is not None else None,
        "humidity_percent": int(humidity) if humidity is not None else None,
        "wind_speed_kmh": int(wind_speed) if wind_speed is not None else None,
        "wind_direction": str(wind_dir) if wind_dir not in {None, "-"} else None,
        "rain_since_9am_mm": parse_rain_trace(latest.get("rain_trace")),
        "pressure_hpa": float(pressure) if pressure is not None else None,
        "is_day": is_day,
        "location_name": station_name,
        "station_name": station_name,
        "observation_time": parse_bom_timestamp(str(latest.get("aifstime_utc") or "")),
        "timezone": str(header.get("time_zone") or header.get("state_time_zone") or "Australia"),
        "provider": "bom",
        "source_url": bom_feed_url(product_id, station_id) if product_id and station_id else None,
        "cloud_cover": None,
    }


async def fetch_bom_observation(product_id: str, station_id: str) -> dict[str, Any]:
    url = bom_feed_url(product_id, station_id)
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers={"User-Agent": "home-dashboard/1.0"})
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
    return parse_bom_payload(payload)
