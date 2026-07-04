import Foundation

enum ChatRole {
    case user
    case agent
    case system
}

struct ChatMessage: Identifiable, Equatable {
    let id: String
    let role: ChatRole
    var text: String
    var isStreaming: Bool

    init(id: String = UUID().uuidString, role: ChatRole, text: String, isStreaming: Bool = false) {
        self.id = id
        self.role = role
        self.text = text
        self.isStreaming = isStreaming
    }
}

struct ServerMessage: Decodable {
    let turnComplete: Bool?
    let interrupted: Bool?
    let mimeType: String?
    let data: String?

    enum CodingKeys: String, CodingKey {
        case turnComplete = "turn_complete"
        case interrupted
        case mimeType = "mime_type"
        case data
    }
}

struct OutboundMessage: Encodable {
    let mimeType: String
    let data: String

    enum CodingKeys: String, CodingKey {
        case mimeType = "mime_type"
        case data
    }
}
