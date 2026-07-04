"""Load enabled skills and expose their tools to the agent."""

from __future__ import annotations

import importlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "skills.yaml"


@dataclass
class SkillConfig:
    name: str
    enabled: bool
    description: str
    module: str


def load_skills_config(path: Path | None = None) -> list[SkillConfig]:
    config_path = path or DEFAULT_CONFIG_PATH
    with config_path.open(encoding="utf-8") as config_file:
        raw = yaml.safe_load(config_file) or {}

    skills: list[SkillConfig] = []
    for entry in raw.get("skills", []):
        skills.append(
            SkillConfig(
                name=entry["name"],
                enabled=entry.get("enabled", True),
                description=entry.get("description", ""),
                module=entry["module"],
            )
        )
    return skills


def _import_skill_module(module_name: str) -> Any:
    return importlib.import_module(f".{module_name}", package=__package__)


def load_skill_tools(
    skills: list[SkillConfig] | None = None,
) -> tuple[list[Callable[..., Any]], list[str]]:
    """Return tool callables and instruction snippets for enabled skills."""

    configured_skills = skills or load_skills_config()
    tools: list[Callable[..., Any]] = []
    instructions: list[str] = []

    for skill in configured_skills:
        if not skill.enabled:
            continue

        module = _import_skill_module(skill.module)
        skill_tools = getattr(module, "TOOLS", [])
        tools.extend(skill_tools)

        skill_instruction = getattr(module, "INSTRUCTION", "")
        if skill_instruction:
            instructions.append(skill_instruction.strip())
        elif skill.description:
            instructions.append(skill.description.strip())

    return tools, instructions
