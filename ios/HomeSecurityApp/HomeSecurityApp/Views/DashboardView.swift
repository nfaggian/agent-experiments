import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if viewModel.isLoading {
                        ProgressView("Loading...")
                            .frame(maxWidth: .infinity, minHeight: 200)
                    } else if let summary = viewModel.summary {
                        // Security Score Card
                        SecurityScoreCard(
                            score: summary.securityScore,
                            level: summary.securityLevel
                        )
                        
                        // Quick Actions
                        QuickActionsView(viewModel: viewModel)
                        
                        // Status Cards
                        VStack(spacing: 16) {
                            StatusCard(
                                title: "Locks",
                                icon: "lock.fill",
                                iconColor: summary.locks.allSecure ? .green : .orange,
                                summary: summary.locks.summary,
                                isGood: summary.locks.allSecure
                            )
                            
                            StatusCard(
                                title: "Cameras",
                                icon: "video.fill",
                                iconColor: summary.cameras.allOnline ? .green : .red,
                                summary: summary.cameras.summary,
                                isGood: summary.cameras.allOnline
                            )
                            
                            StatusCard(
                                title: "Sensors",
                                icon: "sensor.fill",
                                iconColor: summary.sensors.allNormal ? .green : .orange,
                                summary: summary.sensors.summary,
                                isGood: summary.sensors.allNormal
                            )
                            
                            SecuritySystemCard(status: summary.securitySystem)
                        }
                        
                        // Issues Section
                        if !summary.issues.isEmpty && summary.issues.first != "No issues - home is secure" {
                            IssuesCard(issues: summary.issues)
                        }
                        
                        // Recommendations
                        if !summary.recommendations.isEmpty {
                            RecommendationsCard(recommendations: summary.recommendations)
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
                await viewModel.loadSummary()
            }
            .navigationTitle("Home Security")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.refresh() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .task {
            await viewModel.loadSummary()
        }
    }
}

// MARK: - Security Score Card

struct SecurityScoreCard: View {
    let score: Int
    let level: String
    
    var scoreColor: Color {
        if score >= 90 { return .green }
        if score >= 70 { return .yellow }
        if score >= 50 { return .orange }
        return .red
    }
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                    .frame(width: 120, height: 120)
                
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(scoreColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 1), value: score)
                
                VStack(spacing: 2) {
                    Text("\(score)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(scoreColor)
                    Text("/ 100")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(level)
                .font(.headline)
                .foregroundColor(scoreColor)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Quick Actions

struct QuickActionsView: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    title: "Goodnight",
                    icon: "moon.fill",
                    color: .indigo,
                    isLoading: viewModel.isPerformingAction
                ) {
                    await viewModel.executeGoodnight()
                }
                
                QuickActionButton(
                    title: "Leaving",
                    icon: "figure.walk",
                    color: .blue,
                    isLoading: viewModel.isPerformingAction
                ) {
                    await viewModel.executeLeaving()
                }
                
                QuickActionButton(
                    title: "Arriving",
                    icon: "house.fill",
                    color: .green,
                    isLoading: viewModel.isPerformingAction
                ) {
                    await viewModel.executeArriving()
                }
            }
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let isLoading: Bool
    let action: () async -> Void
    
    var body: some View {
        Button(action: {
            Task { await action() }
        }) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(12)
        }
        .disabled(isLoading)
    }
}

// MARK: - Status Card

struct StatusCard: View {
    let title: String
    let icon: String
    let iconColor: Color
    let summary: String
    let isGood: Bool
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(iconColor)
                .frame(width: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: isGood ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                .foregroundColor(isGood ? .green : .orange)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 1)
    }
}

// MARK: - Security System Card

struct SecuritySystemCard: View {
    let status: SecuritySystemStatus
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: status.isArmed ? "shield.checkered" : "shield.slash")
                .font(.title)
                .foregroundColor(status.isArmed ? .green : .orange)
                .frame(width: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Security System")
                    .font(.headline)
                Text(status.status)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                if status.isArmed {
                    Text("Mode: \(status.armMode.capitalized)")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            
            Spacer()
            
            Image(systemName: status.isArmed ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(status.isArmed ? .green : .orange)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 1)
    }
}

// MARK: - Issues Card

struct IssuesCard: View {
    let issues: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("Issues")
                    .font(.headline)
            }
            
            ForEach(issues, id: \.self) { issue in
                HStack(alignment: .top, spacing: 8) {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 6, height: 6)
                        .padding(.top, 6)
                    Text(issue)
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Recommendations Card

struct RecommendationsCard: View {
    let recommendations: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.blue)
                Text("Recommendations")
                    .font(.headline)
            }
            
            ForEach(recommendations, id: \.self) { rec in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "arrow.right.circle.fill")
                        .foregroundColor(.blue)
                        .font(.caption)
                        .padding(.top, 2)
                    Text(rec)
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Error Card

struct ErrorCard: View {
    let message: String
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.exclamationmark")
                .font(.largeTitle)
                .foregroundColor(.red)
            
            Text("Connection Error")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Retry") {
                retryAction()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

// MARK: - View Model

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var summary: HomeSummary?
    @Published var isLoading = false
    @Published var isPerformingAction = false
    @Published var errorMessage: String?
    @Published var actionMessage: String?
    
    private let api = APIService.shared
    
    func loadSummary() async {
        isLoading = true
        errorMessage = nil
        
        do {
            summary = try await api.getSummary()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() {
        Task {
            await loadSummary()
        }
    }
    
    func executeGoodnight() async {
        isPerformingAction = true
        do {
            let result = try await api.goodnightRoutine()
            actionMessage = result.message
            await loadSummary()
        } catch {
            errorMessage = error.localizedDescription
        }
        isPerformingAction = false
    }
    
    func executeLeaving() async {
        isPerformingAction = true
        do {
            let result = try await api.leavingRoutine()
            actionMessage = result.message
            await loadSummary()
        } catch {
            errorMessage = error.localizedDescription
        }
        isPerformingAction = false
    }
    
    func executeArriving() async {
        isPerformingAction = true
        do {
            let result = try await api.arrivingRoutine()
            actionMessage = result.message
            await loadSummary()
        } catch {
            errorMessage = error.localizedDescription
        }
        isPerformingAction = false
    }
}

#Preview {
    DashboardView()
}
