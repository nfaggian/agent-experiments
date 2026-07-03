"""Smart home device integration tools for locks, cameras, and sensors."""

from datetime import datetime, timedelta
from typing import Any
import random
import uuid

# Simulated device state storage (in production, this would connect to real APIs)
_device_state: dict[str, Any] = {
    "locks": {
        "front_door": {
            "id": "lock_001",
            "name": "Front Door",
            "location": "Main Entrance",
            "is_locked": True,
            "battery_level": 85,
            "last_activity": None,
        },
        "back_door": {
            "id": "lock_002",
            "name": "Back Door",
            "location": "Kitchen Exit",
            "is_locked": True,
            "battery_level": 72,
            "last_activity": None,
        },
        "garage_door": {
            "id": "lock_003",
            "name": "Garage Door",
            "location": "Garage",
            "is_locked": False,
            "battery_level": 45,
            "last_activity": None,
        },
        "side_gate": {
            "id": "lock_004",
            "name": "Side Gate",
            "location": "Side Yard",
            "is_locked": True,
            "battery_level": 90,
            "last_activity": None,
        },
    },
    "cameras": {
        "front_porch": {
            "id": "cam_001",
            "name": "Front Porch Camera",
            "location": "Front Entrance",
            "is_online": True,
            "is_recording": True,
            "motion_detected": False,
            "night_vision": True,
            "resolution": "1080p",
            "last_motion": None,
        },
        "backyard": {
            "id": "cam_002",
            "name": "Backyard Camera",
            "location": "Backyard",
            "is_online": True,
            "is_recording": True,
            "motion_detected": True,
            "night_vision": True,
            "resolution": "4K",
            "last_motion": None,
        },
        "driveway": {
            "id": "cam_003",
            "name": "Driveway Camera",
            "location": "Driveway",
            "is_online": True,
            "is_recording": True,
            "motion_detected": False,
            "night_vision": True,
            "resolution": "1080p",
            "last_motion": None,
        },
        "garage_interior": {
            "id": "cam_004",
            "name": "Garage Interior",
            "location": "Inside Garage",
            "is_online": False,
            "is_recording": False,
            "motion_detected": False,
            "night_vision": False,
            "resolution": "720p",
            "last_motion": None,
        },
    },
    "sensors": {
        "living_room_motion": {
            "id": "sensor_001",
            "name": "Living Room Motion",
            "type": "motion",
            "location": "Living Room",
            "is_triggered": False,
            "battery_level": 95,
            "last_triggered": None,
        },
        "front_door_contact": {
            "id": "sensor_002",
            "name": "Front Door Contact",
            "type": "door_window",
            "location": "Front Door",
            "is_triggered": False,
            "battery_level": 88,
            "last_triggered": None,
        },
        "kitchen_smoke": {
            "id": "sensor_003",
            "name": "Kitchen Smoke Detector",
            "type": "smoke",
            "location": "Kitchen",
            "is_triggered": False,
            "battery_level": 100,
            "last_triggered": None,
        },
        "basement_water": {
            "id": "sensor_004",
            "name": "Basement Water Sensor",
            "type": "water_leak",
            "location": "Basement",
            "is_triggered": False,
            "battery_level": 78,
            "last_triggered": None,
        },
        "bedroom_window": {
            "id": "sensor_005",
            "name": "Master Bedroom Window",
            "type": "door_window",
            "location": "Master Bedroom",
            "is_triggered": False,
            "battery_level": 65,
            "last_triggered": None,
        },
    },
    "security_system": {
        "is_armed": False,
        "arm_mode": "disarmed",
        "last_armed": None,
        "last_disarmed": None,
        "alarm_triggered": False,
    },
    "activity_log": [],
}


def _log_activity(event_type: str, device_name: str, details: str) -> None:
    """Log an activity event."""
    _device_state["activity_log"].insert(0, {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "device_name": device_name,
        "details": details,
    })
    # Keep only last 100 events
    _device_state["activity_log"] = _device_state["activity_log"][:100]


def _simulate_activity() -> None:
    """Simulate random activity for demo purposes."""
    now = datetime.now()
    
    # Set some realistic last activity times
    for lock_id, lock in _device_state["locks"].items():
        if lock["last_activity"] is None:
            minutes_ago = random.randint(5, 180)
            lock["last_activity"] = (now - timedelta(minutes=minutes_ago)).isoformat()
    
    for cam_id, cam in _device_state["cameras"].items():
        if cam["last_motion"] is None and cam["is_online"]:
            minutes_ago = random.randint(1, 60)
            cam["last_motion"] = (now - timedelta(minutes=minutes_ago)).isoformat()
    
    for sensor_id, sensor in _device_state["sensors"].items():
        if sensor["last_triggered"] is None:
            minutes_ago = random.randint(10, 240)
            sensor["last_triggered"] = (now - timedelta(minutes=minutes_ago)).isoformat()


