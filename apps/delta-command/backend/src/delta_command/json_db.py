from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

DEFAULT_SEED_PATH = Path(__file__).resolve().parents[2] / "config" / "data.json"
DEFAULT_RUNTIME_PATH = Path(__file__).resolve().parents[2] / "config" / "runtime.json"


def seed_path() -> Path:
    return Path(os.environ.get("DELTA_CONFIG_PATH", DEFAULT_SEED_PATH))


def runtime_path() -> Path:
    override = os.environ.get("DELTA_RUNTIME_PATH")
    if override:
        return Path(override)
    return DEFAULT_RUNTIME_PATH


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
