"""Camera management module for the Home Security MCP Server."""

import uuid
from datetime import datetime, timedelta
from typing import Any

from .models import (
    Camera,
    CameraStatus,
    MotionEvent,
    MotionSensitivity,
    SecurityAlert,
)


class CameraManager:
    """Manages security cameras and their operations."""

    def __init__(self) -> None:
        self._cameras: dict[str, Camera] = {}
        self._motion_events: dict[str, list[MotionEvent]] = {}
        self._alerts: list[SecurityAlert] = []
        self._initialize_demo_cameras()

    def _initialize_demo_cameras(self) -> None:
        """Initialize demo cameras for testing."""
        demo_cameras = [
            Camera(
                id="cam_front_door",
                name="Front Door Camera",
                location="Front Entrance",
                status=CameraStatus.ONLINE,
                resolution="4K",
                ip_address="192.168.1.101",
            ),
            Camera(
                id="cam_backyard",
                name="Backyard Camera",
                location="Backyard",
                status=CameraStatus.ONLINE,
                resolution="1080p",
                ip_address="192.168.1.102",
            ),
            Camera(
                id="cam_garage",
                name="Garage Camera",
                location="Garage",
                status=CameraStatus.ONLINE,
                resolution="1080p",
                night_vision=True,
                ip_address="192.168.1.103",
            ),
            Camera(
                id="cam_driveway",
                name="Driveway Camera",
                location="Driveway",
                status=CameraStatus.ONLINE,
                resolution="4K",
                ip_address="192.168.1.104",
            ),
        ]
        for camera in demo_cameras:
            self._cameras[camera.id] = camera
            self._motion_events[camera.id] = []

    def list_cameras(self) -> list[dict[str, Any]]:
        """List all registered cameras."""
        return [camera.to_dict() for camera in self._cameras.values()]

    def get_camera(self, camera_id: str) -> dict[str, Any] | None:
        """Get details for a specific camera."""
        camera = self._cameras.get(camera_id)
        return camera.to_dict() if camera else None

    def get_camera_status(self, camera_id: str) -> dict[str, Any]:
        """Get the current status of a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"error": f"Camera {camera_id} not found"}
        return {
            "camera_id": camera_id,
            "name": camera.name,
            "status": camera.status.value,
            "recording": camera.recording,
            "motion_detection": camera.motion_detection,
            "last_motion": (
                camera.last_motion_detected.isoformat() if camera.last_motion_detected else None
            ),
        }

    def start_recording(self, camera_id: str) -> dict[str, Any]:
        """Start recording on a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        if camera.status == CameraStatus.OFFLINE:
            return {"success": False, "error": "Camera is offline"}
        camera.recording = True
        camera.status = CameraStatus.RECORDING
        return {
            "success": True,
            "camera_id": camera_id,
            "message": f"Recording started on {camera.name}",
        }

    def stop_recording(self, camera_id: str) -> dict[str, Any]:
        """Stop recording on a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        camera.recording = False
        if camera.status == CameraStatus.RECORDING:
            camera.status = CameraStatus.ONLINE
        return {
            "success": True,
            "camera_id": camera_id,
            "message": f"Recording stopped on {camera.name}",
        }

    def get_stream_url(self, camera_id: str) -> dict[str, Any]:
        """Get the streaming URL for a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"error": f"Camera {camera_id} not found"}
        if camera.status == CameraStatus.OFFLINE:
            return {"error": "Camera is offline"}
        stream_url = f"rtsp://{camera.ip_address}:554/stream"
        return {
            "camera_id": camera_id,
            "name": camera.name,
            "stream_url": stream_url,
            "protocol": "rtsp",
        }

    def capture_snapshot(self, camera_id: str) -> dict[str, Any]:
        """Capture a snapshot from a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        if camera.status == CameraStatus.OFFLINE:
            return {"success": False, "error": "Camera is offline"}
        timestamp = datetime.now()
        snapshot_url = f"/snapshots/{camera_id}/{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
        return {
            "success": True,
            "camera_id": camera_id,
            "snapshot_url": snapshot_url,
            "timestamp": timestamp.isoformat(),
            "resolution": camera.resolution,
        }

    def set_motion_detection(
        self, camera_id: str, enabled: bool, sensitivity: str | None = None
    ) -> dict[str, Any]:
        """Enable or disable motion detection on a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        camera.motion_detection = enabled
        if sensitivity:
            try:
                camera.motion_sensitivity = MotionSensitivity(sensitivity.lower())
            except ValueError:
                return {"success": False, "error": f"Invalid sensitivity: {sensitivity}"}
        return {
            "success": True,
            "camera_id": camera_id,
            "motion_detection": camera.motion_detection,
            "sensitivity": camera.motion_sensitivity.value,
        }

    def get_motion_events(
        self,
        camera_id: str | None = None,
        since: datetime | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Get motion events, optionally filtered by camera and time."""
        events: list[MotionEvent] = []
        if camera_id:
            events = self._motion_events.get(camera_id, [])
        else:
            for camera_events in self._motion_events.values():
                events.extend(camera_events)

        if since:
            events = [e for e in events if e.timestamp >= since]

        events.sort(key=lambda x: x.timestamp, reverse=True)
        return [e.to_dict() for e in events[:limit]]

    def simulate_motion_event(
        self, camera_id: str, zone: str | None = None
    ) -> dict[str, Any]:
        """Simulate a motion detection event (for testing)."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        if not camera.motion_detection:
            return {"success": False, "error": "Motion detection is disabled"}

        event = MotionEvent(
            id=f"motion_{uuid.uuid4().hex[:8]}",
            camera_id=camera_id,
            timestamp=datetime.now(),
            duration_seconds=5.0,
            confidence=0.85,
            zone=zone or "main",
        )
        self._motion_events[camera_id].append(event)
        camera.last_motion_detected = event.timestamp

        alert = SecurityAlert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            device_type="camera",
            device_id=camera_id,
            alert_type="motion_detected",
            severity="info",
            message=f"Motion detected on {camera.name}",
            timestamp=event.timestamp,
        )
        self._alerts.append(alert)

        return {
            "success": True,
            "event": event.to_dict(),
            "alert": alert.to_dict(),
        }

    def acknowledge_motion_event(self, event_id: str) -> dict[str, Any]:
        """Acknowledge a motion event."""
        for events in self._motion_events.values():
            for event in events:
                if event.id == event_id:
                    event.acknowledged = True
                    return {"success": True, "event_id": event_id}
        return {"success": False, "error": f"Event {event_id} not found"}

    def get_recordings(
        self,
        camera_id: str,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """Get list of recordings for a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return []

        if not start_time:
            start_time = datetime.now() - timedelta(days=1)
        if not end_time:
            end_time = datetime.now()

        recordings = []
        current = start_time
        while current < end_time:
            recording = {
                "camera_id": camera_id,
                "start_time": current.isoformat(),
                "end_time": (current + timedelta(hours=1)).isoformat(),
                "duration_seconds": 3600,
                "size_mb": 450,
                "url": f"/recordings/{camera_id}/{current.strftime('%Y%m%d_%H%M%S')}.mp4",
            }
            recordings.append(recording)
            current += timedelta(hours=1)
        return recordings[:24]

    def get_storage_info(self, camera_id: str) -> dict[str, Any]:
        """Get storage information for a camera."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"error": f"Camera {camera_id} not found"}
        return {
            "camera_id": camera_id,
            "storage_used_gb": camera.storage_used_gb,
            "storage_limit_gb": camera.storage_limit_gb,
            "storage_available_gb": camera.storage_limit_gb - camera.storage_used_gb,
            "usage_percent": (camera.storage_used_gb / camera.storage_limit_gb) * 100,
        }

    def set_camera_settings(
        self,
        camera_id: str,
        resolution: str | None = None,
        night_vision: bool | None = None,
    ) -> dict[str, Any]:
        """Update camera settings."""
        camera = self._cameras.get(camera_id)
        if not camera:
            return {"success": False, "error": f"Camera {camera_id} not found"}
        if resolution:
            camera.resolution = resolution
        if night_vision is not None:
            camera.night_vision = night_vision
        return {
            "success": True,
            "camera_id": camera_id,
            "settings": {
                "resolution": camera.resolution,
                "night_vision": camera.night_vision,
            },
        }

    def get_alerts(
        self, unacknowledged_only: bool = False, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Get security alerts."""
        alerts = self._alerts
        if unacknowledged_only:
            alerts = [a for a in alerts if not a.acknowledged]
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        return [a.to_dict() for a in alerts[:limit]]

    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> dict[str, Any]:
        """Acknowledge a security alert."""
        for alert in self._alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                alert.acknowledged_by = acknowledged_by
                alert.acknowledged_at = datetime.now()
                return {"success": True, "alert_id": alert_id}
        return {"success": False, "error": f"Alert {alert_id} not found"}
