"""
Home Security MCP Server

An MCP (Model Context Protocol) server for managing home security devices
including cameras and smart locks. This server exposes tools and resources
that can be consumed by LLMs and AI agents.

Usage:
    # Run with stdio transport (for local LLM clients)
    python -m src.mcp_servers.home_security.server

    # Run with SSE transport (for remote access)
    python -m src.mcp_servers.home_security.server --transport sse --port 8000
"""

from datetime import datetime, timedelta
from typing import Any

from mcp.server.fastmcp import FastMCP

from .camera import CameraManager
from .lock import SmartLockManager

mcp = FastMCP(
    "Home Security",
    instructions="MCP server for managing home security cameras and smart locks",
)

camera_manager = CameraManager()
lock_manager = SmartLockManager()


# =============================================================================
# RESOURCES - Read-only data endpoints
# =============================================================================


@mcp.resource("security://cameras")
def list_all_cameras() -> list[dict[str, Any]]:
    """List all registered security cameras with their current status."""
    return camera_manager.list_cameras()


@mcp.resource("security://cameras/{camera_id}")
def get_camera_details(camera_id: str) -> dict[str, Any]:
    """Get detailed information about a specific camera."""
    result = camera_manager.get_camera(camera_id)
    if result is None:
        return {"error": f"Camera {camera_id} not found"}
    return result


@mcp.resource("security://cameras/{camera_id}/status")
def get_camera_status_resource(camera_id: str) -> dict[str, Any]:
    """Get the current operational status of a camera."""
    return camera_manager.get_camera_status(camera_id)


@mcp.resource("security://cameras/{camera_id}/storage")
def get_camera_storage(camera_id: str) -> dict[str, Any]:
    """Get storage usage information for a camera."""
    return camera_manager.get_storage_info(camera_id)


@mcp.resource("security://locks")
def list_all_locks() -> list[dict[str, Any]]:
    """List all registered smart locks with their current status."""
    return lock_manager.list_locks()


@mcp.resource("security://locks/{lock_id}")
def get_lock_details(lock_id: str) -> dict[str, Any]:
    """Get detailed information about a specific lock."""
    result = lock_manager.get_lock(lock_id)
    if result is None:
        return {"error": f"Lock {lock_id} not found"}
    return result


@mcp.resource("security://locks/{lock_id}/status")
def get_lock_status_resource(lock_id: str) -> dict[str, Any]:
    """Get the current status of a lock."""
    return lock_manager.get_lock_status(lock_id)


@mcp.resource("security://locks/{lock_id}/battery")
def get_lock_battery(lock_id: str) -> dict[str, Any]:
    """Get battery status for a lock."""
    return lock_manager.get_battery_status(lock_id)


@mcp.resource("security://alerts")
def get_all_alerts() -> dict[str, Any]:
    """Get all security alerts from all devices."""
    camera_alerts = camera_manager.get_alerts()
    lock_alerts = lock_manager.get_alerts()
    all_alerts = camera_alerts + lock_alerts
    all_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return {
        "total": len(all_alerts),
        "alerts": all_alerts[:100],
    }


@mcp.resource("security://system/status")
def get_system_status() -> dict[str, Any]:
    """Get overall system status including all devices and alerts."""
    cameras = camera_manager.list_cameras()
    locks = lock_manager.list_locks()
    camera_alerts = camera_manager.get_alerts(unacknowledged_only=True)
    lock_alerts = lock_manager.get_alerts(unacknowledged_only=True)

    online_cameras = sum(1 for c in cameras if c["status"] != "offline")
    locked_doors = sum(1 for lock in locks if lock["status"] == "locked")
    low_battery_locks = [lock for lock in locks if lock["battery_level"] < 20]

    return {
        "timestamp": datetime.now().isoformat(),
        "cameras": {
            "total": len(cameras),
            "online": online_cameras,
            "offline": len(cameras) - online_cameras,
        },
        "locks": {
            "total": len(locks),
            "locked": locked_doors,
            "unlocked": len(locks) - locked_doors,
            "low_battery": [lock["id"] for lock in low_battery_locks],
        },
        "alerts": {
            "unacknowledged": len(camera_alerts) + len(lock_alerts),
        },
        "overall_status": "secure" if locked_doors == len(locks) else "attention_needed",
    }


