import AVFoundation
import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    enum ConnectionState: String {
        case disconnected = "Disconnected"
        case connecting = "Connecting"
        case connected = "Connected"
        case voiceActive = "Voice Active"
    }

    @Published var messages: [ChatMessage] = []
    @Published var connectionState: ConnectionState = .disconnected
    @Published var draftText = ""
    @Published var isVoiceEnabled = false
    @Published var errorMessage: String?

    private let webSocketClient = AgentWebSocketClient()
    private let audioCapture = AudioCaptureManager()
    private let audioPlayback = AudioPlaybackManager()

    private var receiveTask: Task<Void, Never>?
    private var streamingMessageID: String?

    func connect() {
        guard let url = ServerSettings.websocketURL(audioMode: isVoiceEnabled) else {
            errorMessage = AgentWebSocketError.invalidURL.localizedDescription
            return
        }

        receiveTask?.cancel()
        connectionState = .connecting
        errorMessage = nil

        receiveTask = Task {
            do {
                try await webSocketClient.connect(url: url)
                connectionState = isVoiceEnabled ? .voiceActive : .connected
                appendSystemMessage("Connected to your home agent.")

                for try await message in webSocketClient.messages() {
                    handle(serverMessage: message)
                }

                connectionState = .disconnected
            } catch is CancellationError {
                return
            } catch {
                connectionState = .disconnected
                errorMessage = error.localizedDescription
                appendSystemMessage("Connection lost. Tap reconnect in Settings.")
            }
        }
    }

    func disconnect() {
        receiveTask?.cancel()
        receiveTask = nil
        stopVoice()
        webSocketClient.disconnect()
        connectionState = .disconnected
    }

    func sendText() {
        let text = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        messages.append(ChatMessage(role: .user, text: text))
        draftText = ""

        Task {
            do {
                try await webSocketClient.send(text: text)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func startVoice() async {
        let granted = await requestMicrophonePermission()
        guard granted else {
            errorMessage = "Microphone access is required for voice mode."
            return
        }

        isVoiceEnabled = true

        do {
            try audioPlayback.start()
            try audioCapture.start { [weak self] pcmData in
                Task { @MainActor in
                    await self?.sendAudioChunk(pcmData)
                }
            }
            connect()
            appendSystemMessage("Voice mode enabled. Start speaking.")
        } catch {
            errorMessage = error.localizedDescription
            stopVoice()
        }
    }

    func stopVoice() {
        isVoiceEnabled = false
        audioCapture.stop()
        audioPlayback.stop()
        if connectionState == .voiceActive {
            connectionState = .disconnected
        }
    }

    private func sendAudioChunk(_ pcmData: Data) async {
        guard isVoiceEnabled, webSocketClient.isConnected else { return }
        do {
            try await webSocketClient.send(pcmData: pcmData)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func handle(serverMessage: ServerMessage) {
        if serverMessage.turnComplete == true {
            finalizeStreamingMessage()
            return
        }

        if serverMessage.interrupted == true {
            audioPlayback.interrupt()
            finalizeStreamingMessage()
            return
        }

        guard let mimeType = serverMessage.mimeType, let data = serverMessage.data else {
            return
        }

        if mimeType == "audio/pcm", let pcmData = Data(base64Encoded: data) {
            audioPlayback.enqueue(pcmData: pcmData)
            return
        }

        if mimeType == "text/plain" {
            appendStreamingAgentText(data)
        }
    }

    private func appendStreamingAgentText(_ chunk: String) {
        if let streamingMessageID,
           let index = messages.firstIndex(where: { $0.id == streamingMessageID }) {
            messages[index].text += chunk
            return
        }

        let message = ChatMessage(role: .agent, text: chunk, isStreaming: true)
        streamingMessageID = message.id
        messages.append(message)
    }

    private func finalizeStreamingMessage() {
        guard let streamingMessageID,
              let index = messages.firstIndex(where: { $0.id == streamingMessageID }) else {
            streamingMessageID = nil
            return
        }
        messages[index].isStreaming = false
        self.streamingMessageID = nil
    }

    private func appendSystemMessage(_ text: String) {
        messages.append(ChatMessage(role: .system, text: text))
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
}
