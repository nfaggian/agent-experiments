"""Tests for the Home Security MCP Server."""

from datetime import datetime, timedelta

import pytest

from src.mcp_servers.home_security.camera import CameraManager
from src.mcp_servers.home_security.lock import SmartLockManager
from src.mcp_servers.home_security.models import (
    AccessMethod,
    Camera,
    CameraStatus,
    LockStatus,
    MotionSensitivity,
    SmartLock,
)


class TestCameraManager:
    """Tests for CameraManager class."""

    @pytest.fixture
    def manager(self) -> CameraManager:
        """Create a camera manager instance for testing."""
        return CameraManager()

    def test_list_cameras(self, manager: CameraManager) -> None:
        """Test listing all cameras."""
        cameras = manager.list_cameras()
        assert len(cameras) == 4
        assert all(isinstance(c, dict) for c in cameras)
        assert any(c["id"] == "cam_front_door" for c in cameras)

    def test_get_camera(self, manager: CameraManager) -> None:
        """Test getting a specific camera."""
        camera = manager.get_camera("cam_front_door")
        assert camera is not None
        assert camera["name"] == "Front Door Camera"
        assert camera["resolution"] == "4K"

    def test_get_camera_not_found(self, manager: CameraManager) -> None:
        """Test getting a non-existent camera."""
        camera = manager.get_camera("nonexistent")
        assert camera is None

    def test_get_camera_status(self, manager: CameraManager) -> None:
        """Test getting camera status."""
        status = manager.get_camera_status("cam_front_door")
        assert status["camera_id"] == "cam_front_door"
        assert "status" in status
        assert "recording" in status

    def test_start_stop_recording(self, manager: CameraManager) -> None:
        """Test starting and stopping recording."""
        result = manager.start_recording("cam_front_door")
        assert result["success"] is True
        assert "Recording started" in result["message"]

        status = manager.get_camera_status("cam_front_door")
        assert status["recording"] is True

        result = manager.stop_recording("cam_front_door")
        assert result["success"] is True
        status = manager.get_camera_status("cam_front_door")
        assert status["recording"] is False

    def test_get_stream_url(self, manager: CameraManager) -> None:
        """Test getting stream URL."""
        result = manager.get_stream_url("cam_front_door")
        assert "stream_url" in result
        assert "rtsp://" in result["stream_url"]

    def test_capture_snapshot(self, manager: CameraManager) -> None:
        """Test capturing snapshot."""
        result = manager.capture_snapshot("cam_front_door")
        assert result["success"] is True
        assert "snapshot_url" in result
        assert result["resolution"] == "4K"

    def test_set_motion_detection(self, manager: CameraManager) -> None:
        """Test configuring motion detection."""
        result = manager.set_motion_detection("cam_front_door", True, "high")
        assert result["success"] is True
        assert result["motion_detection"] is True
        assert result["sensitivity"] == "high"

        result = manager.set_motion_detection("cam_front_door", False)
        assert result["motion_detection"] is False

    def test_simulate_motion_event(self, manager: CameraManager) -> None:
        """Test simulating motion event."""
        manager.set_motion_detection("cam_front_door", True)
        result = manager.simulate_motion_event("cam_front_door", "entrance")
        assert result["success"] is True
        assert "event" in result
        assert "alert" in result
        assert result["event"]["zone"] == "entrance"

    def test_get_motion_events(self, manager: CameraManager) -> None:
        """Test getting motion events."""
        manager.set_motion_detection("cam_front_door", True)
        manager.simulate_motion_event("cam_front_door")
        events = manager.get_motion_events("cam_front_door")
        assert len(events) >= 1

    def test_acknowledge_motion_event(self, manager: CameraManager) -> None:
        """Test acknowledging motion event."""
        manager.set_motion_detection("cam_front_door", True)
        result = manager.simulate_motion_event("cam_front_door")
        event_id = result["event"]["id"]

        ack_result = manager.acknowledge_motion_event(event_id)
        assert ack_result["success"] is True

    def test_get_recordings(self, manager: CameraManager) -> None:
        """Test getting recordings."""
        recordings = manager.get_recordings("cam_front_door")
        assert isinstance(recordings, list)
        if recordings:
            assert "url" in recordings[0]
            assert "duration_seconds" in recordings[0]

    def test_get_storage_info(self, manager: CameraManager) -> None:
        """Test getting storage info."""
        info = manager.get_storage_info("cam_front_door")
        assert "storage_used_gb" in info
        assert "storage_limit_gb" in info
        assert "usage_percent" in info

    def test_set_camera_settings(self, manager: CameraManager) -> None:
        """Test updating camera settings."""
        result = manager.set_camera_settings("cam_front_door", resolution="1080p", night_vision=False)
        assert result["success"] is True
        assert result["settings"]["resolution"] == "1080p"
        assert result["settings"]["night_vision"] is False


