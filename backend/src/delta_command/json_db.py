"""Atomic JSON file store for the Delta Command database."""

import json
import os
import tempfile
from pathlib import Path

DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "config" / "data.json"


def database_path() -> Path:
    return Path(os.environ.get("DELTA_DATA_PATH") or DEFAULT_DATA_PATH)


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8").strip()
    return json.loads(text) if text else {}


def save_json(path: Path, data: dict) -> None:
    """Write JSON atomically via a temp file in the same directory."""
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    fd, temp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.stem}-", suffix=".tmp")
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
