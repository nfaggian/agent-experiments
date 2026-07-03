import Foundation

class APIService: ObservableObject {
    static let shared = APIService()
    
    // Configure this to your server's address
    // For simulator: use your Mac's IP or localhost
    // For device: use your server's network IP
    private let baseURL: String
    
    init() {
        // Default to localhost for simulator, change for real device
        self.baseURL = UserDefaults.standard.string(forKey: "serverURL") ?? "http://localhost:8000"
    }
    
    func updateBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "serverURL")
    }
    
    var currentBaseURL: String {
        return baseURL
    }
    
    // MARK: - Generic Request Methods
    
    private func get<T: Decodable>(_ endpoint: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    private func post<T: Decodable, B: Encodable>(_ endpoint: String, body: B?) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    private func postNoBody<T: Decodable>(_ endpoint: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    // MARK: - Dashboard
    
    func getSummary() async throws -> HomeSummary {
        return try await get("/api/summary")
    }
    
    // MARK: - Locks
    
    func getLocks() async throws -> LocksResponse {
        return try await get("/api/locks")
    }
    
    func lockDoor(_ lockId: String) async throws -> ActionResponse {
        return try await postNoBody("/api/locks/\(lockId)/lock")
    }
    
    func unlockDoor(_ lockId: String, confirm: Bool = true) async throws -> ActionResponse {
        let request = UnlockRequest(confirm: confirm)
        return try await post("/api/locks/\(lockId)/unlock", body: request)
    }
    
    func lockAllDoors() async throws -> ActionResponse {
        return try await postNoBody("/api/locks/lock-all")
    }
    
    // MARK: - Cameras
    
    func getCameras() async throws -> CamerasResponse {
        return try await get("/api/cameras")
    }
    
    func getMotionEvents(hours: Int = 24) async throws -> MotionEventsResponse {
        return try await get("/api/cameras/motion-events?hours=\(hours)")
    }
    
    // MARK: - Sensors
    
    func getSensors() async throws -> SensorsResponse {
        return try await get("/api/sensors")
    }
    
    // MARK: - Security System
    
    func getSecurityStatus() async throws -> SecuritySystemStatus {
        return try await get("/api/security-system")
    }
    
    func armSystem(mode: String = "away") async throws -> ActionResponse {
        let request = ArmRequest(mode: mode)
        return try await post("/api/security-system/arm", body: request)
    }
    
    func disarmSystem() async throws -> ActionResponse {
        struct EmptyBody: Codable {}
        return try await post("/api/security-system/disarm", body: EmptyBody())
    }
    
    // MARK: - Activity
    
    func getActivity(count: Int = 20) async throws -> ActivityResponse {
        return try await get("/api/activity?count=\(count)")
    }
    
    // MARK: - Chat
    
    func sendMessage(_ message: String, sessionId: String? = nil) async throws -> ChatResponse {
        let request = ChatRequest(message: message, sessionId: sessionId)
        return try await post("/api/chat", body: request)
    }
    
    // MARK: - Quick Actions
    
    func goodnightRoutine() async throws -> ActionResponse {
        return try await postNoBody("/api/quick-actions/goodnight")
    }
    
    func leavingRoutine() async throws -> ActionResponse {
        return try await postNoBody("/api/quick-actions/leaving")
    }
    
    func arrivingRoutine() async throws -> ActionResponse {
        return try await postNoBody("/api/quick-actions/arriving")
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP Error: \(statusCode)"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}