class TestSmartLockManager:
    """Tests for SmartLockManager class."""

    @pytest.fixture
    def manager(self) -> SmartLockManager:
        """Create a lock manager instance for testing."""
        return SmartLockManager()

    def test_list_locks(self, manager: SmartLockManager) -> None:
        """Test listing all locks."""
        locks = manager.list_locks()
        assert len(locks) == 1
        assert locks[0]["id"] == "lock_front_door"

    def test_get_lock(self, manager: SmartLockManager) -> None:
        """Test getting a specific lock."""
        lock = manager.get_lock("lock_front_door")
        assert lock is not None
        assert lock["name"] == "Front Door Lock"

    def test_get_lock_not_found(self, manager: SmartLockManager) -> None:
        """Test getting a non-existent lock."""
        lock = manager.get_lock("nonexistent")
        assert lock is None

    def test_get_lock_status(self, manager: SmartLockManager) -> None:
        """Test getting lock status."""
        status = manager.get_lock_status("lock_front_door")
        assert status["lock_id"] == "lock_front_door"
        assert "status" in status
        assert "battery_level" in status

    def test_lock_unlock(self, manager: SmartLockManager) -> None:
        """Test locking and unlocking."""
        unlock_result = manager.unlock("lock_front_door", user="test")
        assert unlock_result["success"] is True
        assert unlock_result["status"] == "unlocked"

        lock_result = manager.lock("lock_front_door", user="test")
        assert lock_result["success"] is True
        assert lock_result["status"] == "locked"

    def test_unlock_with_code(self, manager: SmartLockManager) -> None:
        """Test unlocking with PIN code."""
        result = manager.unlock("lock_front_door", code="1234")
        assert result["success"] is True
        assert result["status"] == "unlocked"

    def test_unlock_with_invalid_code(self, manager: SmartLockManager) -> None:
        """Test unlocking with invalid PIN code."""
        result = manager.unlock("lock_front_door", code="9999")
        assert result["success"] is False
        assert "Invalid" in result["error"]

    def test_add_access_code(self, manager: SmartLockManager) -> None:
        """Test adding an access code."""
        result = manager.add_access_code(
            "lock_front_door",
            name="Test Code",
            code="4567",
            valid_days=7,
        )
        assert result["success"] is True
        assert "code_id" in result

        unlock_result = manager.unlock("lock_front_door", code="4567")
        assert unlock_result["success"] is True

    def test_add_one_time_code(self, manager: SmartLockManager) -> None:
        """Test adding a one-time access code."""
        result = manager.add_access_code(
            "lock_front_door",
            name="One Time",
            code="1111",
            one_time=True,
        )
        assert result["success"] is True

        unlock1 = manager.unlock("lock_front_door", code="1111")
        assert unlock1["success"] is True

        manager.lock("lock_front_door")
        unlock2 = manager.unlock("lock_front_door", code="1111")
        assert unlock2["success"] is False

    def test_remove_access_code(self, manager: SmartLockManager) -> None:
        """Test removing an access code."""
        add_result = manager.add_access_code(
            "lock_front_door",
            name="Temp Code",
            code="2222",
        )
        code_id = add_result["code_id"]

        remove_result = manager.remove_access_code("lock_front_door", code_id)
        assert remove_result["success"] is True

        unlock_result = manager.unlock("lock_front_door", code="2222")
        assert unlock_result["success"] is False

    def test_list_access_codes(self, manager: SmartLockManager) -> None:
        """Test listing access codes."""
        codes = manager.list_access_codes("lock_front_door")
        assert len(codes) >= 2
        assert all("name" in c for c in codes)
        assert all("code_hash" not in c or "code" not in c for c in codes)

    def test_deactivate_access_code(self, manager: SmartLockManager) -> None:
        """Test deactivating an access code."""
        add_result = manager.add_access_code(
            "lock_front_door",
            name="Deactivate Test",
            code="3333",
        )
        code_id = add_result["code_id"]

        deactivate_result = manager.deactivate_access_code("lock_front_door", code_id)
        assert deactivate_result["success"] is True

        unlock_result = manager.unlock("lock_front_door", code="3333")
        assert unlock_result["success"] is False

    def test_get_access_logs(self, manager: SmartLockManager) -> None:
        """Test getting access logs."""
        manager.unlock("lock_front_door", user="test")
        manager.lock("lock_front_door", user="test")

        logs = manager.get_access_logs("lock_front_door")
        assert len(logs) >= 2
        assert all("timestamp" in l for l in logs)
        assert all("action" in l for l in logs)

    def test_set_auto_lock(self, manager: SmartLockManager) -> None:
        """Test configuring auto-lock."""
        result = manager.set_auto_lock("lock_front_door", enabled=True, delay_seconds=60)
        assert result["success"] is True
        assert result["auto_lock_enabled"] is True
        assert result["auto_lock_delay_seconds"] == 60

    def test_get_battery_status(self, manager: SmartLockManager) -> None:
        """Test getting battery status."""
        status = manager.get_battery_status("lock_front_door")
        assert "battery_level" in status
        assert "status" in status
        assert status["status"] in ["good", "low", "critical"]

    def test_simulate_tamper(self, manager: SmartLockManager) -> None:
        """Test simulating tamper alert."""
        result = manager.simulate_tamper("lock_front_door")
        assert result["success"] is True
        assert "alert" in result
        assert result["alert"]["alert_type"] == "tamper_detected"

    def test_clear_tamper_alert(self, manager: SmartLockManager) -> None:
        """Test clearing tamper alert."""
        manager.simulate_tamper("lock_front_door")
        result = manager.clear_tamper_alert("lock_front_door")
        assert result["success"] is True

        status = manager.get_lock_status("lock_front_door")
        assert status["tamper_alert"] is False

    def test_get_alerts(self, manager: SmartLockManager) -> None:
        """Test getting alerts."""
        manager.simulate_tamper("lock_front_door")
        alerts = manager.get_alerts()
        assert len(alerts) >= 1

    def test_acknowledge_alert(self, manager: SmartLockManager) -> None:
        """Test acknowledging an alert."""
        tamper_result = manager.simulate_tamper("lock_front_door")
        alert_id = tamper_result["alert"]["id"]

        ack_result = manager.acknowledge_alert(alert_id, "test_user")
        assert ack_result["success"] is True


