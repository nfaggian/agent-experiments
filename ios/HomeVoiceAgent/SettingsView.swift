import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var viewModel: ChatViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var host = ServerSettings.host
    @State private var useTLS = ServerSettings.useTLS

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    TextField("Host", text: $host, prompt: Text("192.168.1.100:8000"))
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Toggle("Use TLS (wss://)", isOn: $useTLS)
                }

                Section("Connection") {
                    LabeledContent("User ID", value: ServerSettings.userID)

                    Button("Reconnect") {
                        saveSettings()
                        viewModel.disconnect()
                        viewModel.connect()
                    }

                    Button("Disconnect", role: .destructive) {
                        viewModel.disconnect()
                    }
                }

                Section("Help") {
                    Text("Run `make voice` on your home server, then enter your computer's LAN IP and port here.")
                    Text("For remote access, use Tailscale or HTTPS with wss:// enabled.")
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        saveSettings()
                        dismiss()
                    }
                }
            }
        }
    }

    private func saveSettings() {
        ServerSettings.host = host.trimmingCharacters(in: .whitespacesAndNewlines)
        ServerSettings.useTLS = useTLS
    }
}

#Preview {
    SettingsView()
        .environmentObject(ChatViewModel())
}
