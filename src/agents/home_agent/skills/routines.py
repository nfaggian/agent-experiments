"""Predefined home routines skill module."""

from __future__ import annotations

from typing import Any

from ..tools.homeassistant import call_service

ROUTINES: dict[str, dict[str, Any]] = {
    "goodnight": {
        "description": "Turn off living room lights and lower bedroom temperature",
        "actions": [
            {"domain": "light", "service": "turn_off", "entity_id": "light.living_room"},
            {"domain": "climate", "service": "set_temperature", "entity_id": "climate.bedroom", "data": {"temperature": 20}},
        ],
    },
    "away": {
        "description": "Turn off all lights",
        "actions": [
            {"domain": "light", "service": "turn_off", "entity_id": "light.all_lights"},
        ],
    },
    "movie_mode": {
        "description": "Dim living room lights for movie watching",
        "actions": [
            {"domain": "light", "service": "turn_on", "entity_id": "light.living_room", "data": {"brightness": 40}},
        ],
    },
}


def list_routines() -> list[dict[str, str]]:
    """List available home routines and what they do.

    Returns:
        Routine names and descriptions.
    """
    return [
        {"name": name, "description": routine["description"]}
        for name, routine in ROUTINES.items()
    ]


def run_routine(routine_name: str, confirm: str = "") -> dict[str, Any]:
    """Run a predefined home routine.

    Args:
        routine_name: One of goodnight, away, movie_mode.
        confirm: Set to 'yes' or 'confirmed' before running the routine.

    Returns:
        Results of each action in the routine.
    """
    routine = ROUTINES.get(routine_name.lower())
    if not routine:
        return {
            "error": f"Unknown routine '{routine_name}'.",
            "available": list(ROUTINES.keys()),
        }

    results: list[dict[str, Any]] = []
    for action in routine["actions"]:
        result = call_service(
            domain=action["domain"],
            service=action["service"],
            entity_id=action.get("entity_id", ""),
            data=action.get("data"),
            confirm=confirm,
        )
        results.append(result)

    return {"routine": routine_name, "status": "ok", "actions": results}


INSTRUCTION = """
You can run predefined routines: goodnight, away, and movie_mode.
Use list_routines to show options. Routines that change multiple devices
require explicit user confirmation.
"""

TOOLS = [list_routines, run_routine]
