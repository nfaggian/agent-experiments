"""Smart Lock management module for the Home Security MCP Server."""

import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Any

from .models import (
    AccessCode,
    AccessMethod,
    LockAccessLog,
    LockStatus,
    SecurityAlert,
    SmartLock,
)


class SmartLockManager:
    """Manages smart locks and their operations."""

    def __init__(self) -> None:
        self._locks: dict[str, SmartLock] = {}
        self._access_codes: dict[str, list[AccessCode]] = {}
        self._access_logs: dict[str, list[LockAccessLog]] = {}
        self._alerts: list[SecurityAlert] = []
        self._initialize_demo_lock()

    def _initialize_demo_lock(self) -> None:
        """Initialize demo front door lock for testing."""
        front_door = SmartLock(
            id="lock_front_door",
            name="Front Door Lock",
            location="Front Entrance",
            status=LockStatus.LOCKED,
            battery_level=85,
            auto_lock_enabled=True,
            auto_lock_delay_seconds=30,
            connected=True,
            firmware_version="2.1.3",
        )
        self._locks[front_door.id] = front_door
        self._access_codes[front_door.id] = []
        self._access_logs[front_door.id] = []

        master_code = AccessCode(
            id="code_master",
            lock_id=front_door.id,
            name="Master Code",
            code_hash=self._hash_code("1234"),
            active=True,
        )
        self._access_codes[front_door.id].append(master_code)

        guest_code = AccessCode(
            id="code_guest",
            lock_id=front_door.id,
            name="Guest Code",
            code_hash=self._hash_code("5678"),
            active=True,
            valid_until=datetime.now() + timedelta(days=7),
        )
        self._access_codes[front_door.id].append(guest_code)

    def _hash_code(self, code: str) -> str:
        """Hash an access code for storage."""
        return hashlib.sha256(code.encode()).hexdigest()

    def _log_access(
        self,
        lock_id: str,
        action: str,
        method: AccessMethod,
        success: bool = True,
        user_name: str | None = None,
        access_code_id: str | None = None,
        failure_reason: str | None = None,
    ) -> LockAccessLog:
        """Log an access attempt."""
        log = LockAccessLog(
            id=f"log_{uuid.uuid4().hex[:8]}",
            lock_id=lock_id,
            timestamp=datetime.now(),
            action=action,
            method=method,
            user_name=user_name,
            access_code_id=access_code_id,
            success=success,
            failure_reason=failure_reason,
        )
        self._access_logs[lock_id].append(log)

        lock = self._locks.get(lock_id)
        if lock:
            lock.last_activity = log.timestamp

        return log

    def _create_alert(
        self,
        lock_id: str,
        alert_type: str,
        severity: str,
        message: str,
    ) -> SecurityAlert:
        """Create a security alert."""
        alert = SecurityAlert(
            id=f"alert_{uuid.uuid4().hex[:8]}",
            device_type="lock",
            device_id=lock_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            timestamp=datetime.now(),
        )
        self._alerts.append(alert)
        return alert

    def list_locks(self) -> list[dict[str, Any]]:
        """List all registered smart locks."""
        return [lock.to_dict() for lock in self._locks.values()]

    def get_lock(self, lock_id: str) -> dict[str, Any] | None:
        """Get details for a specific lock."""
        lock = self._locks.get(lock_id)
        return lock.to_dict() if lock else None

    def get_lock_status(self, lock_id: str) -> dict[str, Any]:
        """Get the current status of a lock."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"error": f"Lock {lock_id} not found"}
        return {
            "lock_id": lock_id,
            "name": lock.name,
            "status": lock.status.value,
            "battery_level": lock.battery_level,
            "connected": lock.connected,
            "tamper_alert": lock.tamper_alert,
            "last_activity": lock.last_activity.isoformat() if lock.last_activity else None,
        }

    def lock(self, lock_id: str, user: str = "system") -> dict[str, Any]:
        """Lock the door."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}
        if not lock.connected:
            return {"success": False, "error": "Lock is not connected"}
        if lock.status == LockStatus.JAMMED:
            return {"success": False, "error": "Lock is jammed"}

        lock.status = LockStatus.LOCKED
        log = self._log_access(
            lock_id=lock_id,
            action="lock",
            method=AccessMethod.REMOTE,
            user_name=user,
        )

        return {
            "success": True,
            "lock_id": lock_id,
            "status": lock.status.value,
            "message": f"{lock.name} is now locked",
            "log_id": log.id,
        }

    def unlock(
        self,
        lock_id: str,
        code: str | None = None,
        user: str = "system",
        method: str = "remote",
    ) -> dict[str, Any]:
        """Unlock the door with optional code verification."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}
        if not lock.connected:
            return {"success": False, "error": "Lock is not connected"}
        if lock.status == LockStatus.JAMMED:
            return {"success": False, "error": "Lock is jammed"}

        access_method = AccessMethod.REMOTE
        access_code_id = None

        if code:
            access_method = AccessMethod.PIN_CODE
            code_hash = self._hash_code(code)
            valid_code = self._validate_code(lock_id, code_hash)
            if not valid_code:
                log = self._log_access(
                    lock_id=lock_id,
                    action="unlock",
                    method=access_method,
                    success=False,
                    failure_reason="Invalid code",
                )
                failed_attempts = sum(
                    1 for log_entry in self._access_logs[lock_id][-10:]
                    if not log_entry.success and log_entry.method == AccessMethod.PIN_CODE
                )
                if failed_attempts >= 3:
                    self._create_alert(
                        lock_id=lock_id,
                        alert_type="multiple_failed_attempts",
                        severity="warning",
                        message=f"Multiple failed unlock attempts on {lock.name}",
                    )
                return {
                    "success": False,
                    "error": "Invalid access code",
                    "log_id": log.id,
                }
            access_code_id = valid_code.id
            valid_code.use_count += 1
            valid_code.last_used = datetime.now()
            user = valid_code.name
        elif method:
            try:
                access_method = AccessMethod(method.lower())
            except ValueError:
                access_method = AccessMethod.REMOTE

        lock.status = LockStatus.UNLOCKED
        log = self._log_access(
            lock_id=lock_id,
            action="unlock",
            method=access_method,
            user_name=user,
            access_code_id=access_code_id,
        )

        return {
            "success": True,
            "lock_id": lock_id,
            "status": lock.status.value,
            "message": f"{lock.name} is now unlocked",
            "log_id": log.id,
            "auto_lock_in_seconds": (
                lock.auto_lock_delay_seconds if lock.auto_lock_enabled else None
            ),
        }

    def _validate_code(self, lock_id: str, code_hash: str) -> AccessCode | None:
        """Validate an access code."""
        codes = self._access_codes.get(lock_id, [])
        now = datetime.now()

        for code in codes:
            if code.code_hash != code_hash:
                continue
            if not code.active:
                continue
            if code.valid_from and now < code.valid_from:
                continue
            if code.valid_until and now > code.valid_until:
                continue
            if code.max_uses and code.use_count >= code.max_uses:
                continue
            if code.allowed_days and now.strftime("%A").lower() not in [
                d.lower() for d in code.allowed_days
            ]:
                continue
            if code.allowed_hours_start is not None and code.allowed_hours_end is not None:
                if not (code.allowed_hours_start <= now.hour < code.allowed_hours_end):
                    continue
            return code

        return None

    def add_access_code(
        self,
        lock_id: str,
        name: str,
        code: str,
        one_time: bool = False,
        valid_days: int | None = None,
        allowed_days: list[str] | None = None,
        allowed_hours_start: int | None = None,
        allowed_hours_end: int | None = None,
    ) -> dict[str, Any]:
        """Add a new access code."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        if len(code) < 4:
            return {"success": False, "error": "Code must be at least 4 digits"}

        access_code = AccessCode(
            id=f"code_{uuid.uuid4().hex[:8]}",
            lock_id=lock_id,
            name=name,
            code_hash=self._hash_code(code),
            one_time=one_time,
            max_uses=1 if one_time else None,
            valid_until=datetime.now() + timedelta(days=valid_days) if valid_days else None,
            allowed_days=allowed_days or [],
            allowed_hours_start=allowed_hours_start,
            allowed_hours_end=allowed_hours_end,
        )
        self._access_codes[lock_id].append(access_code)

        return {
            "success": True,
            "code_id": access_code.id,
            "name": name,
            "lock_id": lock_id,
        }

    def remove_access_code(self, lock_id: str, code_id: str) -> dict[str, Any]:
        """Remove an access code."""
        if lock_id not in self._access_codes:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        codes = self._access_codes[lock_id]
        for i, code in enumerate(codes):
            if code.id == code_id:
                codes.pop(i)
                return {"success": True, "message": f"Code {code.name} removed"}

        return {"success": False, "error": f"Code {code_id} not found"}

    def list_access_codes(self, lock_id: str) -> list[dict[str, Any]]:
        """List all access codes for a lock."""
        codes = self._access_codes.get(lock_id, [])
        return [code.to_dict() for code in codes]

    def deactivate_access_code(self, lock_id: str, code_id: str) -> dict[str, Any]:
        """Deactivate an access code."""
        if lock_id not in self._access_codes:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        for code in self._access_codes[lock_id]:
            if code.id == code_id:
                code.active = False
                return {"success": True, "message": f"Code {code.name} deactivated"}

        return {"success": False, "error": f"Code {code_id} not found"}

    def get_access_logs(
        self,
        lock_id: str,
        since: datetime | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Get access logs for a lock."""
        logs = self._access_logs.get(lock_id, [])
        if since:
            logs = [log for log in logs if log.timestamp >= since]
        logs.sort(key=lambda x: x.timestamp, reverse=True)
        return [log.to_dict() for log in logs[:limit]]

    def set_auto_lock(
        self,
        lock_id: str,
        enabled: bool,
        delay_seconds: int | None = None,
    ) -> dict[str, Any]:
        """Configure auto-lock settings."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        lock.auto_lock_enabled = enabled
        if delay_seconds is not None:
            lock.auto_lock_delay_seconds = delay_seconds

        return {
            "success": True,
            "lock_id": lock_id,
            "auto_lock_enabled": lock.auto_lock_enabled,
            "auto_lock_delay_seconds": lock.auto_lock_delay_seconds,
        }

    def get_battery_status(self, lock_id: str) -> dict[str, Any]:
        """Get battery status for a lock."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"error": f"Lock {lock_id} not found"}

        status = "good"
        if lock.battery_level < 20:
            status = "critical"
        elif lock.battery_level < 40:
            status = "low"

        return {
            "lock_id": lock_id,
            "battery_level": lock.battery_level,
            "status": status,
            "needs_replacement": lock.battery_level < 20,
        }

    def simulate_tamper(self, lock_id: str) -> dict[str, Any]:
        """Simulate a tamper alert (for testing)."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        lock.tamper_alert = True
        alert = self._create_alert(
            lock_id=lock_id,
            alert_type="tamper_detected",
            severity="critical",
            message=f"Tamper detected on {lock.name}!",
        )

        return {
            "success": True,
            "alert": alert.to_dict(),
        }

    def clear_tamper_alert(self, lock_id: str) -> dict[str, Any]:
        """Clear a tamper alert."""
        lock = self._locks.get(lock_id)
        if not lock:
            return {"success": False, "error": f"Lock {lock_id} not found"}

        lock.tamper_alert = False
        return {"success": True, "message": "Tamper alert cleared"}

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
