"""Shared data models for the home dashboard."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class AuthState(StrEnum):
    AUTHENTICATED = "authenticated"
    REQUIRES_VALIDATION = "requires_validation"
    REQUIRES_AUTHENTICATION = "requires_authentication"
    BAD_PASSWORD = "bad_password"
    NOT_CONFIGURED = "not_configured"
    ERROR = "error"


class LockStatusView(StrEnum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    LOCKING = "locking"
    UNLOCKING = "unlocking"
    UNLATCHED = "unlatched"
    UNLATCHING = "unlatching"
    JAMMED = "jammed"
    UNKNOWN = "unknown"


class DoorStatusView(StrEnum):
    OPEN = "open"
    CLOSED = "closed"
    UNKNOWN = "unknown"
    DISABLED = "disabled"


class ActivityView(BaseModel):
    id: str
    action: str
    label: str
    device_name: str | None = None
    operator: str | None = None
    timestamp: datetime
    activity_type: str


class LockInfo(BaseModel):
    lock_id: str
    name: str
    house_id: str
    battery_level: int | None = None
    bridge_online: bool = False
    doorsense: bool = False


class CameraInfo(BaseModel):
    camera_id: str
    name: str
    is_connected: bool = False
    is_recording: bool = False
    is_motion_detected: bool = False
    last_motion: datetime | None = None


class CameraStatus(BaseModel):
    configured: bool
    connected: bool = False
    message: str | None = None
    cameras: list[CameraInfo] = Field(default_factory=list)
    selected_camera_id: str | None = None


class AmbienceSnapshot(BaseModel):
    configured: bool
    time_of_day: str
    weather: str
    weather_label: str
    temperature_c: float | None = None
    cloud_cover: int | None = None
    is_day: bool = True
    timezone: str | None = None
    location_name: str | None = None
    local_time: datetime | None = None
    message: str | None = None


class StatusSnapshot(BaseModel):
    authenticated: bool
    auth_state: AuthState
    auth_message: str | None = None
    lock: LockInfo | None = None
    lock_status: LockStatusView = LockStatusView.UNKNOWN
    door_status: DoorStatusView = DoorStatusView.UNKNOWN
    lock_status_updated_at: datetime | None = None
    door_status_updated_at: datetime | None = None
    activities: list[ActivityView] = Field(default_factory=list)
    camera: CameraStatus = Field(default_factory=lambda: CameraStatus(configured=False))
    updated_at: datetime = Field(default_factory=datetime.now)


class OperationResult(BaseModel):
    success: bool
    message: str
    status: StatusSnapshot | None = None


class CredentialsRequest(BaseModel):
    username: str
    password: str
    login_method: str = "email"


class VerificationRequest(BaseModel):
    code: str


def activity_label(action: str) -> str:
    labels = {
        "lock": "Locked",
        "unlock": "Unlocked",
        "dooropen": "Door opened",
        "door_open": "Door opened",
        "doorclosed": "Door closed",
        "door_close": "Door closed",
        "auto_lock": "Auto-locked",
        "manual_lock": "Manually locked",
        "manual_unlock": "Manually unlocked",
        "remote_lock": "Remotely locked",
        "remote_unlock": "Remotely unlocked",
        "pin_lock": "Locked with PIN",
        "pin_unlock": "Unlocked with PIN",
        "jammed": "Lock jammed",
        "locking": "Locking",
        "unlocking": "Unlocking",
        "unlatch": "Unlatched",
        "associated_bridge_online": "Bridge online",
        "associated_bridge_offline": "Bridge offline",
    }
    return labels.get(action, action.replace("_", " ").title())


def serialize_activity(activity: Any) -> ActivityView:
    operator: str | None = None
    if hasattr(activity, "operated_by") and activity.operated_by:
        operator = str(activity.operated_by)
    elif activity.calling_user:
        first = activity.calling_user.get("FirstName", "")
        last = activity.calling_user.get("LastName", "")
        full_name = f"{first} {last}".strip()
        operator = full_name or None

    action = activity.action or "unknown"
    activity_id = activity.activity_id or (
        f"{activity.device_id}-{activity.activity_start_time.isoformat()}"
    )

    return ActivityView(
        id=activity_id,
        action=action,
        label=activity_label(action),
        device_name=activity.device_name,
        operator=operator,
        timestamp=activity.activity_start_time,
        activity_type=activity.activity_type.value,
    )