# =============================================================================
# CAMERA TOOLS - Actions for camera management
# =============================================================================


@mcp.tool()
def get_camera_status(camera_id: str) -> dict[str, Any]:
    """
    Get the current status of a security camera.

    Args:
        camera_id: The unique identifier of the camera (e.g., 'cam_front_door')

    Returns:
        Camera status including online state, recording status, and motion detection.
    """
    return camera_manager.get_camera_status(camera_id)


@mcp.tool()
def start_camera_recording(camera_id: str) -> dict[str, Any]:
    """
    Start recording on a security camera.

    Args:
        camera_id: The unique identifier of the camera

    Returns:
        Result indicating success or failure of the recording start.
    """
    return camera_manager.start_recording(camera_id)


@mcp.tool()
def stop_camera_recording(camera_id: str) -> dict[str, Any]:
    """
    Stop recording on a security camera.

    Args:
        camera_id: The unique identifier of the camera

    Returns:
        Result indicating success or failure of the recording stop.
    """
    return camera_manager.stop_recording(camera_id)


@mcp.tool()
def get_camera_stream_url(camera_id: str) -> dict[str, Any]:
    """
    Get the live streaming URL for a camera.

    Args:
        camera_id: The unique identifier of the camera

    Returns:
        The RTSP streaming URL for the camera.
    """
    return camera_manager.get_stream_url(camera_id)


@mcp.tool()
def capture_camera_snapshot(camera_id: str) -> dict[str, Any]:
    """
    Capture a snapshot image from a camera.

    Args:
        camera_id: The unique identifier of the camera

    Returns:
        URL of the captured snapshot and metadata.
    """
    return camera_manager.capture_snapshot(camera_id)


@mcp.tool()
def configure_motion_detection(
    camera_id: str,
    enabled: bool,
    sensitivity: str | None = None,
) -> dict[str, Any]:
    """
    Configure motion detection settings for a camera.

    Args:
        camera_id: The unique identifier of the camera
        enabled: Whether to enable motion detection
        sensitivity: Detection sensitivity - 'low', 'medium', or 'high'

    Returns:
        Updated motion detection configuration.
    """
    return camera_manager.set_motion_detection(camera_id, enabled, sensitivity)


