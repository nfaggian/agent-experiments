from __future__ import annotations

from pathlib import Path

import pytest

from delta_command.json_db import database_path, load_json, migrate_legacy_runtime, save_json


def test_save_json_writes_valid_json(tmp_path: Path) -> None:
    target = tmp_path / "store.json"
    payload = {"engineers": [{"id": "eng-1", "name": "Test"}]}
    save_json(target, payload)
    assert load_json(target) == payload


def test_load_json_returns_empty_dict_for_missing_file(tmp_path: Path) -> None:
    assert load_json(tmp_path / "missing.json") == {}


def test_migrate_legacy_runtime(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    data_file = tmp_path / "data.json"
    legacy_file = tmp_path / "runtime.json"
    legacy_file.write_text(
        '{"engineers":[{"id":"eng-1","name":"Legacy"}],"opportunities":[],"projects":[]}\n',
        encoding="utf-8",
    )
    monkeypatch.setattr("delta_command.json_db.LEGACY_RUNTIME_PATH", legacy_file)
    migrate_legacy_runtime(data_file)
    assert load_json(data_file)["engineers"][0]["name"] == "Legacy"
    assert not legacy_file.exists()


def test_database_path_prefers_delta_data_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    custom = tmp_path / "custom.json"
    monkeypatch.setenv("DELTA_DATA_PATH", str(custom))
    assert database_path() == custom