class TestModels:
    """Tests for data models."""

    def test_camera_to_dict(self) -> None:
        """Test Camera serialization."""
        camera = Camera(
            id="test_cam",
            name="Test Camera",
            location="Test Location",
            status=CameraStatus.ONLINE,
        )
        data = camera.to_dict()
        assert data["id"] == "test_cam"
        assert data["status"] == "online"

    def test_smart_lock_to_dict(self) -> None:
        """Test SmartLock serialization."""
        lock = SmartLock(
            id="test_lock",
            name="Test Lock",
            location="Test Door",
            status=LockStatus.LOCKED,
        )
        data = lock.to_dict()
        assert data["id"] == "test_lock"
        assert data["status"] == "locked"

    def test_motion_sensitivity_values(self) -> None:
        """Test MotionSensitivity enum values."""
        assert MotionSensitivity.LOW.value == "low"
        assert MotionSensitivity.MEDIUM.value == "medium"
        assert MotionSensitivity.HIGH.value == "high"

    def test_access_method_values(self) -> None:
        """Test AccessMethod enum values."""
        assert AccessMethod.PIN_CODE.value == "pin_code"
        assert AccessMethod.FINGERPRINT.value == "fingerprint"
        assert AccessMethod.MOBILE_APP.value == "mobile_app"
