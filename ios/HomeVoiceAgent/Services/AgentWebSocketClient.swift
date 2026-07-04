import Foundation

enum AgentWebSocketError: LocalizedError {
    case invalidURL
    case notConnected

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Server URL is invalid."
        case .notConnected:
            return "Not connected to the voice server."
        }
    }
}

final class AgentWebSocketClient: @unchecked Sendable {
    private let session = URLSession(configuration: .default)
    private var task: URLSessionWebSocketTask?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    var isConnected: Bool {
        task?.state == .running
    }

    func connect(url: URL) async throws {
        disconnect()
        let socketTask = session.webSocketTask(with: url)
        task = socketTask
        socketTask.resume()
        try await waitForConnection(socketTask)
    }

    func disconnect() {
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    func send(text: String) async throws {
        try await send(message: OutboundMessage(mimeType: "text/plain", data: text))
    }

    func send(pcmData: Data) async throws {
        let encoded = pcmData.base64EncodedString()
        try await send(message: OutboundMessage(mimeType: "audio/pcm", data: encoded))
    }

    func messages() -> AsyncThrowingStream<ServerMessage, Error> {
        AsyncThrowingStream { continuation in
            let receiveTask = Task {
                do {
                    while !Task.isCancelled {
                        guard let socketTask = self.task else {
                            throw AgentWebSocketError.notConnected
                        }
                        let message = try await socketTask.receive()
                        guard let serverMessage = try self.decode(message) else {
                            continue
                        }
                        continuation.yield(serverMessage)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }

            continuation.onTermination = { _ in
                receiveTask.cancel()
            }
        }
    }

    private func send(message: OutboundMessage) async throws {
        guard let socketTask = task else {
            throw AgentWebSocketError.notConnected
        }
        let payload = try encoder.encode(message)
        let text = String(decoding: payload, as: UTF8.self)
        try await socketTask.send(.string(text))
    }

    private func decode(_ message: URLSessionWebSocketTask.Message) throws -> ServerMessage? {
        switch message {
        case .string(let text):
            return try decoder.decode(ServerMessage.self, from: Data(text.utf8))
        case .data(let data):
            return try decoder.decode(ServerMessage.self, from: data)
        @unknown default:
            return nil
        }
    }

    private func waitForConnection(_ socketTask: URLSessionWebSocketTask) async throws {
        try await withCheckedThrowingContinuation { continuation in
            socketTask.sendPing { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }
}
