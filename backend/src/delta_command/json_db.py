from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "config" / "data.json"
LEGACY_RUNTIME_PATH = Path(__file__).resolve().parents[2] / "config" / "runtime.json"


def database_path() -> Path:
    override = os.environ.get("DELTA_DATA_PATH") or os.environ.get("DELTA_CONFIG_PATH")
    if override:
        return Path(override)
    return DEFAULT_DATA_PATH


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return {}
    return json.loads(text)


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    fd, temp_name = tempfile.mkstemp(
        dir=path.parent,
        prefix=f".{path.stem}-",
        suffix=".tmp",
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        temp_path.replace(path)
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)


def migrate_legacy_runtime(data_path: Path | None = None) -> None:
    """One-time migration: merge legacy runtime.json into the single data file."""
    target = data_path or database_path()
    legacy = LEGACY_RUNTIME_PATH
    if not legacy.exists():
        return
    legacy_data = load_json(legacy)
    if not legacy_data.get("engineers"):
        legacy.unlink(missing_ok=True)
        return
    save_json(target, legacy_data)
    legacy.unlink(missing_ok=True)