# Initialize with some activity
_simulate_activity()


# Lock Tools
def get_all_locks_status() -> dict[str, Any]:
    """
    Get the status of all smart locks in your home.
    
    Returns a dictionary with lock statuses including:
    - Lock name and location
    - Whether it's locked or unlocked
    - Battery level
    - Last activity timestamp
    """
    locks = {}
    for lock_id, lock in _device_state["locks"].items():
        locks[lock_id] = {
            "name": lock["name"],
            "location": lock["location"],
            "is_locked": lock["is_locked"],
            "battery_level": lock["battery_level"],
            "last_activity": lock["last_activity"],
            "status": "Locked" if lock["is_locked"] else "UNLOCKED",
        }
    
    unlocked_count = sum(1 for l in locks.values() if not l["is_locked"])
    
    return {
        "locks": locks,
        "total_locks": len(locks),
        "unlocked_count": unlocked_count,
        "all_secure": unlocked_count == 0,
        "summary": f"{len(locks) - unlocked_count}/{len(locks)} doors locked"
    }


def get_lock_status(lock_name: str) -> dict[str, Any]:
    """
    Get the status of a specific smart lock.
    
    Args:
        lock_name: The name/ID of the lock (e.g., 'front_door', 'back_door', 'garage_door', 'side_gate')
    
    Returns lock status including locked state, battery level, and recent activity.
    """
    lock_key = lock_name.lower().replace(" ", "_")
    
    if lock_key not in _device_state["locks"]:
        available = list(_device_state["locks"].keys())
        return {"error": f"Lock '{lock_name}' not found. Available locks: {available}"}
    
    lock = _device_state["locks"][lock_key]
    return {
        "name": lock["name"],
        "location": lock["location"],
        "is_locked": lock["is_locked"],
        "status": "Locked" if lock["is_locked"] else "UNLOCKED",
        "battery_level": lock["battery_level"],
        "battery_status": "Good" if lock["battery_level"] > 30 else "Low - Replace Soon",
        "last_activity": lock["last_activity"],
    }


def lock_door(lock_name: str) -> dict[str, Any]:
    """
    Lock a specific door.
    
    Args:
        lock_name: The name/ID of the lock to lock (e.g., 'front_door', 'back_door')
    
    Returns confirmation of the lock action.
    """
    lock_key = lock_name.lower().replace(" ", "_")
    
    if lock_key not in _device_state["locks"]:
        available = list(_device_state["locks"].keys())
        return {"error": f"Lock '{lock_name}' not found. Available locks: {available}"}
    
    lock = _device_state["locks"][lock_key]
    was_locked = lock["is_locked"]
    lock["is_locked"] = True
    lock["last_activity"] = datetime.now().isoformat()
    
    _log_activity("lock", lock["name"], f"{lock['name']} was locked")
    
    return {
        "success": True,
        "lock_name": lock["name"],
        "previous_state": "Locked" if was_locked else "Unlocked",
        "current_state": "Locked",
        "message": f"{lock['name']} is now locked" if not was_locked else f"{lock['name']} was already locked",
        "timestamp": lock["last_activity"],
    }


def unlock_door(lock_name: str, confirm: bool = False) -> dict[str, Any]:
    """
    Unlock a specific door. Requires confirmation for security.
    
    Args:
        lock_name: The name/ID of the lock to unlock
        confirm: Must be True to confirm the unlock action
    
    Returns confirmation of the unlock action.
    """
    if not confirm:
        return {
            "success": False,
            "message": "Unlock action requires confirmation. Set confirm=True to proceed.",
            "warning": "Unlocking doors remotely should be done with caution.",
        }
    
    lock_key = lock_name.lower().replace(" ", "_")
    
    if lock_key not in _device_state["locks"]:
        available = list(_device_state["locks"].keys())
        return {"error": f"Lock '{lock_name}' not found. Available locks: {available}"}
    
    lock = _device_state["locks"][lock_key]
    was_locked = lock["is_locked"]
    lock["is_locked"] = False
    lock["last_activity"] = datetime.now().isoformat()
    
    _log_activity("unlock", lock["name"], f"{lock['name']} was unlocked")
    
    return {
        "success": True,
        "lock_name": lock["name"],
        "previous_state": "Locked" if was_locked else "Unlocked",
        "current_state": "Unlocked",
        "message": f"{lock['name']} is now unlocked" if was_locked else f"{lock['name']} was already unlocked",
        "timestamp": lock["last_activity"],
        "warning": "Remember to lock this door when done.",
    }


