"""Tests for the Mobile API endpoints."""

import pytest
from fastapi.testclient import TestClient

from src.mobile_api.app import app
from src.agents.home_security_agent.tools.device_tools import _device_state


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_device_state() -> None:
    """Reset device state before each test."""
    # Reset locks
    for lock in _device_state["locks"].values():
        lock["is_locked"] = True
    _device_state["locks"]["garage_door"]["is_locked"] = False
    
    # Reset cameras
    for camera in _device_state["cameras"].values():
        camera["is_online"] = True
    _device_state["cameras"]["garage_interior"]["is_online"] = False
    
    # Reset security system
    _device_state["security_system"]["is_armed"] = False
    _device_state["security_system"]["arm_mode"] = "disarmed"


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client: TestClient) -> None:
        """Test health check returns healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data


class TestSummaryEndpoint:
    """Tests for home summary endpoint."""

    def test_get_summary(self, client: TestClient) -> None:
        """Test getting home summary."""
        response = client.get("/api/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert "security_score" in data
        assert "locks" in data
        assert "cameras" in data
        assert "sensors" in data


class TestLockEndpoints:
    """Tests for lock management endpoints."""

    def test_list_all_locks(self, client: TestClient) -> None:
        """Test listing all locks."""
        response = client.get("/api/locks")
        
        assert response.status_code == 200
        data = response.json()
        assert "locks" in data
        assert data["total_locks"] == 4

    def test_get_single_lock(self, client: TestClient) -> None:
        """Test getting a single lock."""
        response = client.get("/api/locks/front_door")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Front Door"

    def test_get_invalid_lock(self, client: TestClient) -> None:
        """Test getting an invalid lock returns 404."""
        response = client.get("/api/locks/nonexistent")
        
        assert response.status_code == 404

    def test_lock_door(self, client: TestClient) -> None:
        """Test locking a door."""
        _device_state["locks"]["front_door"]["is_locked"] = False
        
        response = client.post("/api/locks/front_door/lock")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_unlock_door_without_confirmation(self, client: TestClient) -> None:
        """Test unlocking without confirmation."""
        response = client.post(
            "/api/locks/front_door/unlock",
            json={"confirm": False}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False

    def test_unlock_door_with_confirmation(self, client: TestClient) -> None:
        """Test unlocking with confirmation."""
        response = client.post(
            "/api/locks/front_door/unlock",
            json={"confirm": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_lock_all_doors(self, client: TestClient) -> None:
        """Test locking all doors."""
        response = client.post("/api/locks/lock-all")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "locked" in data["message"].lower()


class TestCameraEndpoints:
    """Tests for camera monitoring endpoints."""

    def test_list_all_cameras(self, client: TestClient) -> None:
        """Test listing all cameras."""
        response = client.get("/api/cameras")
        
        assert response.status_code == 200
        data = response.json()
        assert "cameras" in data
        assert data["total_cameras"] == 4

    def test_get_single_camera(self, client: TestClient) -> None:
        """Test getting a single camera."""
        response = client.get("/api/cameras/front_porch")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Front Porch Camera"

    def test_capture_snapshot(self, client: TestClient) -> None:
        """Test capturing a snapshot."""
        response = client.post("/api/cameras/front_porch/snapshot")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "snapshot_id" in data

    def test_capture_snapshot_offline_camera(self, client: TestClient) -> None:
        """Test capturing snapshot from offline camera."""
        response = client.post("/api/cameras/garage_interior/snapshot")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "offline" in data["error"].lower()

    def test_get_motion_events(self, client: TestClient) -> None:
        """Test getting motion events."""
        response = client.get("/api/cameras/motion-events?hours=24")
        
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "total_events" in data


class TestSensorEndpoints:
    """Tests for sensor monitoring endpoints."""

    def test_list_all_sensors(self, client: TestClient) -> None:
        """Test listing all sensors."""
        response = client.get("/api/sensors")
        
        assert response.status_code == 200
        data = response.json()
        assert "sensors" in data
        assert data["total_sensors"] == 5


class TestSecuritySystemEndpoints:
    """Tests for security system endpoints."""

    def test_get_system_status(self, client: TestClient) -> None:
        """Test getting security system status."""
        response = client.get("/api/security-system")
        
        assert response.status_code == 200
        data = response.json()
        assert "is_armed" in data
        assert "arm_mode" in data

    def test_arm_system_with_unlocked_doors(self, client: TestClient) -> None:
        """Test arming with unlocked doors fails."""
        _device_state["locks"]["garage_door"]["is_locked"] = False
        
        response = client.post(
            "/api/security-system/arm",
            json={"mode": "away"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False

    def test_arm_system_all_locked(self, client: TestClient) -> None:
        """Test arming with all doors locked."""
        # Lock all doors
        for lock in _device_state["locks"].values():
            lock["is_locked"] = True
        
        response = client.post(
            "/api/security-system/arm",
            json={"mode": "away"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_disarm_system(self, client: TestClient) -> None:
        """Test disarming the system."""
        response = client.post(
            "/api/security-system/disarm",
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestActivityEndpoints:
    """Tests for activity log endpoints."""

    def test_get_activity(self, client: TestClient) -> None:
        """Test getting activity log."""
        response = client.get("/api/activity?count=10")
        
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "count" in data


class TestChatEndpoints:
    """Tests for AI chat endpoints."""

    def test_chat_status_query(self, client: TestClient) -> None:
        """Test chat with status query."""
        response = client.post(
            "/api/chat",
            json={"message": "What's going on at home?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert "suggestions" in data

    def test_chat_lock_query(self, client: TestClient) -> None:
        """Test chat with lock query."""
        response = client.post(
            "/api/chat",
            json={"message": "Show me lock status"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Lock" in data["response"]

    def test_chat_session_continuity(self, client: TestClient) -> None:
        """Test chat maintains session."""
        # First message
        response1 = client.post(
            "/api/chat",
            json={"message": "Hello"}
        )
        session_id = response1.json()["session_id"]
        
        # Second message with same session
        response2 = client.post(
            "/api/chat",
            json={"message": "Show locks", "session_id": session_id}
        )
        
        assert response2.json()["session_id"] == session_id


class TestQuickActionsEndpoints:
    """Tests for quick action endpoints."""

    def test_goodnight_routine(self, client: TestClient) -> None:
        """Test goodnight routine."""
        response = client.post("/api/quick-actions/goodnight")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "goodnight" in data["message"].lower()

    def test_leaving_routine(self, client: TestClient) -> None:
        """Test leaving routine."""
        response = client.post("/api/quick-actions/leaving")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_arriving_routine(self, client: TestClient) -> None:
        """Test arriving routine."""
        response = client.post("/api/quick-actions/arriving")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "welcome" in data["message"].lower()


class TestNotificationEndpoints:
    """Tests for notification endpoints."""

    def test_register_device(self, client: TestClient) -> None:
        """Test device registration."""
        response = client.post(
            "/api/notifications/register",
            json={
                "device_token": "test-token-12345",
                "device_type": "ios",
                "device_name": "iPhone 15 Pro"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "device_id" in data["details"]

    def test_get_notification_settings(self, client: TestClient) -> None:
        """Test getting notification settings."""
        response = client.get("/api/notifications/settings?user_id=test_user")
        
        assert response.status_code == 200
        data = response.json()
        assert "push_enabled" in data
        assert "motion_alerts" in data

    def test_update_notification_settings(self, client: TestClient) -> None:
        """Test updating notification settings."""
        response = client.put(
            "/api/notifications/settings?user_id=test_user",
            json={
                "push_enabled": True,
                "motion_alerts": False,
                "door_alerts": True,
                "system_alerts": True,
                "low_battery_alerts": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
