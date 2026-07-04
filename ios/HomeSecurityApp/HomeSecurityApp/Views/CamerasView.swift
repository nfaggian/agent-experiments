import SwiftUI

struct CamerasView: View {
    @StateObject private var viewModel = CamerasViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("View", selection: $selectedTab) {
                    Text("Cameras").tag(0)
                    Text("Motion Events").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()
                
                if selectedTab == 0 {
                    CamerasListView(viewModel: viewModel)
                } else {
                    MotionEventsListView(viewModel: viewModel)
                }
            }
            .navigationTitle("Cameras")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.refresh() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .task {
            await viewModel.loadCameras()
            await viewModel.loadMotionEvents()
        }
    }
}

// MARK: - Cameras List

struct CamerasListView: View {
    @ObservedObject var viewModel: CamerasViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if viewModel.isLoading {
                    ProgressView("Loading cameras...")
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let camerasResponse = viewModel.camerasResponse {
                    // Summary Header
                    CamerasSummaryHeader(
                        allOnline: camerasResponse.allOnline,
                        summary: camerasResponse.summary,
                        motionCount: camerasResponse.camerasWithMotion
                    )
                    
                    // Camera Cards
                    ForEach(Array(camerasResponse.cameras.keys.sorted()), id: \.self) { key in
                        if let camera = camerasResponse.cameras[key] {
                            CameraCard(camera: camera)
                        }
                    }
                } else if let error = viewModel.errorMessage {
                    ErrorCard(message: error) {
                        viewModel.refresh()
                    }
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.loadCameras()
        }
    }
}

// MARK: - Summary Header

struct CamerasSummaryHeader: View {
    let allOnline: Bool
    let summary: String
    let motionCount: Int
    
    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 16) {
                Image(systemName: allOnline ? "video.fill" : "video.slash.fill")
                    .font(.largeTitle)
                    .foregroundColor(allOnline ? .green : .red)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(allOnline ? "All Online" : "Some Offline")
                        .font(.headline)
                        .foregroundColor(allOnline ? .green : .red)
                    Text(summary)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            if motionCount > 0 {
                HStack {
                    Image(systemName: "figure.walk.motion")
                        .foregroundColor(.blue)
                    Text("\(motionCount) camera(s) detecting motion")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Spacer()
                }
            }
        }
        .padding()
        .background(allOnline ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Camera Card

struct CameraCard: View {
    let camera: CameraStatus
    
    var body: some View {
        VStack(spacing: 0) {
            // Camera Preview Placeholder
            ZStack {
                Rectangle()
                    .fill(Color.black)
                    .aspectRatio(16/9, contentMode: .fit)
                
                if camera.isOnline {
                    VStack(spacing: 8) {
                        Image(systemName: "video.fill")
                            .font(.largeTitle)
                            .foregroundColor(.white.opacity(0.5))
                        Text("Live Feed")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    }
                } else {
                    VStack(spacing: 8) {
                        Image(systemName: "video.slash.fill")
                            .font(.largeTitle)
                            .foregroundColor(.red)
                        Text("Offline")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                // Status Badges
                VStack {
                    HStack {
                        // Recording indicator
                        if camera.isRecording && camera.isOnline {
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 8, height: 8)
                                Text("REC")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.black.opacity(0.6))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                        }
                        
                        Spacer()
                        
                        // Resolution
                        Text(camera.resolution)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.black.opacity(0.6))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .padding(8)
                    
                    Spacer()
                    
                    // Motion indicator
                    if camera.motionDetected {
                        HStack {
                            Spacer()
                            HStack(spacing: 4) {
                                Image(systemName: "figure.walk.motion")
                                Text("Motion")
                            }
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(4)
                            .padding(8)
                        }
                    }
                }
            }
            .cornerRadius(12, corners: [.topLeft, .topRight])
            
            // Info Section
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(camera.name)
                        .font(.headline)
                    Text(camera.location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Features
                HStack(spacing: 12) {
                    if camera.nightVision {
                        Image(systemName: "moon.fill")
                            .foregroundColor(.purple)
                    }
                    
                    Circle()
                        .fill(camera.isOnline ? Color.green : Color.red)
                        .frame(width: 10, height: 10)
                }
            }
            .padding()
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Motion Events List

struct MotionEventsListView: View {
    @ObservedObject var viewModel: CamerasViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if viewModel.isLoadingEvents {
                    ProgressView("Loading events...")
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let eventsResponse = viewModel.motionEventsResponse {
                    // Summary
                    HStack {
                        Image(systemName: "figure.walk.motion")
                            .foregroundColor(.blue)
                        Text(eventsResponse.summary)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Events
                    ForEach(eventsResponse.events) { event in
                        MotionEventCard(event: event)
                    }
                    
                    if eventsResponse.events.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.largeTitle)
                                .foregroundColor(.green)
                            Text("No motion events")
                                .font(.headline)
                            Text("Your home has been quiet")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    }
                } else if let error = viewModel.errorMessage {
                    ErrorCard(message: error) {
                        viewModel.refresh()
                    }
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.loadMotionEvents()
        }
    }
}

// MARK: - Motion Event Card

struct MotionEventCard: View {
    let event: MotionEvent
    
    var confidenceColor: Color {
        if event.confidence >= 90 { return .green }
        if event.confidence >= 75 { return .orange }
        return .red
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: eventIcon)
                    .foregroundColor(.blue)
            }
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(event.eventType)
                    .font(.headline)
                Text(event.cameraName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(formatTimestamp(event.timestamp))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Confidence
            VStack(spacing: 2) {
                Text("\(event.confidence)%")
                    .font(.headline)
                    .foregroundColor(confidenceColor)
                Text("confidence")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 1)
    }
    
    var eventIcon: String {
        switch event.eventType.lowercased() {
        case let type where type.contains("person"):
            return "figure.stand"
        case let type where type.contains("vehicle"):
            return "car.fill"
        case let type where type.contains("animal"):
            return "pawprint.fill"
        case let type where type.contains("package"):
            return "shippingbox.fill"
        default:
            return "figure.walk.motion"
        }
    }
    
    func formatTimestamp(_ timestamp: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: timestamp) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .short
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        return timestamp
    }
}

// MARK: - Corner Radius Extension

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - View Model

@MainActor
class CamerasViewModel: ObservableObject {
    @Published var camerasResponse: CamerasResponse?
    @Published var motionEventsResponse: MotionEventsResponse?
    @Published var isLoading = false
    @Published var isLoadingEvents = false
    @Published var errorMessage: String?
    
    private let api = APIService.shared
    
    func loadCameras() async {
        isLoading = true
        errorMessage = nil
        
        do {
            camerasResponse = try await api.getCameras()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadMotionEvents() async {
        isLoadingEvents = true
        
        do {
            motionEventsResponse = try await api.getMotionEvents(hours: 24)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoadingEvents = false
    }
    
    func refresh() {
        Task {
            await loadCameras()
            await loadMotionEvents()
        }
    }
}

#Preview {
    CamerasView()
}
