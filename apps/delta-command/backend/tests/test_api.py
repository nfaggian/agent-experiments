from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from delta_command.json_db import load_json

from delta_command.main import app
from delta_command.metrics import compute_dashboard_metrics
from delta_command.models import Database
from delta_command.store import load_database, reset_database


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    config = tmp_path / "data.json"
    runtime = tmp_path / "runtime.json"
    source = Path(__file__).resolve().parents[1] / "config" / "data.json"
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


def test_reset_restores_json_seed(client: TestClient) -> None:
    client.patch("/api/opportunities", json={"id": "opp-4", "stage": "won"})
    client.post("/api/reset")
    response = client.get("/api/opportunities")
    opp = next(item for item in response.json() if item["id"] == "opp-4")
    assert opp["stage"] == "prospect"


def test_compute_dashboard_metrics_from_json() -> None:
    config = Path(__file__).resolve().parents[1] / "config" / "data.json"
    raw = load_json(config)
    db = Database.model_validate(raw)
    metrics = compute_dashboard_metrics(db)
    assert metrics.team_size == 8


def test_utilization_timeline(client: TestClient) -> None:
    response = client.get("/api/utilization/timeline")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["weeks"]) == 8
    assert len(payload["rows"]) == 8
    assert payload["rows"][0]["cells"][0]["utilization"] >= 0


def test_utilization_timeline_update(client: TestClient) -> None:
    timeline = client.get("/api/utilization/timeline").json()
    row = timeline["rows"][0]
    week = timeline["weeks"][0]["weekStart"]
    response = client.patch(
        "/api/utilization/timeline",
        json={
            "engineerId": row["engineerId"],
            "weekStart": week,
            "utilization": 72,
        },
    )
    assert response.status_code == 200
    updated_row = response.json()["rows"][0]
    assert updated_row["cells"][0]["utilization"] == 72

