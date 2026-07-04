import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var viewModel: ChatViewModel
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                statusBar
                messageList
                composer
                voiceControls
            }
            .padding()
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .navigationTitle("Home Voice Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .environmentObject(viewModel)
            }
            .onAppear {
                if viewModel.connectionState == .disconnected {
                    viewModel.connect()
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var statusBar: some View {
        HStack {
            Circle()
                .fill(statusColor)
                .frame(width: 10, height: 10)
            Text(viewModel.connectionState.rawValue)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }

    private var statusColor: Color {
        switch viewModel.connectionState {
        case .connected, .voiceActive:
            return .green
        case .connecting:
            return .yellow
        case .disconnected:
            return .red
        }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(viewModel.messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .onChange(of: viewModel.messages.count) { _, _ in
                if let lastID = viewModel.messages.last?.id {
                    withAnimation {
                        proxy.scrollTo(lastID, anchor: .bottom)
                    }
                }
            }
        }
        .padding()
        .background(Color(red: 0.07, green: 0.1, blue: 0.22))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var composer: some View {
        HStack(spacing: 8) {
            TextField("Type a message...", text: $viewModel.draftText)
                .textFieldStyle(.roundedBorder)
                .submitLabel(.send)
                .onSubmit {
                    viewModel.sendText()
                }

            Button("Send") {
                viewModel.sendText()
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.connectionState == .disconnected)
        }
    }

    private var voiceControls: some View {
        VStack(spacing: 8) {
            if viewModel.isVoiceEnabled {
                Button("Stop Voice") {
                    viewModel.stopVoice()
                    viewModel.connect()
                }
                .buttonStyle(.bordered)
                .tint(.orange)
            } else {
                Button {
                    Task {
                        await viewModel.startVoice()
                    }
                } label: {
                    Label("Start Voice", systemImage: "mic.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.cyan)
            }

            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            } else {
                Text("Talk naturally to control lights, climate, and routines.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

private struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == .user {
                Spacer(minLength: 24)
            }

            Text(prefix + message.text)
                .padding(12)
                .background(backgroundColor)
                .foregroundStyle(foregroundColor)
                .clipShape(RoundedRectangle(cornerRadius: 14))

            if message.role == .agent || message.role == .system {
                Spacer(minLength: 24)
            }
        }
    }

    private var prefix: String {
        switch message.role {
        case .user:
            return ""
        case .agent:
            return ""
        case .system:
            return "ℹ︎ "
        }
    }

    private var backgroundColor: Color {
        switch message.role {
        case .user:
            return Color.cyan.opacity(0.25)
        case .agent:
            return Color.white.opacity(0.08)
        case .system:
            return Color.yellow.opacity(0.12)
        }
    }

    private var foregroundColor: Color {
        switch message.role {
        case .user:
            return .white
        case .agent:
            return .white
        case .system:
            return .yellow
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(ChatViewModel())
}
