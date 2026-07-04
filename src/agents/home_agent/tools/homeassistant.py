"""Home Assistant integration tools."""

from __future__ import annotations

import os
from typing import Any

import httpx

HA_URL = os.getenv("HOME_ASSISTANT_URL", "http://homeassistant.local:8123")
HA_TOKEN = os.getenv("HOME_ASSISTANT_TOKEN", "")


def _headers() -> dict[str, str]:
    if not HA_TOKEN:
        raise RuntimeError(
            "HOME_ASSISTANT_TOKEN is not set. Add it to your .env file."
        )
    return {
        "Authorization": f"Bearer {HA_TOKEN}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
    with httpx.Client(base_url=HA_URL, timeout=10.0) as client:
        response = client.request(method, path, headers=_headers(), json=payload)
        response.raise_for_status()
        if response.content:
            return response.json()
        return {"status": "ok"}


def list_entities(domain: str = "", area: str = "") -> list[dict[str, Any]]:
    """List Home Assistant entities, optionally filtered by domain or area name.

    Args:
        domain: Optional entity domain prefix (e.g. light, switch, climate).
        area: Optional area/room name to filter by.

    Returns:
        A list of entities with entity_id, friendly_name, state, and domain.
    """
    states = _request("GET", "/api/states")
    entities: list[dict[str, Any]] = []

    for state in states:
        entity_id = state.get("entity_id", "")
        entity_domain = entity_id.split(".", maxsplit=1)[0]
        attributes = state.get("attributes", {})
        friendly_name = attributes.get("friendly_name", entity_id)
        entity_area = attributes.get("area", "")

        if domain and entity_domain != domain:
            continue
        if area and area.lower() not in friendly_name.lower() and area.lower() not in entity_area.lower():
            continue

        entities.append(
            {
                "entity_id": entity_id,
                "friendly_name": friendly_name,
                "state": state.get("state"),
                "domain": entity_domain,
            }
        )

    return entities


def get_entity_state(entity_id: str) -> dict[str, Any]:
    """Get the current state of a Home Assistant entity.

    Args:
        entity_id: The entity ID (e.g. light.living_room).

    Returns:
        Entity state details including state and attributes.
    """
    state = _request("GET", f"/api/states/{entity_id}")
    return {
        "entity_id": state.get("entity_id", entity_id),
        "state": state.get("state"),
        "attributes": state.get("attributes", {}),
    }


def call_service(
    domain: str,
    service: str,
    entity_id: str = "",
    data: dict[str, Any] | None = None,
    confirm: str = "",
) -> dict[str, Any]:
    """Call a Home Assistant service to control a device.

    Args:
        domain: Service domain (light, switch, climate, scene, script).
        service: Service name (turn_on, turn_off, toggle, set_temperature).
        entity_id: Target entity ID.
        data: Optional extra service data (brightness, temperature, etc.).
        confirm: Set to 'yes' or 'confirmed' for actions that require confirmation.

    Returns:
        Result of the service call.
    """
    service_data: dict[str, Any] = dict(data or {})
    if entity_id:
        service_data["entity_id"] = entity_id

    result = _request(
        "POST",
        f"/api/services/{domain}/{service}",
        payload=service_data,
    )
    return {
        "status": "ok",
        "domain": domain,
        "service": service,
        "entity_id": entity_id,
        "result": result,
    }


def turn_on(entity_id: str, brightness: int | None = None) -> dict[str, Any]:
    """Turn on a light or switch.

    Args:
        entity_id: Target entity ID.
        brightness: Optional brightness level from 0-255 for lights.

    Returns:
        Service call result.
    """
    domain = entity_id.split(".", maxsplit=1)[0]
    data: dict[str, Any] = {}
    if brightness is not None:
        data["brightness"] = brightness
    return call_service(domain=domain, service="turn_on", entity_id=entity_id, data=data)


def turn_off(entity_id: str) -> dict[str, Any]:
    """Turn off a light or switch.

    Args:
        entity_id: Target entity ID.

    Returns:
        Service call result.
    """
    domain = entity_id.split(".", maxsplit=1)[0]
    return call_service(domain=domain, service="turn_off", entity_id=entity_id)


def set_temperature(entity_id: str, temperature: float) -> dict[str, Any]:
    """Set a climate entity target temperature in Celsius.

    Args:
        entity_id: Climate entity ID.
        temperature: Target temperature in Celsius.

    Returns:
        Service call result.
    """
    return call_service(
        domain="climate",
        service="set_temperature",
        entity_id=entity_id,
        data={"temperature": temperature},
    )
