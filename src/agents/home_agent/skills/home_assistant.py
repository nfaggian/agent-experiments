"""Home Assistant skill module."""

from ..tools.homeassistant import (
    call_service,
    get_entity_state,
    list_entities,
    set_temperature,
    turn_off,
    turn_on,
)

INSTRUCTION = """
You can control the home through Home Assistant.
- Use list_entities to discover devices before acting.
- Prefer turn_on/turn_off for lights and switches.
- Use set_temperature for climate devices.
- Always confirm the room and device before changing state.
"""

TOOLS = [
    list_entities,
    get_entity_state,
    turn_on,
    turn_off,
    set_temperature,
    call_service,
]
