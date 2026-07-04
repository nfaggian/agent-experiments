import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showServerConfig = false
    
    var body: some View {
        NavigationStack {
            List {
                // Server Configuration
                Section {
                    Button(action: { showServerConfig = true }) {
                        HStack {
                            Image(systemName: "server.rack")
                                .foregroundColor(.blue)
                            VStack(alignment: .leading) {
                                Text("Server Configuration")
                                Text(viewModel.serverURL)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                } header: {
                    Text("Connection")
                }
                
                // Security System
                Section {
                    SecuritySystemRow(viewModel: viewModel)
                } header: {
                    Text("Security System")
                } footer: {
                    Text("Control your home security system arm/disarm state")
                }
                
                // Notifications
                Section {
                    Toggle("Push Notifications", isOn: $viewModel.pushEnabled)
                    Toggle("Motion Alerts", isOn: $viewModel.motionAlerts)
                        .disabled(!viewModel.pushEnabled)
                    Toggle("Door Alerts", isOn: $viewModel.doorAlerts)
                        .disabled(!viewModel.pushEnabled)
                    Toggle("System Alerts", isOn: $viewModel.systemAlerts)
                        .disabled(!viewModel.pushEnabled)
                    Toggle("Low Battery Alerts", isOn: $viewModel.lowBatteryAlerts)
                        .disabled(!viewModel.pushEnabled)
                } header: {
                    Text("Notifications")
                }
                
                // Activity
                Section {
                    NavigationLink {
                        ActivityLogView()
                    } label: {
                        HStack {
                            Image(systemName: "clock.arrow.circlepath")
                                .foregroundColor(.blue)
                            Text("Activity Log")
                        }
                    }
                    
                    NavigationLink {
                        SensorsView()
                    } label: {
                        HStack {
                            Image(systemName: "sensor.fill")
                                .foregroundColor(.green)
                            Text("All Sensors")
                        }
                    }
                } header: {
                    Text("Monitoring")
                }
                
                // About
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("API Status")
                        Spacer()
                        HStack(spacing: 4) {
                            Circle()
                                .fill(viewModel.isConnected ? Color.green : Color.red)
                                .frame(width: 8, height: 8)
                            Text(viewModel.isConnected ? "Connected" : "Disconnected")
                                .foregroundColor(.secondary)
                        }
                    }
                } header: {
                    Text("About")
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showServerConfig) {
                ServerConfigView(viewModel: viewModel)
            }
        }
        .task {
            await viewModel.checkConnection()
        }
    }
}

// MARK: - Security System Row

struct SecuritySystemRow: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: viewModel.isArmed ? "shield.checkered" : "shield.slash")
                    .font(.title2)
                    .foregroundColor(viewModel.isArmed ? .green : .orange)
                
                VStack(alignment: .leading) {
                    Text(viewModel.isArmed ? "Armed" : "Disarmed")
                        .font(.headline)
                    if viewModel.isArmed {
                        Text("Mode: \(viewModel.armMode.capitalized)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if viewModel.isUpdatingSystem {
                    ProgressView()
                }
            }
            
            if viewModel.isArmed {
                Button(action: {
                    Task { await viewModel.disarmSystem() }
                }) {
                    Text("Disarm System")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .disabled(viewModel.isUpdatingSystem)
            } else {
                HStack(spacing: 12) {
                    ArmButton(title: "Away", mode: "away", viewModel: viewModel)
                    ArmButton(title: "Home", mode: "home", viewModel: viewModel)
                    ArmButton(title: "Night", mode: "night", viewModel: viewModel)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct ArmButton: View {
    let title: String
    let mode: String
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        Button(action: {
            Task { await viewModel.armSystem(mode: mode) }
        }) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(8)
        }
        .disabled(viewModel.isUpdatingSystem)
    }
}

// MARK: - Server Config View

struct ServerConfigView: View {
    @ObservedObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var serverURL: String = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Server URL", text: $serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                } header: {
                    Text("Server URL")
                } footer: {
                    Text("Enter the URL of your Home Security API server (e.g., http://192.168.1.100:8000)")
                }
                
                Section {
                    Button("Test Connection") {
                        Task { await viewModel.testConnection(serverURL) }
                    }
                    
                    if let status = viewModel.connectionTestStatus {
                        HStack {
                            Image(systemName: status.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(status.success ? .green : .red)
                            Text(status.message)
                                .font(.caption)
                        }
                    }
                }
            }
            .navigationTitle("Server Configuration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        viewModel.saveServerURL(serverURL)
                        dismiss()
                    }
                }
            }
            .onAppear {
                serverURL = viewModel.serverURL
            }
        }
    }
}

// MARK: - Activity Log View

struct ActivityLogView: View {
    @StateObject private var viewModel = ActivityLogViewModel()
    
    var body: some View {
        List {
            if viewModel.isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity)
            } else {
                ForEach(viewModel.activities) { activity in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Image(systemName: iconForEventType(activity.eventType))
                                .foregroundColor(colorForEventType(activity.eventType))
                            Text(activity.deviceName)
                                .font(.headline)
                        }
                        Text(activity.details)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Text(formatTimestamp(activity.timestamp))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Activity Log")
        .refreshable {
            await viewModel.loadActivity()
        }
        .task {
            await viewModel.loadActivity()
        }
    }
    
    func iconForEventType(_ type: String) -> String {
        switch type.lowercased() {
        case "lock": return "lock.fill"
        case "unlock": return "lock.open.fill"
        case "arm": return "shield.checkered"
        case "disarm": return "shield.slash"
        case "snapshot": return "camera.fill"
        default: return "bell.fill"
        }
    }
    
