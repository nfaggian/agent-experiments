from __future__ import annotations

from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient

from delta_command.main import app
from delta_command.metrics import compute_dashboard_metrics
from delta_command.models import Database
from delta_command.store import load_database, reset_database


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    config = tmp_path / "data.yaml"
    runtime = tmp_path / "runtime.yaml"
    source = Path(__file__).resolve().parents[1] / "config" / "data.yaml"
    config.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setenv("DELTA_CONFIG_PATH", str(config))
    monkeypatch.setenv("DELTA_RUNTIME_PATH", str(runtime))
    reset_database()
    return TestClient(app)


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dashboard_metrics(client: TestClient) -> None:
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    payload = response.json()
    assert payload["teamSize"] == 8
    assert payload["activeOpportunities"] == 6


def test_opportunity_stage_update(client: TestClient) -> None:
    response = client.patch("/api/opportunities", json={"id": "opp-4", "stage": "qualified"})
    assert response.status_code == 200
    assert response.json()["stage"] == "qualified"


def test_reset_restores_yaml_seed(client: TestClient) -> None:
    client.patch("/api/opportunities", json={"id": "opp-4", "stage": "won"})
    client.post("/api/reset")
    response = client.get("/api/opportunities")
    opp = next(item for item in response.json() if item["id"] == "opp-4")
    assert opp["stage"] == "prospect"


def test_compute_dashboard_metrics_from_yaml() -> None:
    config = Path(__file__).resolve().parents[1] / "config" / "data.yaml"
    raw = yaml.safe_load(config.read_text(encoding="utf-8"))
    db = Database.model_validate(raw)
    metrics = compute_dashboard_metrics(db)
    assert metrics.team_size == 8