@mcp.tool()
def get_motion_events(
    camera_id: str | None = None,
    hours_back: int = 24,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Get recent motion detection events.

    Args:
        camera_id: Optional camera ID to filter events
        hours_back: Number of hours to look back (default 24)
        limit: Maximum number of events to return (default 50)

    Returns:
        List of motion events with timestamps and details.
    """
    since = datetime.now() - timedelta(hours=hours_back)
    return camera_manager.get_motion_events(camera_id, since, limit)


@mcp.tool()
def acknowledge_motion_event(event_id: str) -> dict[str, Any]:
    """
    Acknowledge a motion detection event.

    Args:
        event_id: The unique identifier of the motion event

    Returns:
        Result indicating success or failure.
    """
    return camera_manager.acknowledge_motion_event(event_id)


@mcp.tool()
def get_camera_recordings(
    camera_id: str,
    hours_back: int = 24,
) -> list[dict[str, Any]]:
    """
    Get list of recordings for a camera.

    Args:
        camera_id: The unique identifier of the camera
        hours_back: Number of hours to look back (default 24)

    Returns:
        List of available recordings with URLs.
    """
    start_time = datetime.now() - timedelta(hours=hours_back)
    return camera_manager.get_recordings(camera_id, start_time)


@mcp.tool()
def update_camera_settings(
    camera_id: str,
    resolution: str | None = None,
    night_vision: bool | None = None,
) -> dict[str, Any]:
    """
    Update camera settings.

    Args:
        camera_id: The unique identifier of the camera
        resolution: Video resolution (e.g., '1080p', '4K')
        night_vision: Enable or disable night vision

    Returns:
        Updated camera settings.
    """
    return camera_manager.set_camera_settings(camera_id, resolution, night_vision)


# =============================================================================
# LOCK TOOLS - Actions for smart lock management
# =============================================================================


@mcp.tool()
def get_lock_status(lock_id: str) -> dict[str, Any]:
    """
    Get the current status of a smart lock.

    Args:
        lock_id: The unique identifier of the lock (e.g., 'lock_front_door')

    Returns:
        Lock status including locked/unlocked state, battery level, and connectivity.
    """
    return lock_manager.get_lock_status(lock_id)


@mcp.tool()
def lock_door(lock_id: str, user: str = "assistant") -> dict[str, Any]:
    """
    Lock a smart door lock.

    Args:
        lock_id: The unique identifier of the lock
        user: Name of the user/agent performing the action

    Returns:
        Result indicating success or failure of the lock operation.
    """
    return lock_manager.lock(lock_id, user)


@mcp.tool()
def unlock_door(
    lock_id: str,
    code: str | None = None,
    user: str = "assistant",
) -> dict[str, Any]:
    """
    Unlock a smart door lock.

    SECURITY NOTE: This action unlocks a physical door. Use with caution.

    Args:
        lock_id: The unique identifier of the lock
        code: Optional PIN code for verification
        user: Name of the user/agent performing the action

    Returns:
        Result indicating success or failure, plus auto-lock timing if enabled.
    """
    return lock_manager.unlock(lock_id, code, user)


@mcp.tool()
def add_lock_access_code(
    lock_id: str,
    name: str,
    code: str,
    one_time: bool = False,
    valid_days: int | None = None,
) -> dict[str, Any]:
    """
    Add a new access code to a smart lock.

    Args:
        lock_id: The unique identifier of the lock
        name: Friendly name for this code (e.g., 'House Cleaner')
        code: The PIN code (minimum 4 digits)
        one_time: Whether the code can only be used once
        valid_days: Number of days the code is valid (None = permanent)

    Returns:
        The created access code details (code ID, not the actual code).
    """
    return lock_manager.add_access_code(lock_id, name, code, one_time, valid_days)


@mcp.tool()
def remove_lock_access_code(lock_id: str, code_id: str) -> dict[str, Any]:
    """
    Remove an access code from a smart lock.

    Args:
        lock_id: The unique identifier of the lock
        code_id: The unique identifier of the access code to remove

    Returns:
        Result indicating success or failure.
    """
    return lock_manager.remove_access_code(lock_id, code_id)


@mcp.tool()
def list_lock_access_codes(lock_id: str) -> list[dict[str, Any]]:
    """
    List all access codes for a smart lock.

    Note: Actual code values are not returned for security.

    Args:
        lock_id: The unique identifier of the lock

    Returns:
        List of access codes with metadata (names, validity, usage).
    """
    return lock_manager.list_access_codes(lock_id)


@mcp.tool()
def deactivate_lock_access_code(lock_id: str, code_id: str) -> dict[str, Any]:
    """
    Deactivate an access code without removing it.

    Args:
        lock_id: The unique identifier of the lock
        code_id: The unique identifier of the access code

    Returns:
        Result indicating success or failure.
    """
    return lock_manager.deactivate_access_code(lock_id, code_id)


@mcp.tool()
def get_lock_access_logs(
    lock_id: str,
    hours_back: int = 24,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Get access logs for a smart lock.

    Args:
        lock_id: The unique identifier of the lock
        hours_back: Number of hours to look back (default 24)
        limit: Maximum number of log entries to return

    Returns:
        List of access log entries with timestamps, methods, and outcomes.
    """
    since = datetime.now() - timedelta(hours=hours_back)
    return lock_manager.get_access_logs(lock_id, since, limit)


@mcp.tool()
def configure_auto_lock(
    lock_id: str,
    enabled: bool,
    delay_seconds: int | None = None,
) -> dict[str, Any]:
    """
    Configure auto-lock settings for a smart lock.

    Args:
        lock_id: The unique identifier of the lock
        enabled: Whether to enable auto-lock
        delay_seconds: Seconds to wait before auto-locking (default 30)

    Returns:
        Updated auto-lock configuration.
    """
    return lock_manager.set_auto_lock(lock_id, enabled, delay_seconds)


@mcp.tool()
def clear_lock_tamper_alert(lock_id: str) -> dict[str, Any]:
    """
    Clear a tamper alert on a smart lock after investigation.

    Args:
        lock_id: The unique identifier of the lock

    Returns:
        Result indicating success or failure.
    """
    return lock_manager.clear_tamper_alert(lock_id)


# =============================================================================
# ALERT TOOLS - Actions for security alerts
# =============================================================================


@mcp.tool()
def get_security_alerts(
    unacknowledged_only: bool = False,
    limit: int = 50,
) -> dict[str, Any]:
    """
    Get security alerts from all devices.

    Args:
        unacknowledged_only: Only return alerts that haven't been acknowledged
        limit: Maximum number of alerts to return

    Returns:
        List of security alerts sorted by timestamp.
    """
    camera_alerts = camera_manager.get_alerts(unacknowledged_only, limit)
    lock_alerts = lock_manager.get_alerts(unacknowledged_only, limit)
    all_alerts = camera_alerts + lock_alerts
    all_alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return {
        "total": len(all_alerts),
        "alerts": all_alerts[:limit],
    }


@mcp.tool()
def acknowledge_security_alert(
    alert_id: str,
    acknowledged_by: str = "assistant",
) -> dict[str, Any]:
    """
    Acknowledge a security alert.

    Args:
        alert_id: The unique identifier of the alert
        acknowledged_by: Name of the user/agent acknowledging

    Returns:
        Result indicating success or failure.
    """
    result = camera_manager.acknowledge_alert(alert_id, acknowledged_by)
    if result.get("success"):
        return result
    return lock_manager.acknowledge_alert(alert_id, acknowledged_by)


# =============================================================================
# TESTING TOOLS - Simulation tools for development
# =============================================================================


@mcp.tool()
def simulate_motion_detected(camera_id: str, zone: str = "main") -> dict[str, Any]:
    """
    [TEST ONLY] Simulate a motion detection event.

    Args:
        camera_id: The camera to simulate motion on
        zone: The detection zone name

    Returns:
        The generated motion event and alert.
    """
    return camera_manager.simulate_motion_event(camera_id, zone)


@mcp.tool()
def simulate_tamper_alert(lock_id: str) -> dict[str, Any]:
    """
    [TEST ONLY] Simulate a tamper detection on a lock.

    Args:
        lock_id: The lock to simulate tampering on

    Returns:
        The generated tamper alert.
    """
    return lock_manager.simulate_tamper(lock_id)


# =============================================================================
# PROMPTS - Pre-defined prompts for common tasks
# =============================================================================


@mcp.prompt()
def security_check() -> str:
    """Generate a prompt for performing a full security check."""
    return """Please perform a comprehensive security check of the home:

1. Check the status of all cameras - are they online and recording?
2. Check if all doors are locked
3. Review any recent motion events
4. Check for any unacknowledged security alerts
5. Verify battery levels on all smart locks

Provide a summary of the security status and flag any concerns."""


@mcp.prompt()
def prepare_for_vacation() -> str:
    """Generate a prompt for vacation preparation."""
    return """Help me prepare the home security system for vacation:

1. Ensure all cameras have motion detection enabled with HIGH sensitivity
2. Start recording on all cameras
3. Lock all doors
4. Enable auto-lock on all smart locks
5. List current access codes - disable any temporary ones
6. Provide a final security status report"""


@mcp.prompt()
def guest_access_setup(guest_name: str, days_valid: int = 7) -> str:
    """Generate a prompt for setting up guest access."""
    return f"""Help me set up temporary access for a guest:

Guest name: {guest_name}
Access duration: {days_valid} days

Please:
1. Create a temporary access code for the front door
2. Make sure the code expires after {days_valid} days
3. Confirm the current lock status
4. Provide instructions I can share with the guest"""


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Home Security MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse"],
        default="stdio",
        help="Transport method (default: stdio)",
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host for SSE transport (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for SSE transport (default: 8000)",
    )

    args = parser.parse_args()

    if args.transport == "sse":
        mcp.run(transport="sse", host=args.host, port=args.port)
    else:
        mcp.run()
