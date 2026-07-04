from __future__ import annotations

import json
from pathlib import Path

import pytest

from delta_command.json_db import load_json, save_json


def test_save_json_writes_valid_json(tmp_path: Path) -> None:
    target = tmp_path / "store.json"
    payload = {"engineers": [{"id": "eng-1", "name": "Test"}]}
    save_json(target, payload)
    assert json.loads(target.read_text(encoding="utf-8")) == payload


def test_load_json_returns_empty_dict_for_missing_file(tmp_path: Path) -> None:
    assert load_json(tmp_path / "missing.json") == {}
