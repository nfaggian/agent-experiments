from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from delta_command.json_db import load_json
from delta_command.main import app
from delta_command.metrics import compute_dashboard_metrics
from delta_command.models import Database


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    data_file = tmp_path / "data.json"
    source = Path(__file__).resolve().parents[1] / "config" / "data.json"
    data_file.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setenv("DELTA_DATA_PATH", str(data_file))
    return TestClient(app)


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["datastore"] == "json"
    assert payload["path"].endswith("data.json")


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


def test_opportunity_stage_update_persists_to_disk(client: TestClient) -> None:
    path = Path(client.get("/api/health").json()["path"])
    client.patch("/api/opportunities", json={"id": "opp-4", "stage": "won"})
    on_disk = load_json(path)
    opp = next(item for item in on_disk["opportunities"] if item["id"] == "opp-4")
    assert opp["stage"] == "won"


def test_project_status_update_persists_to_disk(client: TestClient) -> None:
    path = Path(client.get("/api/health").json()["path"])
    response = client.patch("/api/projects", json={"id": "proj-1", "status": "at_risk"})
    assert response.status_code == 200
    on_disk = load_json(path)
    project = next(item for item in on_disk["projects"] if item["id"] == "proj-1")
    assert project["status"] == "at_risk"


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


def test_utilization_timeline_update_persists_to_disk(client: TestClient) -> None:
    path = Path(client.get("/api/health").json()["path"])
    timeline = client.get("/api/utilization/timeline").json()
    row = timeline["rows"][0]
    week = timeline["weeks"][0]["weekStart"]
    client.patch(
        "/api/utilization/timeline",
        json={
            "engineerId": row["engineerId"],
            "weekStart": week,
            "utilization": 81,
        },
    )
    on_disk = load_json(path)
    engineer = next(item for item in on_disk["engineers"] if item["id"] == row["engineerId"])
    cell = next(item for item in engineer["utilizationTimeline"] if item["weekStart"] == week)
    assert cell["utilization"] == 81