# Camera Tools
def get_all_cameras_status() -> dict[str, Any]:
    """
    Get the status of all security cameras.
    
    Returns camera statuses including:
    - Online/offline status
    - Recording status
    - Motion detection status
    - Resolution and capabilities
    """
    cameras = {}
    offline_count = 0
    motion_count = 0
    
    for cam_id, cam in _device_state["cameras"].items():
        cameras[cam_id] = {
            "name": cam["name"],
            "location": cam["location"],
            "is_online": cam["is_online"],
            "is_recording": cam["is_recording"],
            "motion_detected": cam["motion_detected"],
            "resolution": cam["resolution"],
            "night_vision": cam["night_vision"],
            "last_motion": cam["last_motion"],
            "status": "Online" if cam["is_online"] else "OFFLINE",
        }
        if not cam["is_online"]:
            offline_count += 1
        if cam["motion_detected"]:
            motion_count += 1
    
    return {
        "cameras": cameras,
        "total_cameras": len(cameras),
        "online_count": len(cameras) - offline_count,
        "offline_count": offline_count,
        "cameras_with_motion": motion_count,
        "all_online": offline_count == 0,
        "summary": f"{len(cameras) - offline_count}/{len(cameras)} cameras online, {motion_count} detecting motion"
    }


def get_camera_status(camera_name: str) -> dict[str, Any]:
    """
    Get detailed status of a specific camera.
    
    Args:
        camera_name: The name/ID of the camera (e.g., 'front_porch', 'backyard', 'driveway')
    
    Returns detailed camera information.
    """
    cam_key = camera_name.lower().replace(" ", "_")
    
    if cam_key not in _device_state["cameras"]:
        available = list(_device_state["cameras"].keys())
        return {"error": f"Camera '{camera_name}' not found. Available cameras: {available}"}
    
    cam = _device_state["cameras"][cam_key]
    return {
        "name": cam["name"],
        "location": cam["location"],
        "is_online": cam["is_online"],
        "status": "Online" if cam["is_online"] else "OFFLINE",
        "is_recording": cam["is_recording"],
        "motion_detected": cam["motion_detected"],
        "resolution": cam["resolution"],
        "night_vision": "Enabled" if cam["night_vision"] else "Disabled",
        "last_motion": cam["last_motion"],
    }


def get_camera_snapshot(camera_name: str) -> dict[str, Any]:
    """
    Request a snapshot from a specific camera.
    
    Args:
        camera_name: The name/ID of the camera
    
    Returns snapshot metadata (in production would include image URL).
    """
    cam_key = camera_name.lower().replace(" ", "_")
    
    if cam_key not in _device_state["cameras"]:
        available = list(_device_state["cameras"].keys())
        return {"error": f"Camera '{camera_name}' not found. Available cameras: {available}"}
    
    cam = _device_state["cameras"][cam_key]
    
    if not cam["is_online"]:
        return {
            "success": False,
            "camera_name": cam["name"],
            "error": "Camera is offline. Cannot capture snapshot.",
        }
    
    _log_activity("snapshot", cam["name"], f"Snapshot captured from {cam['name']}")
    
    return {
        "success": True,
        "camera_name": cam["name"],
        "location": cam["location"],
        "timestamp": datetime.now().isoformat(),
        "resolution": cam["resolution"],
        "snapshot_id": str(uuid.uuid4()),
        "message": f"Snapshot captured from {cam['name']}",
        "image_url": f"/api/cameras/{cam_key}/snapshot/{uuid.uuid4()}",
    }


