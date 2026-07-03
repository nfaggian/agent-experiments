"""Pydantic models for the Home Security Mobile API."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SecurityMode(str, Enum):
    """Security system arm modes."""
    DISARMED = "disarmed"
    HOME = "home"
    AWAY = "away"
    NIGHT = "night"


class SensorType(str, Enum):
    """Types of security sensors."""
    MOTION = "motion"
    DOOR_WINDOW = "door_window"
    SMOKE = "smoke"
    WATER_LEAK = "water_leak"
    GLASS_BREAK = "glass_break"


# Request Models
class LockActionRequest(BaseModel):
    """Request to lock or unlock a door."""
    confirm: bool = Field(
        default=False,
        description="Confirmation required for unlock actions"
    )


class ArmSystemRequest(BaseModel):
    """Request to arm the security system."""
    mode: SecurityMode = Field(
        default=SecurityMode.AWAY,
        description="Arm mode: away, home, or night"
    )


class DisarmSystemRequest(BaseModel):
    """Request to disarm the security system."""
    pin: str | None = Field(
        default=None,
        description="Security PIN for verification"
    )


class ChatMessageRequest(BaseModel):
    """Request to send a message to the AI agent."""
    message: str = Field(
        ...,
        description="User message to the AI agent",
        min_length=1,
        max_length=1000
    )
    session_id: str | None = Field(
        default=None,
        description="Optional session ID for conversation continuity"
    )


# Response Models
class LockStatus(BaseModel):
    """Status of a single lock."""
    id: str
    name: str
    location: str
    is_locked: bool
    status: str
    battery_level: int
    battery_status: str
    last_activity: str | None


class AllLocksResponse(BaseModel):
    """Response with all locks status."""
    locks: dict[str, LockStatus]
    total_locks: int
    unlocked_count: int
    all_secure: bool
    summary: str


class CameraStatus(BaseModel):
    """Status of a single camera."""
    id: str
    name: str
    location: str
    is_online: bool
    is_recording: bool
    motion_detected: bool
    resolution: str
    night_vision: bool
    last_motion: str | None
    status: str


class AllCamerasResponse(BaseModel):
    """Response with all cameras status."""
    cameras: dict[str, CameraStatus]
    total_cameras: int
    online_count: int
    offline_count: int
    cameras_with_motion: int
    all_online: bool
    summary: str


class SensorStatus(BaseModel):
    """Status of a single sensor."""
    id: str
    name: str
    sensor_type: SensorType
    location: str
    is_triggered: bool
    battery_level: int
    battery_status: str
    last_triggered: str | None


class AllSensorsResponse(BaseModel):
    """Response with all sensors status."""
    sensors: dict[str, SensorStatus]
    total_sensors: int
    triggered_count: int
    low_battery_count: int
    all_normal: bool
    summary: str


class SecuritySystemStatus(BaseModel):
    """Status of the security system."""
    is_armed: bool
    arm_mode: SecurityMode
    status: str
    alarm_triggered: bool
    last_armed: str | None
    last_disarmed: str | None


class MotionEvent(BaseModel):
    """A motion detection event."""
    camera_id: str
    camera_name: str
    location: str
    timestamp: str
    event_type: str
    confidence: int


class MotionEventsResponse(BaseModel):
    """Response with motion events."""
    events: list[MotionEvent]
    total_events: int
    time_range_hours: int
    summary: str


class ActivityEvent(BaseModel):
    """An activity log event."""
    id: str
    timestamp: str
    event_type: str
    device_name: str
    details: str


class RecentActivityResponse(BaseModel):
    """Response with recent activity."""
    activities: list[ActivityEvent]
    count: int
    message: str


class HomeSummaryResponse(BaseModel):
    """Comprehensive home security summary."""
    timestamp: str
    security_score: int
    security_level: str
    locks: dict[str, Any]
    cameras: dict[str, Any]
    sensors: dict[str, Any]
    security_system: SecuritySystemStatus
    issues: list[str]
    recommendations: list[str]


class SnapshotResponse(BaseModel):
    """Response from camera snapshot request."""
    success: bool
    camera_name: str
    location: str | None = None
    timestamp: str | None = None
    resolution: str | None = None
    snapshot_id: str | None = None
    message: str
    image_url: str | None = None
    error: str | None = None


class ActionResponse(BaseModel):
    """Generic action response."""
    success: bool
    message: str
    details: dict[str, Any] | None = None
    error: str | None = None
    warning: str | None = None


class ChatMessageResponse(BaseModel):
    """Response from the AI agent."""
    response: str
    session_id: str
    timestamp: str
    suggestions: list[str] | None = None


class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    version: str
    timestamp: str


class NotificationSettings(BaseModel):
    """User notification preferences."""
    push_enabled: bool = True
    motion_alerts: bool = True
    door_alerts: bool = True
    system_alerts: bool = True
    low_battery_alerts: bool = True
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None


class DeviceRegistration(BaseModel):
    """Device registration for push notifications."""
    device_token: str
    device_type: str  # "ios" or "android"
    device_name: str | None = None