    func colorForEventType(_ type: String) -> Color {
        switch type.lowercased() {
        case "lock": return .green
        case "unlock": return .orange
        case "arm": return .blue
        case "disarm": return .orange
        default: return .gray
        }
    }
    
    func formatTimestamp(_ timestamp: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: timestamp) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        return timestamp
    }
}

// MARK: - Sensors View

struct SensorsView: View {
    @StateObject private var viewModel = SensorsViewModel()
    
    var body: some View {
        List {
            if viewModel.isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity)
            } else if let sensors = viewModel.sensorsResponse {
                Section {
                    HStack {
                        Text("Total Sensors")
                        Spacer()
                        Text("\(sensors.totalSensors)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Triggered")
                        Spacer()
                        Text("\(sensors.triggeredCount)")
                            .foregroundColor(sensors.triggeredCount > 0 ? .orange : .secondary)
                    }
                    HStack {
                        Text("Low Battery")
                        Spacer()
                        Text("\(sensors.lowBatteryCount)")
                            .foregroundColor(sensors.lowBatteryCount > 0 ? .red : .secondary)
                    }
                } header: {
                    Text("Summary")
                }
                
                Section {
                    ForEach(Array(sensors.sensors.keys.sorted()), id: \.self) { key in
                        if let sensor = sensors.sensors[key] {
                            SensorRow(sensor: sensor)
                        }
                    }
                } header: {
                    Text("All Sensors")
                }
            }
        }
        .navigationTitle("Sensors")
        .refreshable {
            await viewModel.loadSensors()
        }
        .task {
            await viewModel.loadSensors()
        }
    }
}

struct SensorRow: View {
    let sensor: SensorStatus
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconForSensorType(sensor.type))
                .foregroundColor(sensor.isTriggered ? .orange : .green)
                .font(.title2)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(sensor.name)
                    .font(.headline)
                Text(sensor.location)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: "battery.50")
                        .foregroundColor(sensor.batteryLevel > 30 ? .green : .red)
                    Text("\(sensor.batteryLevel)%")
                        .font(.caption)
                }
                Text(sensor.isTriggered ? "Triggered" : "Normal")
                    .font(.caption)
                    .foregroundColor(sensor.isTriggered ? .orange : .green)
            }
        }
        .padding(.vertical, 4)
    }
    
    func iconForSensorType(_ type: String) -> String {
        switch type.lowercased() {
        case "motion": return "figure.walk.motion"
        case "door_window": return "door.left.hand.open"
        case "smoke": return "smoke.fill"
        case "water_leak": return "drop.fill"
        default: return "sensor.fill"
        }
    }
}

// MARK: - View Models

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var serverURL: String = APIService.shared.currentBaseURL
    @Published var isConnected = false
    @Published var isArmed = false
    @Published var armMode = "disarmed"
    @Published var isUpdatingSystem = false
    @Published var connectionTestStatus: (success: Bool, message: String)?
    
    // Notification settings
    @Published var pushEnabled = true
    @Published var motionAlerts = true
    @Published var doorAlerts = true
    @Published var systemAlerts = true
    @Published var lowBatteryAlerts = true
    
    private let api = APIService.shared
    
    func checkConnection() async {
        do {
            let status = try await api.getSecurityStatus()
            isConnected = true
            isArmed = status.isArmed
            armMode = status.armMode
        } catch {
            isConnected = false
        }
    }
    
    func testConnection(_ url: String) async {
        // Temporarily test the new URL
        connectionTestStatus = nil
        
        guard let testURL = URL(string: "\(url)/health") else {
            connectionTestStatus = (false, "Invalid URL format")
            return
        }
        
        do {
            let (_, response) = try await URLSession.shared.data(from: testURL)
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                connectionTestStatus = (true, "Connection successful!")
            } else {
                connectionTestStatus = (false, "Server returned an error")
            }
        } catch {
            connectionTestStatus = (false, "Could not connect: \(error.localizedDescription)")
        }
    }
    
    func saveServerURL(_ url: String) {
        serverURL = url
        api.updateBaseURL(url)
        Task {
            await checkConnection()
        }
    }
    
    func armSystem(mode: String) async {
        isUpdatingSystem = true
        do {
            let result = try await api.armSystem(mode: mode)
            if result.success {
                isArmed = true
                armMode = mode
            }
        } catch {
            // Handle error
        }
        isUpdatingSystem = false
    }
    
    func disarmSystem() async {
        isUpdatingSystem = true
        do {
            let result = try await api.disarmSystem()
            if result.success {
                isArmed = false
                armMode = "disarmed"
            }
        } catch {
            // Handle error
        }
        isUpdatingSystem = false
    }
}

@MainActor
class ActivityLogViewModel: ObservableObject {
    @Published var activities: [ActivityEvent] = []
    @Published var isLoading = false
    
    private let api = APIService.shared
    
    func loadActivity() async {
        isLoading = true
        do {
            let response = try await api.getActivity(count: 50)
            activities = response.activities
        } catch {
            // Handle error
        }
        isLoading = false
    }
}

@MainActor
class SensorsViewModel: ObservableObject {
    @Published var sensorsResponse: SensorsResponse?
    @Published var isLoading = false
    
    private let api = APIService.shared
    
    func loadSensors() async {
        isLoading = true
        do {
            sensorsResponse = try await api.getSensors()
        } catch {
            // Handle error
        }
        isLoading = false
    }
}

#Preview {
    SettingsView()
}