def get_motion_events(hours: int = 24) -> dict[str, Any]:
    """
    Get recent motion detection events from all cameras.
    
    Args:
        hours: Number of hours to look back (default 24)
    
    Returns list of motion events with timestamps and camera info.
    """
    cutoff = datetime.now() - timedelta(hours=hours)
    events = []
    
    # Generate some simulated motion events
    event_descriptions = [
        "Person detected",
        "Vehicle detected",
        "Animal detected",
        "Package delivered",
        "Motion near entrance",
        "Movement in yard",
    ]
    
    for cam_id, cam in _device_state["cameras"].items():
        if cam["is_online"] and cam["last_motion"]:
            # Generate 1-5 events per camera
            num_events = random.randint(1, 5)
            for i in range(num_events):
                minutes_ago = random.randint(1, hours * 60)
                event_time = datetime.now() - timedelta(minutes=minutes_ago)
                if event_time > cutoff:
                    events.append({
                        "camera_id": cam_id,
                        "camera_name": cam["name"],
                        "location": cam["location"],
                        "timestamp": event_time.isoformat(),
                        "event_type": random.choice(event_descriptions),
                        "confidence": random.randint(75, 99),
                    })
    
    # Sort by timestamp descending
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "events": events[:20],  # Limit to 20 most recent
        "total_events": len(events),
        "time_range_hours": hours,
        "summary": f"{len(events)} motion events in the last {hours} hours"
    }


# Sensor Tools
def get_all_sensors_status() -> dict[str, Any]:
    """
    Get the status of all home sensors (motion, door/window, smoke, water).
    
    Returns sensor statuses including:
    - Triggered state
    - Battery levels
    - Sensor types and locations
    """
    sensors = {}
    triggered_count = 0
    low_battery_count = 0
    
    for sensor_id, sensor in _device_state["sensors"].items():
        sensors[sensor_id] = {
            "name": sensor["name"],
            "type": sensor["type"],
            "location": sensor["location"],
            "is_triggered": sensor["is_triggered"],
            "battery_level": sensor["battery_level"],
            "battery_status": "Good" if sensor["battery_level"] > 30 else "Low",
            "last_triggered": sensor["last_triggered"],
        }
        if sensor["is_triggered"]:
            triggered_count += 1
        if sensor["battery_level"] <= 30:
            low_battery_count += 1
    
    return {
        "sensors": sensors,
        "total_sensors": len(sensors),
        "triggered_count": triggered_count,
        "low_battery_count": low_battery_count,
        "all_normal": triggered_count == 0,
        "summary": f"{len(sensors)} sensors monitored, {triggered_count} currently triggered"
    }


# Security System Tools
def arm_security_system(mode: str = "away") -> dict[str, Any]:
    """
    Arm the home security system.
    
    Args:
        mode: Arm mode - 'away' (full), 'home' (perimeter only), or 'night' (night mode)
    
    Returns confirmation of the arm action.
    """
    valid_modes = ["away", "home", "night"]
    if mode.lower() not in valid_modes:
        return {"error": f"Invalid mode. Valid modes are: {valid_modes}"}
    
    # Check if any doors are unlocked
    unlocked_locks = [
        lock["name"] for lock in _device_state["locks"].values() 
        if not lock["is_locked"]
    ]
    
    if unlocked_locks:
        return {
            "success": False,
            "error": "Cannot arm system with doors unlocked",
            "unlocked_doors": unlocked_locks,
            "suggestion": "Please lock all doors before arming the security system.",
        }
    
    _device_state["security_system"]["is_armed"] = True
    _device_state["security_system"]["arm_mode"] = mode.lower()
    _device_state["security_system"]["last_armed"] = datetime.now().isoformat()
    
    _log_activity("arm", "Security System", f"System armed in {mode} mode")
    
    mode_descriptions = {
        "away": "All sensors active - full protection",
        "home": "Perimeter sensors only - interior motion off",
        "night": "Perimeter + selected interior sensors",
    }
    
    return {
        "success": True,
        "is_armed": True,
        "mode": mode.lower(),
        "mode_description": mode_descriptions[mode.lower()],
        "armed_at": _device_state["security_system"]["last_armed"],
        "message": f"Security system armed in {mode} mode",
    }


def disarm_security_system(pin: str | None = None) -> dict[str, Any]:
    """
    Disarm the home security system.
    
    Args:
        pin: Security PIN (optional in simulation, required in production)
    
    Returns confirmation of the disarm action.
    """
    was_armed = _device_state["security_system"]["is_armed"]
    
    _device_state["security_system"]["is_armed"] = False
    _device_state["security_system"]["arm_mode"] = "disarmed"
    _device_state["security_system"]["last_disarmed"] = datetime.now().isoformat()
    _device_state["security_system"]["alarm_triggered"] = False
    
    _log_activity("disarm", "Security System", "System disarmed")
    
    return {
        "success": True,
        "is_armed": False,
        "previous_state": "Armed" if was_armed else "Already disarmed",
        "disarmed_at": _device_state["security_system"]["last_disarmed"],
        "message": "Security system disarmed" if was_armed else "System was already disarmed",
    }


