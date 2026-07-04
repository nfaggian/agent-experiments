"""Home voice agent with configurable skills and guardrails."""

from __future__ import annotations

import os

from google.adk.agents import Agent

from .guardrails.loader import create_guardrail_callbacks, load_guardrail_config
from .skills.loader import load_skill_tools

DEFAULT_MODEL = os.getenv("HOME_AGENT_MODEL", "gemini-2.0-flash-live-001")

BASE_INSTRUCTION = """
You are a helpful home assistant that controls smart home devices by voice.

Guidelines:
- Keep responses concise and conversational for voice.
- Confirm room and device names before making changes.
- If a request is ambiguous, ask a short clarifying question.
- Never attempt actions blocked by safety rules.
- When a routine or service call needs confirmation, ask the user to confirm.
"""

skill_tools, skill_instructions = load_skill_tools()
guardrail_callbacks = create_guardrail_callbacks(load_guardrail_config())

instruction_parts = [BASE_INSTRUCTION.strip()]
if skill_instructions:
    instruction_parts.append("Enabled skills:\n" + "\n".join(skill_instructions))

root_agent = Agent(
    model=DEFAULT_MODEL,
    name="home_voice_agent",
    description="Voice-controlled home assistant with skills and guardrails.",
    instruction="\n\n".join(instruction_parts),
    tools=skill_tools,
    **guardrail_callbacks,
)
