"""Tests for uv-based project configuration."""

from __future__ import annotations

from pathlib import Path

import tomllib

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_python_version_file_exists() -> None:
    version = (PROJECT_ROOT / ".python-version").read_text(encoding="utf-8").strip()
    assert version.startswith("3.13")


def test_uv_lock_is_committed() -> None:
    assert (PROJECT_ROOT / "uv.lock").is_file()
    assert "uv.lock" not in (PROJECT_ROOT / ".gitignore").read_text(encoding="utf-8")


def test_pyproject_configures_uv_default_groups() -> None:
    data = tomllib.loads((PROJECT_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    assert data["tool"]["uv"]["default-groups"] == ["dev"]
