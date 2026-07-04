"""FastAPI application for Home Security Mobile API."""

import uuid
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.agents.home_security_agent.tools import (
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
)

from .models import (
    ActionResponse,
    ArmSystemRequest,
    ChatMessageRequest,
    ChatMessageResponse,
    DisarmSystemRequest,
    HealthResponse,
    LockActionRequest,
    MotionEventsResponse,
    RecentActivityResponse,
    SecurityMode,
    SnapshotResponse,
    DeviceRegistration,
    NotificationSettings,
)

# Simple in-memory storage for chat sessions and notifications
_chat_sessions: dict[str, list[dict[str, str]]] = {}
_registered_devices: dict[str, DeviceRegistration] = {}
_notification_settings: dict[str, NotificationSettings] = {}

app = FastAPI(
    title="Home Security AI Agent API",
    description="""
    REST API for the Home Security AI Agent, designed for iOS and Android mobile apps.
    
    ## Features
    - **Lock Management**: View status and control smart locks
    - **Camera Monitoring**: View camera feeds, snapshots, and motion events
    - **Sensor Monitoring**: Check status of all security sensors
    - **Security System**: Arm/disarm your security system
    - **AI Chat**: Natural language interaction with your security agent
    - **Push Notifications**: Real-time alerts for security events
    
    ## Authentication
    In production, all endpoints require Bearer token authentication.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Check API health status."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    )


# Home Summary
@app.get("/api/summary", tags=["Dashboard"])
async def get_summary() -> dict[str, Any]:
    """
    Get comprehensive home security summary.
    
    Returns security score, status of all devices, issues, and recommendations.
    Ideal for the main dashboard view.
    """
    return get_home_summary()


# Lock Endpoints
@app.get("/api/locks", tags=["Locks"])
async def list_all_locks() -> dict[str, Any]:
    """Get status of all smart locks."""
    return get_all_locks_status()


@app.get("/api/locks/{lock_id}", tags=["Locks"])
async def get_single_lock(lock_id: str) -> dict[str, Any]:
    """Get status of a specific lock."""
    result = get_lock_status(lock_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/locks/{lock_id}/lock", response_model=ActionResponse, tags=["Locks"])
async def lock_single_door(lock_id: str) -> ActionResponse:
    """Lock a specific door."""
    result = lock_door(lock_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return ActionResponse(
        success=result["success"],
        message=result["message"],
        details=result
    )


@app.post("/api/locks/{lock_id}/unlock", response_model=ActionResponse, tags=["Locks"])
async def unlock_single_door(lock_id: str, request: LockActionRequest) -> ActionResponse:
    """
    Unlock a specific door.
    
    Requires confirmation (confirm=true) for security.
    """
    result = unlock_door(lock_id, confirm=request.confirm)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return ActionResponse(
        success=result["success"],
        message=result.get("message", ""),
        details=result,
        warning=result.get("warning")
    )


@app.post("/api/locks/lock-all", response_model=ActionResponse, tags=["Locks"])
async def lock_all_doors() -> ActionResponse:
    """Lock all doors at once."""
    locks_status = get_all_locks_status()
    locked_count = 0
    results = []
    
    for lock_id in locks_status["locks"].keys():
        result = lock_door(lock_id)
        if result["success"]:
            locked_count += 1
        results.append(result)
    
    return ActionResponse(
        success=True,
        message=f"All {locked_count} doors are now locked",
        details={"locked_doors": locked_count, "results": results}
    )


# Camera Endpoints
@app.get("/api/cameras", tags=["Cameras"])
async def list_all_cameras() -> dict[str, Any]:
    """Get status of all security cameras."""
    return get_all_cameras_status()


@app.get("/api/cameras/motion-events", response_model=MotionEventsResponse, tags=["Cameras"])
async def get_camera_motion_events(
    hours: int = Query(default=24, ge=1, le=168, description="Hours to look back")
) -> MotionEventsResponse:
    """Get recent motion detection events from all cameras."""
    result = get_motion_events(hours=hours)
    return MotionEventsResponse(**result)


@app.get("/api/cameras/{camera_id}", tags=["Cameras"])
async def get_single_camera(camera_id: str) -> dict[str, Any]:
    """Get status of a specific camera."""
    result = get_camera_status(camera_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/cameras/{camera_id}/snapshot", response_model=SnapshotResponse, tags=["Cameras"])
async def capture_snapshot(camera_id: str) -> SnapshotResponse:
    """Capture a snapshot from a specific camera."""
    result = get_camera_snapshot(camera_id)
    if "error" in result:
        if not result.get("success", True):
            return SnapshotResponse(
                success=False,
                camera_name=result.get("camera_name", camera_id),
                message="Failed to capture snapshot",
                error=result["error"]
            )
        raise HTTPException(status_code=404, detail=result["error"])
    return SnapshotResponse(**result)


# Sensor Endpoints
@app.get("/api/sensors", tags=["Sensors"])
async def list_all_sensors() -> dict[str, Any]:
    """Get status of all security sensors."""
    return get_all_sensors_status()


# Security System Endpoints
@app.get("/api/security-system", tags=["Security System"])
async def get_system_status() -> dict[str, Any]:
    """Get current security system status."""
    return get_security_system_status()


@app.post("/api/security-system/arm", response_model=ActionResponse, tags=["Security System"])
async def arm_system(request: ArmSystemRequest) -> ActionResponse:
    """
    Arm the security system.
    
    Modes:
    - away: Full protection (all sensors active)
    - home: Perimeter only (interior motion off)
    - night: Perimeter + selected interior sensors
    """
    result = arm_security_system(mode=request.mode.value)
    if "error" in result:
        return ActionResponse(
            success=False,
            message=result.get("error", "Failed to arm system"),
            details=result,
            error=result.get("error")
        )
    return ActionResponse(
        success=result["success"],
        message=result["message"],
        details=result
    )


@app.post("/api/security-system/disarm", response_model=ActionResponse, tags=["Security System"])
async def disarm_system(request: DisarmSystemRequest) -> ActionResponse:
    """Disarm the security system."""
    result = disarm_security_system(pin=request.pin)
    return ActionResponse(
        success=result["success"],
        message=result["message"],
        details=result
    )


# Activity Log Endpoints
@app.get("/api/activity", response_model=RecentActivityResponse, tags=["Activity"])
async def get_activity_log(
    count: int = Query(default=10, ge=1, le=50, description="Number of events to return")
) -> RecentActivityResponse:
    """Get recent activity log."""
    result = get_recent_activity(count=count)
    return RecentActivityResponse(**result)


# AI Chat Endpoints
@app.post("/api/chat", response_model=ChatMessageResponse, tags=["AI Assistant"])
async def chat_with_agent(request: ChatMessageRequest) -> ChatMessageResponse:
    """
    Send a message to the AI security assistant.
    
    Example queries:
    - "What's going on at home?"
    - "Are all doors locked?"
    - "Lock all doors"
    - "Show me the front porch camera"
    - "Any motion detected today?"
    """
    session_id = request.session_id or str(uuid.uuid4())
    
    # Initialize session if needed
    if session_id not in _chat_sessions:
        _chat_sessions[session_id] = []
    
    # Store user message
    _chat_sessions[session_id].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Process the message and generate response
    response_text, suggestions = _process_chat_message(request.message)
    
    # Store assistant response
    _chat_sessions[session_id].append({
        "role": "assistant",
        "content": response_text,
        "timestamp": datetime.now().isoformat()
    })
    
    return ChatMessageResponse(
        response=response_text,
        session_id=session_id,
        timestamp=datetime.now().isoformat(),
        suggestions=suggestions
    )


def _process_chat_message(message: str) -> tuple[str, list[str]]:
    """
    Process a chat message and return response with suggestions.
    
    In production, this would use the actual ADK agent with LLM.
    For now, it provides smart responses based on keywords.
    """
    message_lower = message.lower()
    suggestions = []
    
    # Status/summary queries
    if any(word in message_lower for word in ["status", "summary", "what's going on", "whats going on", "overview", "how is"]):
        summary = get_home_summary()
        response = f"""🏠 **Home Security Status**

**Security Score:** {summary['security_score']}/100 ({summary['security_level']})

**🔐 Locks:** {summary['locks']['summary']}
{' ✓ All doors locked' if summary['locks']['all_secure'] else ' ⚠ Some doors unlocked!'}

**📹 Cameras:** {summary['cameras']['summary']}
{' ✓ All cameras online' if summary['cameras']['all_online'] else ' ⚠ Some cameras offline!'}

**📡 Sensors:** {summary['sensors']['summary']}
{' ✓ All sensors normal' if summary['sensors']['all_normal'] else ' ⚠ Some sensors triggered!'}

**🛡️ System:** {summary['security_system']['status']}

"""
        if summary['issues'] and summary['issues'][0] != "No issues - home is secure":
            response += "**Issues:**\n"
            for issue in summary['issues']:
                response += f"• {issue}\n"
        
        suggestions = ["Lock all doors", "Show cameras", "View activity log", "Arm system"]
        return response, suggestions
    
    # Lock queries
    if "lock" in message_lower:
        if "all" in message_lower and ("lock" in message_lower or "secure" in message_lower):
            # Lock all doors
            locks = get_all_locks_status()
            locked_count = 0
            for lock_id in locks["locks"].keys():
                result = lock_door(lock_id)
                if result["success"]:
                    locked_count += 1
            response = f"✓ All {locked_count} doors are now locked."
            suggestions = ["Check cameras", "Arm system", "View activity"]
        elif any(door in message_lower for door in ["front", "back", "garage", "side"]):
            # Lock specific door
            if "front" in message_lower:
                result = lock_door("front_door")
            elif "back" in message_lower:
                result = lock_door("back_door")
            elif "garage" in message_lower:
                result = lock_door("garage_door")
            elif "side" in message_lower:
                result = lock_door("side_gate")
            else:
                result = {"message": "Door not found"}
            response = result.get("message", "Lock action completed")
            suggestions = ["Check all locks", "Lock all doors", "View activity"]
        else:
            locks = get_all_locks_status()
            response = f"**🔐 Lock Status:** {locks['summary']}\n\n"
            for lock_id, lock in locks['locks'].items():
                status_icon = "🔒" if lock['is_locked'] else "🔓"
                response += f"{status_icon} **{lock['name']}** ({lock['location']}): {lock['status']}\n"
                response += f"   Battery: {lock['battery_level']}%\n"
            suggestions = ["Lock all doors", "Lock front door", "Lock garage door"]
        return response, suggestions
    
    # Camera queries
    if any(word in message_lower for word in ["camera", "cameras", "video", "watch", "see"]):
        cameras = get_all_cameras_status()
        response = f"**📹 Camera Status:** {cameras['summary']}\n\n"
        for cam_id, cam in cameras['cameras'].items():
            status_icon = "🟢" if cam['is_online'] else "🔴"
            motion_icon = "📍" if cam['motion_detected'] else ""
            response += f"{status_icon} **{cam['name']}** ({cam['location']}): {cam['status']} {motion_icon}\n"
            response += f"   Resolution: {cam['resolution']} | Recording: {'Yes' if cam['is_recording'] else 'No'}\n"
        suggestions = ["View motion events", "Capture snapshot", "Check front porch", "Check backyard"]
        return response, suggestions
    
    # Motion queries
    if "motion" in message_lower:
        events = get_motion_events(24)
        response = f"**📍 Motion Events:** {events['summary']}\n\n"
        for event in events['events'][:5]:
            response += f"• **{event['camera_name']}**: {event['event_type']} ({event['confidence']}% confidence)\n"
            response += f"  {event['timestamp']}\n"
        if len(events['events']) > 5:
            response += f"\n_... and {len(events['events']) - 5} more events_"
        suggestions = ["View all cameras", "Capture snapshot", "Check activity log"]
        return response, suggestions
    
    # Sensor queries
    if any(word in message_lower for word in ["sensor", "sensors", "alarm", "smoke", "water"]):
        sensors = get_all_sensors_status()
        response = f"**📡 Sensor Status:** {sensors['summary']}\n\n"
        for sensor_id, sensor in sensors['sensors'].items():
            status_icon = "🟢" if not sensor['is_triggered'] else "🔴"
            battery_icon = "🔋" if sensor['battery_level'] > 30 else "⚠️"
            response += f"{status_icon} **{sensor['name']}** ({sensor['location']})\n"
            response += f"   Type: {sensor['type']} | {battery_icon} Battery: {sensor['battery_level']}%\n"
        suggestions = ["Check locks", "View cameras", "Arm system"]
        return response, suggestions
    
    # Security system queries
    if any(word in message_lower for word in ["arm", "disarm", "security system", "protect"]):
        if "disarm" in message_lower:
            result = disarm_security_system()
            response = f"🛡️ {result['message']}"
            suggestions = ["Check locks", "View activity", "Arm system"]
        elif "arm" in message_lower:
            mode = "away"
            if "home" in message_lower:
                mode = "home"
            elif "night" in message_lower:
                mode = "night"
            result = arm_security_system(mode=mode)
            if result["success"]:
                response = f"🛡️ {result['message']}\n\n{result.get('mode_description', '')}"
            else:
                response = f"⚠️ {result.get('error', 'Could not arm system')}"
                if result.get('unlocked_doors'):
                    response += f"\n\nUnlocked doors: {', '.join(result['unlocked_doors'])}"
                    response += "\n\nPlease lock all doors first."
            suggestions = ["Lock all doors", "Check status", "View activity"]
        else:
            status = get_security_system_status()
            response = f"**🛡️ Security System Status**\n\n"
            response += f"Status: {status['status']}\n"
            response += f"Mode: {status['arm_mode']}\n"
            if status['last_armed']:
                response += f"Last armed: {status['last_armed']}\n"
            suggestions = ["Arm system", "Disarm system", "Lock all doors"]
        return response, suggestions
    
    # Activity queries
    if any(word in message_lower for word in ["activity", "log", "history", "recent", "events"]):
        activity = get_recent_activity(10)
        response = f"**📋 Recent Activity**\n\n"
        for event in activity['activities'][:10]:
            response += f"• {event['timestamp']}: {event['device_name']} - {event['details']}\n"
        if not activity['activities']:
            response += "_No recent activity_"
        suggestions = ["Check locks", "View cameras", "Check status"]
        return response, suggestions
    
    # Default response
    summary = get_home_summary()
    response = f"""I'm your home security assistant. Here's a quick overview:

**Security Score:** {summary['security_score']}/100 ({summary['security_level']})

You can ask me things like:
• "What's going on at home?"
• "Are all doors locked?"
• "Lock all doors"
• "Show me the cameras"
• "Any motion detected?"
• "Arm the security system"
"""
    suggestions = ["Show status", "Lock all doors", "Check cameras", "View activity"]
    return response, suggestions


# Push Notification Endpoints
@app.post("/api/notifications/register", response_model=ActionResponse, tags=["Notifications"])
async def register_device(registration: DeviceRegistration) -> ActionResponse:
    """Register a device for push notifications."""
    device_id = str(uuid.uuid4())
    _registered_devices[device_id] = registration
    return ActionResponse(
        success=True,
        message="Device registered for push notifications",
        details={"device_id": device_id}
    )


@app.get("/api/notifications/settings", tags=["Notifications"])
async def get_notification_settings(
    user_id: str = Query(default="default", description="User ID")
) -> NotificationSettings:
    """Get notification settings for a user."""
    if user_id not in _notification_settings:
        _notification_settings[user_id] = NotificationSettings()
    return _notification_settings[user_id]


@app.put("/api/notifications/settings", response_model=ActionResponse, tags=["Notifications"])
async def update_notification_settings(
    settings: NotificationSettings,
    user_id: str = Query(default="default", description="User ID")
) -> ActionResponse:
    """Update notification settings for a user."""
    _notification_settings[user_id] = settings
    return ActionResponse(
        success=True,
        message="Notification settings updated",
        details=settings.model_dump()
    )


# Quick Actions (for iOS Shortcuts / Widgets)
@app.post("/api/quick-actions/goodnight", response_model=ActionResponse, tags=["Quick Actions"])
async def goodnight_routine() -> ActionResponse:
    """
    Execute goodnight routine:
    - Lock all doors
    - Arm system in night mode
    """
    # Lock all doors first
    locks = get_all_locks_status()
    for lock_id in locks["locks"].keys():
        lock_door(lock_id)
    
    # Arm in night mode
    arm_result = arm_security_system(mode="night")
    
    if arm_result["success"]:
        return ActionResponse(
            success=True,
            message="Goodnight routine complete: All doors locked, system armed in night mode",
            details={
                "doors_locked": len(locks["locks"]),
                "system_mode": "night"
            }
        )
    return ActionResponse(
        success=False,
        message="Goodnight routine partially complete",
        details=arm_result,
        error=arm_result.get("error")
    )


@app.post("/api/quick-actions/leaving", response_model=ActionResponse, tags=["Quick Actions"])
async def leaving_routine() -> ActionResponse:
    """
    Execute leaving home routine:
    - Lock all doors
    - Arm system in away mode
    """
    locks = get_all_locks_status()
    for lock_id in locks["locks"].keys():
        lock_door(lock_id)
    
    arm_result = arm_security_system(mode="away")
    
    if arm_result["success"]:
        return ActionResponse(
            success=True,
            message="Leaving routine complete: All doors locked, system armed in away mode",
            details={
                "doors_locked": len(locks["locks"]),
                "system_mode": "away"
            }
        )
    return ActionResponse(
        success=False,
        message="Leaving routine partially complete",
        details=arm_result,
        error=arm_result.get("error")
    )


@app.post("/api/quick-actions/arriving", response_model=ActionResponse, tags=["Quick Actions"])
async def arriving_routine() -> ActionResponse:
    """
    Execute arriving home routine:
    - Disarm system
    - Unlock front door
    """
    disarm_result = disarm_security_system()
    unlock_result = unlock_door("front_door", confirm=True)
    
    return ActionResponse(
        success=True,
        message="Welcome home! System disarmed, front door unlocked",
        details={
            "system_disarmed": disarm_result["success"],
            "front_door_unlocked": unlock_result["success"]
        },
        warning="Remember to lock the door after entering"
    )
