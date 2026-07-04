import Foundation

// MARK: - Home Summary
struct HomeSummary: Codable {
    let timestamp: String
    let securityScore: Int
    let securityLevel: String
    let locks: LocksSummary
    let cameras: CamerasSummary
    let sensors: SensorsSummary
    let securitySystem: SecuritySystemStatus
    let issues: [String]
    let recommendations: [String]
    
    enum CodingKeys: String, CodingKey {
        case timestamp
        case securityScore = "security_score"
        case securityLevel = "security_level"
        case locks, cameras, sensors
        case securitySystem = "security_system"
        case issues, recommendations
    }
}

struct LocksSummary: Codable {
    let summary: String
    let allSecure: Bool
    let unlockedCount: Int
    
    enum CodingKeys: String, CodingKey {
        case summary
        case allSecure = "all_secure"
        case unlockedCount = "unlocked_count"
    }
}

struct CamerasSummary: Codable {
    let summary: String
    let allOnline: Bool
    let offlineCount: Int
    let motionDetected: Int
    
    enum CodingKeys: String, CodingKey {
        case summary
        case allOnline = "all_online"
        case offlineCount = "offline_count"
        case motionDetected = "motion_detected"
    }
}

struct SensorsSummary: Codable {
    let summary: String
    let allNormal: Bool
    let triggeredCount: Int
    let lowBatteryCount: Int
    
    enum CodingKeys: String, CodingKey {
        case summary
        case allNormal = "all_normal"
        case triggeredCount = "triggered_count"
        case lowBatteryCount = "low_battery_count"
    }
}

// MARK: - Security System
struct SecuritySystemStatus: Codable {
    let isArmed: Bool
    let armMode: String
    let status: String
    let alarmTriggered: Bool
    let lastArmed: String?
    let lastDisarmed: String?
    
    enum CodingKeys: String, CodingKey {
        case isArmed = "is_armed"
        case armMode = "arm_mode"
        case status
        case alarmTriggered = "alarm_triggered"
        case lastArmed = "last_armed"
        case lastDisarmed = "last_disarmed"
    }
}

// MARK: - Locks
struct LocksResponse: Codable {
    let locks: [String: LockStatus]
    let totalLocks: Int
    let unlockedCount: Int
    let allSecure: Bool
    let summary: String
    
    enum CodingKeys: String, CodingKey {
        case locks
        case totalLocks = "total_locks"
        case unlockedCount = "unlocked_count"
        case allSecure = "all_secure"
        case summary
    }
}

struct LockStatus: Codable, Identifiable {
    var id: String { name }
    let name: String
    let location: String
    let isLocked: Bool
    let status: String
    let batteryLevel: Int
    let lastActivity: String?
    
    enum CodingKeys: String, CodingKey {
        case name, location, status
        case isLocked = "is_locked"
        case batteryLevel = "battery_level"
        case lastActivity = "last_activity"
    }
}

// MARK: - Cameras
struct CamerasResponse: Codable {
    let cameras: [String: CameraStatus]
    let totalCameras: Int
    let onlineCount: Int
    let offlineCount: Int
    let camerasWithMotion: Int
    let allOnline: Bool
    let summary: String
    
    enum CodingKeys: String, CodingKey {
        case cameras
        case totalCameras = "total_cameras"
        case onlineCount = "online_count"
        case offlineCount = "offline_count"
        case camerasWithMotion = "cameras_with_motion"
        case allOnline = "all_online"
        case summary
    }
}

struct CameraStatus: Codable, Identifiable {
    var id: String { name }
    let name: String
    let location: String
    let isOnline: Bool
    let isRecording: Bool
    let motionDetected: Bool
    let resolution: String
    let nightVision: Bool
    let lastMotion: String?
    let status: String
    
    enum CodingKeys: String, CodingKey {
        case name, location, status, resolution
        case isOnline = "is_online"
        case isRecording = "is_recording"
        case motionDetected = "motion_detected"
        case nightVision = "night_vision"
        case lastMotion = "last_motion"
    }
}

// MARK: - Motion Events
struct MotionEventsResponse: Codable {
    let events: [MotionEvent]
    let totalEvents: Int
    let timeRangeHours: Int
    let summary: String
    
    enum CodingKeys: String, CodingKey {
        case events
        case totalEvents = "total_events"
        case timeRangeHours = "time_range_hours"
        case summary
    }
}

struct MotionEvent: Codable, Identifiable {
    var id: String { "\(cameraId)-\(timestamp)" }
    let cameraId: String
    let cameraName: String
    let location: String
    let timestamp: String
    let eventType: String
    let confidence: Int
    
    enum CodingKeys: String, CodingKey {
        case cameraId = "camera_id"
        case cameraName = "camera_name"
        case location, timestamp
        case eventType = "event_type"
        case confidence
    }
}

// MARK: - Sensors
struct SensorsResponse: Codable {
    let sensors: [String: SensorStatus]
    let totalSensors: Int
    let triggeredCount: Int
    let lowBatteryCount: Int
    let allNormal: Bool
    let summary: String
    
    enum CodingKeys: String, CodingKey {
        case sensors
        case totalSensors = "total_sensors"
        case triggeredCount = "triggered_count"
        case lowBatteryCount = "low_battery_count"
        case allNormal = "all_normal"
        case summary
    }
}

struct SensorStatus: Codable, Identifiable {
    var id: String { name }
    let name: String
    let type: String
    let location: String
    let isTriggered: Bool
    let batteryLevel: Int
    let batteryStatus: String
    let lastTriggered: String?
    
    enum CodingKeys: String, CodingKey {
        case name, type, location
        case isTriggered = "is_triggered"
        case batteryLevel = "battery_level"
        case batteryStatus = "battery_status"
        case lastTriggered = "last_triggered"
    }
}

// MARK: - Activity
struct ActivityResponse: Codable {
    let activities: [ActivityEvent]
    let count: Int
    let message: String
}

struct ActivityEvent: Codable, Identifiable {
    let id: String
    let timestamp: String
    let eventType: String
    let deviceName: String
    let details: String
    
    enum CodingKeys: String, CodingKey {
        case id, timestamp, details
        case eventType = "event_type"
        case deviceName = "device_name"
    }
}

// MARK: - Chat
struct ChatRequest: Codable {
    let message: String
    let sessionId: String?
    
    enum CodingKeys: String, CodingKey {
        case message
        case sessionId = "session_id"
    }
}

struct ChatResponse: Codable {
    let response: String
    let sessionId: String
    let timestamp: String
    let suggestions: [String]?
    
    enum CodingKeys: String, CodingKey {
        case response
        case sessionId = "session_id"
        case timestamp, suggestions
    }
}

// MARK: - Action Response
struct ActionResponse: Codable {
    let success: Bool
    let message: String
    let details: [String: AnyCodable]?
    let error: String?
    let warning: String?
}

// Helper for dynamic JSON values
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else {
            value = ""
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let string = value as? String {
            try container.encode(string)
        } else if let int = value as? Int {
            try container.encode(int)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        } else if let double = value as? Double {
            try container.encode(double)
        }
    }
}

// MARK: - Arm Request
struct ArmRequest: Codable {
    let mode: String
}

struct UnlockRequest: Codable {
    let confirm: Bool
}
