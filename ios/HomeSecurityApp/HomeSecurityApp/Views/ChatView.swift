import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                            
                            if viewModel.isLoading {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        withAnimation {
                            proxy.scrollTo(viewModel.messages.last?.id, anchor: .bottom)
                        }
                    }
                    .onChange(of: viewModel.isLoading) { _, isLoading in
                        if isLoading {
                            withAnimation {
                                proxy.scrollTo("typing", anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Suggestions
                if let suggestions = viewModel.suggestions, !suggestions.isEmpty, !viewModel.isLoading {
                    SuggestionsView(suggestions: suggestions) { suggestion in
                        viewModel.sendMessage(suggestion)
                    }
                }
                
                Divider()
                
                // Input
                ChatInputView(
                    text: $viewModel.inputText,
                    isLoading: viewModel.isLoading,
                    isFocused: $isInputFocused
                ) {
                    viewModel.sendMessage(viewModel.inputText)
                }
            }
            .navigationTitle("AI Assistant")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.clearChat() }) {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }
}

// MARK: - Chat Message Model

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
}

// MARK: - Chat Bubble

struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(message.isUser ? Color.blue : Color(.systemGray5))
                    .foregroundColor(message.isUser ? .white : .primary)
                    .cornerRadius(20)
                
                Text(formatTime(message.timestamp))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: 280, alignment: message.isUser ? .trailing : .leading)
            
            if !message.isUser { Spacer() }
        }
    }
    
    func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: View {
    @State private var animationAmount = 0.0
    
    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Color.gray)
                        .frame(width: 8, height: 8)
                        .scaleEffect(animationAmount == Double(index) ? 1.2 : 0.8)
                        .animation(
                            .easeInOut(duration: 0.4)
                            .repeatForever()
                            .delay(Double(index) * 0.15),
                            value: animationAmount
                        )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemGray5))
            .cornerRadius(20)
            
            Spacer()
        }
        .onAppear {
            animationAmount = 2
        }
    }
}

// MARK: - Suggestions View

struct SuggestionsView: View {
    let suggestions: [String]
    let onSelect: (String) -> Void
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(suggestions, id: \.self) { suggestion in
                    Button(action: { onSelect(suggestion) }) {
                        Text(suggestion)
                            .font(.subheadline)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(.blue)
                            .cornerRadius(16)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - Chat Input

struct ChatInputView: View {
    @Binding var text: String
    let isLoading: Bool
    var isFocused: FocusState<Bool>.Binding
    let onSend: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            TextField("Ask about your home security...", text: $text)
                .textFieldStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(.systemGray6))
                .cornerRadius(24)
                .focused(isFocused)
                .onSubmit {
                    if !text.isEmpty && !isLoading {
                        onSend()
                    }
                }
            
            Button(action: onSend) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title)
                    .foregroundColor(text.isEmpty || isLoading ? .gray : .blue)
            }
            .disabled(text.isEmpty || isLoading)
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - View Model

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false
    @Published var suggestions: [String]? = ["What's going on?", "Lock all doors", "Show cameras", "Arm system"]
    
    private let api = APIService.shared
    private var sessionId: String?
    
    init() {
        // Add welcome message
        messages.append(ChatMessage(
            content: "👋 Hi! I'm your home security assistant. Ask me anything about your locks, cameras, sensors, or security system.",
            isUser: false,
            timestamp: Date()
        ))
    }
    
    func sendMessage(_ text: String) {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }
        
        // Add user message
        messages.append(ChatMessage(
            content: trimmedText,
            isUser: true,
            timestamp: Date()
        ))
        
        inputText = ""
        isLoading = true
        suggestions = nil
        
        Task {
            do {
                let response = try await api.sendMessage(trimmedText, sessionId: sessionId)
                sessionId = response.sessionId
                
                // Add assistant response
                messages.append(ChatMessage(
                    content: response.response,
                    isUser: false,
                    timestamp: Date()
                ))
                
                // Update suggestions
                suggestions = response.suggestions
            } catch {
                messages.append(ChatMessage(
                    content: "Sorry, I couldn't process your request. Please check your connection and try again.",
                    isUser: false,
                    timestamp: Date()
                ))
                suggestions = ["Try again", "Show status", "Help"]
            }
            
            isLoading = false
        }
    }
    
    func clearChat() {
        messages = [ChatMessage(
            content: "👋 Hi! I'm your home security assistant. Ask me anything about your locks, cameras, sensors, or security system.",
            isUser: false,
            timestamp: Date()
        )]
        sessionId = nil
        suggestions = ["What's going on?", "Lock all doors", "Show cameras", "Arm system"]
    }
}

#Preview {
    ChatView()
}
