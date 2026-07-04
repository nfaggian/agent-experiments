"""Tests for Bureau of Meteorology weather parsing."""

from __future__ import annotations

from yale_lock.bom_weather import (
    bom_condition_from_observation,
    bom_feed_url,
    parse_bom_payload,
    parse_bom_timestamp,
    parse_rain_trace,
)


SAMPLE_BOM_PAYLOAD = {
    "observations": {
        "header": [
            {
                "ID": "IDN60801",
                "name": "Sydney - Observatory Hill",
                "time_zone": "EST",
                "state_time_zone": "NSW",
            }
        ],
        "data": [
            {
                "sort_order": 0,
                "wmo": 94768,
                "name": "Sydney - Observatory Hill",
                "history_product": "IDN60801",
                "local_date_time_full": "20260702133000",
                "aifstime_utc": "20260702033000",
                "air_temp": 22.3,
                "apparent_t": 18.3,
                "rel_hum": 43,
                "wind_dir": "NW",
                "wind_spd_kmh": 20,
                "press": 1012.7,
                "rain_trace": "0.0",
                "weather": "-",
                "cloud": "-",
            }
        ],
    }
}


def test_bom_feed_url() -> None:
    assert (
        bom_feed_url("IDN60801", "94768")
        == "https://reg.bom.gov.au/fwo/IDN60801/IDN60801.94768.json"
    )


def test_parse_bom_timestamp() -> None:
    parsed = parse_bom_timestamp("20260702033000")
    assert parsed is not None
    assert parsed.year == 2026
    assert parsed.month == 7
    assert parsed.day == 2


def test_parse_rain_trace() -> None:
    assert parse_rain_trace("0.0") == 0.0
    assert parse_rain_trace("trace") == 0.0
    assert parse_rain_trace("2.4") == 2.4


def test_bom_condition_from_observation_rain() -> None:
    condition, label = bom_condition_from_observation(
        {"weather": "Showers", "cloud": "Partly cloudy", "rain_trace": "1.2"}
    )
    assert condition.value == "rain"
    assert label == "Showers"


def test_parse_bom_payload() -> None:
    parsed = parse_bom_payload(SAMPLE_BOM_PAYLOAD)
    assert parsed["provider"] == "bom"
    assert parsed["temperature_c"] == 22.3
    assert parsed["humidity_percent"] == 43
    assert parsed["wind_direction"] == "NW"
    assert parsed["station_name"] == "Sydney - Observatory Hill"
    assert parsed["source_url"].endswith("IDN60801.94768.json")
