"""Tests for Home Security Agent tools and functionality."""

import pytest
from datetime import datetime

from src.agents.home_security_agent.tools.device_tools import (
    get_all_locks_status,
    get_lock_status,
    lock_door,
    unlock_door,
    get_all_cameras_status,
    get_camera_status,
    get_camera_snapshot,
    get_motion_events,
    get_all_sensors_status,
    arm_security_system,
    disarm_security_system,
    get_security_system_status,
    get_recent_activity,
    get_home_summary,
    _device_state,
)


class TestLockTools:
    """Tests for smart lock management tools."""

    def test_get_all_locks_status(self) -> None:
        """Test getting status of all locks."""
        result = get_all_locks_status()
        
        assert "locks" in result
        assert "total_locks" in result
        assert "unlocked_count" in result
        assert "all_secure" in result
        assert "summary" in result
        assert result["total_locks"] == 4
        assert isinstance(result["locks"], dict)

    def test_get_lock_status_valid(self) -> None:
        """Test getting status of a valid lock."""
        result = get_lock_status("front_door")
        
        assert "name" in result
        assert "location" in result
        assert "is_locked" in result
        assert "battery_level" in result
        assert result["name"] == "Front Door"

    def test_get_lock_status_invalid(self) -> None:
        """Test getting status of an invalid lock."""
        result = get_lock_status("nonexistent_lock")
        
        assert "error" in result
        assert "not found" in result["error"]

    def test_lock_door(self) -> None:
        """Test locking a door."""
        # First unlock to ensure we can test locking
        _device_state["locks"]["front_door"]["is_locked"] = False
        
        result = lock_door("front_door")
        
        assert result["success"] is True
        assert "now locked" in result["message"] or "already locked" in result["message"]
        assert _device_state["locks"]["front_door"]["is_locked"] is True

    def test_lock_door_invalid(self) -> None:
        """Test locking an invalid door."""
        result = lock_door("nonexistent_door")
        
        assert "error" in result

    def test_unlock_door_without_confirmation(self) -> None:
        """Test unlocking without confirmation fails."""
        result = unlock_door("front_door", confirm=False)
        
        assert result["success"] is False
        assert "confirmation" in result["message"].lower()

    def test_unlock_door_with_confirmation(self) -> None:
        """Test unlocking with confirmation succeeds."""
        # First lock the door
        _device_state["locks"]["front_door"]["is_locked"] = True
        
        result = unlock_door("front_door", confirm=True)
        
        assert result["success"] is True
        assert _device_state["locks"]["front_door"]["is_locked"] is False


class TestCameraTools:
    """Tests for camera monitoring tools."""

    def test_get_all_cameras_status(self) -> None:
        """Test getting status of all cameras."""
        result = get_all_cameras_status()
        
        assert "cameras" in result
        assert "total_cameras" in result
        assert "online_count" in result
        assert "offline_count" in result
        assert result["total_cameras"] == 4

    def test_get_camera_status_valid(self) -> None:
        """Test getting status of a valid camera."""
        result = get_camera_status("front_porch")
        
        assert "name" in result
        assert "location" in result
        assert "is_online" in result
        assert "resolution" in result

    def test_get_camera_status_invalid(self) -> None:
        """Test getting status of an invalid camera."""
        result = get_camera_status("nonexistent_camera")
        
        assert "error" in result

    def test_get_camera_snapshot_online(self) -> None:
        """Test capturing snapshot from online camera."""
        _device_state["cameras"]["front_porch"]["is_online"] = True
        
        result = get_camera_snapshot("front_porch")
        
        assert result["success"] is True
        assert "snapshot_id" in result
        assert "image_url" in result

    def test_get_camera_snapshot_offline(self) -> None:
        """Test capturing snapshot from offline camera."""
        _device_state["cameras"]["garage_interior"]["is_online"] = False
        
        result = get_camera_snapshot("garage_interior")
        
        assert result["success"] is False
        assert "offline" in result["error"].lower()

    def test_get_motion_events(self) -> None:
        """Test getting motion events."""
        result = get_motion_events(hours=24)
        
        assert "events" in result
        assert "total_events" in result
        assert "time_range_hours" in result
        assert result["time_range_hours"] == 24


class TestSensorTools:
    """Tests for sensor monitoring tools."""

    def test_get_all_sensors_status(self) -> None:
        """Test getting status of all sensors."""
        result = get_all_sensors_status()
        
        assert "sensors" in result
        assert "total_sensors" in result
        assert "triggered_count" in result
        assert "low_battery_count" in result
        assert result["total_sensors"] == 5


class TestSecuritySystemTools:
    """Tests for security system control tools."""

    def test_get_security_system_status(self) -> None:
        """Test getting security system status."""
        result = get_security_system_status()
        
        assert "is_armed" in result
        assert "arm_mode" in result
        assert "alarm_triggered" in result

    def test_arm_security_system_with_unlocked_doors(self) -> None:
        """Test arming fails when doors are unlocked."""
        # Unlock a door first
        _device_state["locks"]["garage_door"]["is_locked"] = False
        
        result = arm_security_system(mode="away")
        
        assert result["success"] is False
        assert "unlocked" in result["error"].lower()
        assert "unlocked_doors" in result

    def test_arm_security_system_all_locked(self) -> None:
        """Test arming succeeds when all doors are locked."""
        # Lock all doors first
        for lock in _device_state["locks"].values():
            lock["is_locked"] = True
        
        result = arm_security_system(mode="away")
        
        assert result["success"] is True
        assert result["mode"] == "away"

    def test_arm_security_system_invalid_mode(self) -> None:
        """Test arming with invalid mode fails."""
        result = arm_security_system(mode="invalid")
        
        assert "error" in result

    def test_disarm_security_system(self) -> None:
        """Test disarming security system."""
        # First arm it
        for lock in _device_state["locks"].values():
            lock["is_locked"] = True
        arm_security_system(mode="away")
        
        result = disarm_security_system()
        
        assert result["success"] is True
        assert _device_state["security_system"]["is_armed"] is False


class TestSummaryTools:
    """Tests for summary and activity tools."""

    def test_get_recent_activity(self) -> None:
        """Test getting recent activity."""
        result = get_recent_activity(count=10)
        
        assert "activities" in result
        assert "count" in result
        assert result["count"] <= 10

    def test_get_recent_activity_limit(self) -> None:
        """Test activity count limit."""
        result = get_recent_activity(count=100)
        
        # Should cap at 50
        assert result["count"] <= 50

    def test_get_home_summary(self) -> None:
        """Test getting home summary."""
        result = get_home_summary()
        
        assert "timestamp" in result
        assert "security_score" in result
        assert "security_level" in result
        assert "locks" in result
        assert "cameras" in result
        assert "sensors" in result
        assert "security_system" in result
        assert "issues" in result
        assert "recommendations" in result
        
        # Security score should be between 0 and 100
        assert 0 <= result["security_score"] <= 100

    def test_security_score_calculation(self) -> None:
        """Test security score reflects issues."""
        # Set up a secure state
        for lock in _device_state["locks"].values():
            lock["is_locked"] = True
        for camera in _device_state["cameras"].values():
            camera["is_online"] = True
        for sensor in _device_state["sensors"].values():
            sensor["battery_level"] = 100
        _device_state["security_system"]["is_armed"] = True
        
        result = get_home_summary()
        assert result["security_score"] == 100
        
        # Unlock a door and check score drops
        _device_state["locks"]["front_door"]["is_locked"] = False
        result = get_home_summary()
        assert result["security_score"] < 100
