from __future__ import annotations

from pathlib import Path

import pytest

from delta_command.json_db import database_path, load_json, save_json


def test_save_json_writes_valid_json(tmp_path: Path) -> None:
    target = tmp_path / "store.json"
    payload = {"engineers": [{"id": "eng-1", "name": "Test"}]}
    save_json(target, payload)
    assert load_json(target) == payload


def test_load_json_returns_empty_dict_for_missing_file(tmp_path: Path) -> None:
    assert load_json(tmp_path / "missing.json") == {}


def test_database_path_prefers_delta_data_path(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    custom = tmp_path / "custom.json"
    monkeypatch.setenv("DELTA_DATA_PATH", str(custom))
    assert database_path() == custom
