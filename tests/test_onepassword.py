"""Tests for 1Password dashboard integration."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_ENV = PROJECT_ROOT / ".env.1password.example"
RUN_SCRIPT = PROJECT_ROOT / "scripts" / "run-dashboard-1password.sh"

SECRET_KEYS = {
    "YALE_USERNAME",
    "YALE_PASSWORD",
    "UNIFI_USERNAME",
    "UNIFI_PASSWORD",
}


def _parse_env_lines(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        key, _, value = stripped.partition("=")
        values[key.strip()] = value.strip().strip('"')
    return values


def test_onepassword_example_env_exists() -> None:
    assert EXAMPLE_ENV.is_file()


def test_onepassword_run_script_exists() -> None:
    assert RUN_SCRIPT.is_file()
    assert RUN_SCRIPT.stat().st_mode & 0o111, "run-dashboard-1password.sh must be executable"
    content = RUN_SCRIPT.read_text(encoding="utf-8")
    assert "uv sync" in content
    assert "uv run home-dashboard" in content


def test_onepassword_example_uses_secret_references_for_credentials() -> None:
    values = _parse_env_lines(EXAMPLE_ENV)

    for key in SECRET_KEYS:
        assert key in values, f"{key} missing from {EXAMPLE_ENV.name}"
        assert values[key].startswith("op://"), (
            f"{key} should use a 1Password secret reference (op://...)"
        )