def get_security_system_status() -> dict[str, Any]:
    """
    Get the current status of the security system.
    
    Returns:
    - Armed/disarmed state
    - Current arm mode
    - Alarm status
    - Last state changes
    """
    system = _device_state["security_system"]
    
    return {
        "is_armed": system["is_armed"],
        "arm_mode": system["arm_mode"],
        "status": "Armed" if system["is_armed"] else "Disarmed",
        "alarm_triggered": system["alarm_triggered"],
        "last_armed": system["last_armed"],
        "last_disarmed": system["last_disarmed"],
    }


# Summary Tools
def get_recent_activity(count: int = 10) -> dict[str, Any]:
    """
    Get recent activity log from all home security devices.
    
    Args:
        count: Number of recent events to return (default 10, max 50)
    
    Returns list of recent activity events.
    """
    count = min(count, 50)
    activities = _device_state["activity_log"][:count]
    
    return {
        "activities": activities,
        "count": len(activities),
        "message": f"Showing {len(activities)} most recent activities"
    }


def get_home_summary() -> dict[str, Any]:
    """
    Get a comprehensive summary of your home security status.
    
    Returns an overview of:
    - Lock status (all doors)
    - Camera status (all cameras)
    - Sensor status (all sensors)
    - Security system status
    - Recent alerts
    """
    locks_status = get_all_locks_status()
    cameras_status = get_all_cameras_status()
    sensors_status = get_all_sensors_status()
    system_status = get_security_system_status()
    
    # Determine overall security score
    issues = []
    
    if not locks_status["all_secure"]:
        issues.append(f"{locks_status['unlocked_count']} door(s) unlocked")
    
    if cameras_status["offline_count"] > 0:
        issues.append(f"{cameras_status['offline_count']} camera(s) offline")
    
    if sensors_status["low_battery_count"] > 0:
        issues.append(f"{sensors_status['low_battery_count']} sensor(s) with low battery")
    
    if not system_status["is_armed"]:
        issues.append("Security system is disarmed")
    
    # Calculate security score (0-100)
    security_score = 100
    if not locks_status["all_secure"]:
        security_score -= 25
    if cameras_status["offline_count"] > 0:
        security_score -= 15
    if sensors_status["low_battery_count"] > 0:
        security_score -= 10
    if not system_status["is_armed"]:
        security_score -= 20
    
    security_level = "Excellent" if security_score >= 90 else (
        "Good" if security_score >= 70 else (
            "Fair" if security_score >= 50 else "Needs Attention"
        )
    )
    
    return {
        "timestamp": datetime.now().isoformat(),
        "security_score": security_score,
        "security_level": security_level,
        "locks": {
            "summary": locks_status["summary"],
            "all_secure": locks_status["all_secure"],
            "unlocked_count": locks_status["unlocked_count"],
        },
        "cameras": {
            "summary": cameras_status["summary"],
            "all_online": cameras_status["all_online"],
            "offline_count": cameras_status["offline_count"],
            "motion_detected": cameras_status["cameras_with_motion"],
        },
        "sensors": {
            "summary": sensors_status["summary"],
            "all_normal": sensors_status["all_normal"],
            "triggered_count": sensors_status["triggered_count"],
            "low_battery_count": sensors_status["low_battery_count"],
        },
        "security_system": system_status,
        "issues": issues if issues else ["No issues - home is secure"],
        "recommendations": _get_recommendations(locks_status, cameras_status, sensors_status, system_status),
    }


def _get_recommendations(
    locks: dict[str, Any],
    cameras: dict[str, Any],
    sensors: dict[str, Any],
    system: dict[str, Any],
) -> list[str]:
    """Generate security recommendations based on current status."""
    recommendations = []
    
    if not locks["all_secure"]:
        recommendations.append("Lock all doors for better security")
    
    if cameras["offline_count"] > 0:
        recommendations.append("Check offline cameras - they may need attention")
    
    if sensors["low_battery_count"] > 0:
        recommendations.append("Replace batteries in sensors with low battery levels")
    
    if not system["is_armed"] and locks["all_secure"]:
        recommendations.append("Consider arming the security system")
    
    if cameras["cameras_with_motion"] > 0:
        recommendations.append("Review motion alerts from active cameras")
    
    if not recommendations:
        recommendations.append("Your home security looks great! Keep up the good habits.")
    
    return recommendations
