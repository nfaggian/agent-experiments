"""Data models for the Home Security MCP Server."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class CameraStatus(Enum):
    """Camera operational status."""

    ONLINE = "online"
    OFFLINE = "offline"
    RECORDING = "recording"
    STREAMING = "streaming"
    ERROR = "error"


class LockStatus(Enum):
    """Smart lock status."""

    LOCKED = "locked"
    UNLOCKED = "unlocked"
    JAMMED = "jammed"
    UNKNOWN = "unknown"


class MotionSensitivity(Enum):
    """Motion detection sensitivity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AccessMethod(Enum):
    """How the lock was accessed."""

    PIN_CODE = "pin_code"
    FINGERPRINT = "fingerprint"
    RFID_CARD = "rfid_card"
    MOBILE_APP = "mobile_app"
    PHYSICAL_KEY = "physical_key"
    AUTO_LOCK = "auto_lock"
    REMOTE = "remote"


@dataclass
class Camera:
    """Represents a security camera."""

    id: str
    name: str
    location: str
    status: CameraStatus = CameraStatus.OFFLINE
    resolution: str = "1080p"
    night_vision: bool = True
    motion_detection: bool = True
    motion_sensitivity: MotionSensitivity = MotionSensitivity.MEDIUM
    recording: bool = False
    streaming_url: str | None = None
    last_motion_detected: datetime | None = None
    storage_used_gb: float = 0.0
    storage_limit_gb: float = 100.0
    firmware_version: str = "1.0.0"
    ip_address: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "status": self.status.value,
            "resolution": self.resolution,
            "night_vision": self.night_vision,
            "motion_detection": self.motion_detection,
            "motion_sensitivity": self.motion_sensitivity.value,
            "recording": self.recording,
            "streaming_url": self.streaming_url,
            "last_motion_detected": (
                self.last_motion_detected.isoformat() if self.last_motion_detected else None
            ),
            "storage_used_gb": self.storage_used_gb,
            "storage_limit_gb": self.storage_limit_gb,
            "firmware_version": self.firmware_version,
            "ip_address": self.ip_address,
            "metadata": self.metadata,
        }


@dataclass
class MotionEvent:
    """Represents a motion detection event."""

    id: str
    camera_id: str
    timestamp: datetime
    duration_seconds: float
    confidence: float
    zone: str | None = None
    thumbnail_url: str | None = None
    video_clip_url: str | None = None
    acknowledged: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "camera_id": self.camera_id,
            "timestamp": self.timestamp.isoformat(),
            "duration_seconds": self.duration_seconds,
            "confidence": self.confidence,
            "zone": self.zone,
            "thumbnail_url": self.thumbnail_url,
            "video_clip_url": self.video_clip_url,
            "acknowledged": self.acknowledged,
            "metadata": self.metadata,
        }


@dataclass
class SmartLock:
    """Represents a smart door lock."""

    id: str
    name: str
    location: str
    status: LockStatus = LockStatus.UNKNOWN
    battery_level: int = 100
    auto_lock_enabled: bool = True
    auto_lock_delay_seconds: int = 30
    tamper_alert: bool = False
    firmware_version: str = "1.0.0"
    last_activity: datetime | None = None
    connected: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "status": self.status.value,
            "battery_level": self.battery_level,
            "auto_lock_enabled": self.auto_lock_enabled,
            "auto_lock_delay_seconds": self.auto_lock_delay_seconds,
            "tamper_alert": self.tamper_alert,
            "firmware_version": self.firmware_version,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "connected": self.connected,
            "metadata": self.metadata,
        }


@dataclass
class AccessCode:
    """Represents a PIN access code for a smart lock."""

    id: str
    lock_id: str
    name: str
    code_hash: str
    active: bool = True
    one_time: bool = False
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    allowed_days: list[str] = field(default_factory=list)
    allowed_hours_start: int | None = None
    allowed_hours_end: int | None = None
    use_count: int = 0
    max_uses: int | None = None
    created_at: datetime = field(default_factory=datetime.now)
    last_used: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "lock_id": self.lock_id,
            "name": self.name,
            "active": self.active,
            "one_time": self.one_time,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "allowed_days": self.allowed_days,
            "allowed_hours_start": self.allowed_hours_start,
            "allowed_hours_end": self.allowed_hours_end,
            "use_count": self.use_count,
            "max_uses": self.max_uses,
            "created_at": self.created_at.isoformat(),
            "last_used": self.last_used.isoformat() if self.last_used else None,
        }


@dataclass
class LockAccessLog:
    """Represents an access log entry for a smart lock."""

    id: str
    lock_id: str
    timestamp: datetime
    action: str
    method: AccessMethod
    user_name: str | None = None
    access_code_id: str | None = None
    success: bool = True
    failure_reason: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "lock_id": self.lock_id,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action,
            "method": self.method.value,
            "user_name": self.user_name,
            "access_code_id": self.access_code_id,
            "success": self.success,
            "failure_reason": self.failure_reason,
            "metadata": self.metadata,
        }


@dataclass
class SecurityAlert:
    """Represents a security alert from any device."""

    id: str
    device_type: str
    device_id: str
    alert_type: str
    severity: str
    message: str
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None
    resolved: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "device_type": self.device_type,
            "device_id": self.device_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "acknowledged": self.acknowledged,
            "acknowledged_by": self.acknowledged_by,
            "acknowledged_at": (
                self.acknowledged_at.isoformat() if self.acknowledged_at else None
            ),
            "resolved": self.resolved,
            "metadata": self.metadata,
        }
