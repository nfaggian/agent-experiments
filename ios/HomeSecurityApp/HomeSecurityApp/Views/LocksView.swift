import SwiftUI

struct LocksView: View {
    @StateObject private var viewModel = LocksViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if viewModel.isLoading {
                        ProgressView("Loading locks...")
                            .frame(maxWidth: .infinity, minHeight: 200)
                    } else if let locksResponse = viewModel.locksResponse {
                        // Summary Header
                        LocksSummaryHeader(
                            allSecure: locksResponse.allSecure,
                            summary: locksResponse.summary
                        )
                        
                        // Lock All Button
                        if !locksResponse.allSecure {
                            Button(action: {
                                Task { await viewModel.lockAllDoors() }
                            }) {
                                HStack {
                                    Image(systemName: "lock.fill")
                                    Text("Lock All Doors")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .disabled(viewModel.isPerformingAction)
                        }
                        
                        // Lock Cards
                        ForEach(Array(locksResponse.locks.keys.sorted()), id: \.self) { key in
                            if let lock = locksResponse.locks[key] {
                                LockCard(
                                    lockId: key,
                                    lock: lock,
                                    isPerforming: viewModel.isPerformingAction,
                                    onLock: { await viewModel.lockDoor(key) },
                                    onUnlock: { await viewModel.unlockDoor(key) }
                                )
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
                await viewModel.loadLocks()
            }
            .navigationTitle("Locks")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.refresh() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .alert("Action Result", isPresented: $viewModel.showAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.alertMessage)
            }
        }
        .task {
            await viewModel.loadLocks()
        }
    }
}

// MARK: - Summary Header

struct LocksSummaryHeader: View {
    let allSecure: Bool
    let summary: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: allSecure ? "lock.shield.fill" : "lock.open.fill")
                .font(.largeTitle)
                .foregroundColor(allSecure ? .green : .orange)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(allSecure ? "All Secure" : "Attention Needed")
                    .font(.headline)
                    .foregroundColor(allSecure ? .green : .orange)
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(allSecure ? Color.green.opacity(0.1) : Color.orange.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Lock Card

struct LockCard: View {
    let lockId: String
    let lock: LockStatus
    let isPerforming: Bool
    let onLock: () async -> Void
    let onUnlock: () async -> Void
    
    @State private var showUnlockConfirmation = false
    
    var batteryColor: Color {
        if lock.batteryLevel > 50 { return .green }
        if lock.batteryLevel > 20 { return .orange }
        return .red
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Main Content
            HStack(spacing: 16) {
                // Lock Icon
                ZStack {
                    Circle()
                        .fill(lock.isLocked ? Color.green.opacity(0.15) : Color.orange.opacity(0.15))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: lock.isLocked ? "lock.fill" : "lock.open.fill")
                        .font(.title2)
                        .foregroundColor(lock.isLocked ? .green : .orange)
                }
                
                // Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(lock.name)
                        .font(.headline)
                    
                    Text(lock.location)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    // Battery
                    HStack(spacing: 4) {
                        Image(systemName: batteryIcon)
                            .foregroundColor(batteryColor)
                        Text("\(lock.batteryLevel)%")
                            .font(.caption)
                            .foregroundColor(batteryColor)
                    }
                }
                
                Spacer()
                
                // Status Badge
                Text(lock.status)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(lock.isLocked ? Color.green : Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .padding()
            
            Divider()
            
            // Actions
            HStack(spacing: 0) {
                Button(action: {
                    Task { await onLock() }
                }) {
                    HStack {
                        Image(systemName: "lock.fill")
                        Text("Lock")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .disabled(lock.isLocked || isPerforming)
                .foregroundColor(lock.isLocked ? .gray : .blue)
                
                Divider()
                    .frame(height: 30)
                
                Button(action: {
                    showUnlockConfirmation = true
                }) {
                    HStack {
                        Image(systemName: "lock.open.fill")
                        Text("Unlock")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .disabled(!lock.isLocked || isPerforming)
                .foregroundColor(!lock.isLocked ? .gray : .orange)
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .confirmationDialog("Unlock \(lock.name)?", isPresented: $showUnlockConfirmation, titleVisibility: .visible) {
            Button("Unlock", role: .destructive) {
                Task { await onUnlock() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to unlock this door?")
        }
    }
    
    var batteryIcon: String {
        if lock.batteryLevel > 75 { return "battery.100" }
        if lock.batteryLevel > 50 { return "battery.75" }
        if lock.batteryLevel > 25 { return "battery.50" }
        return "battery.25"
    }
}

// MARK: - View Model

@MainActor
class LocksViewModel: ObservableObject {
    @Published var locksResponse: LocksResponse?
    @Published var isLoading = false
    @Published var isPerformingAction = false
    @Published var errorMessage: String?
    @Published var showAlert = false
    @Published var alertMessage = ""
    
    private let api = APIService.shared
    
    func loadLocks() async {
        isLoading = true
        errorMessage = nil
        
        do {
            locksResponse = try await api.getLocks()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() {
        Task {
            await loadLocks()
        }
    }
    
    func lockDoor(_ lockId: String) async {
        isPerformingAction = true
        do {
            let result = try await api.lockDoor(lockId)
            alertMessage = result.message
            showAlert = true
            await loadLocks()
        } catch {
            alertMessage = error.localizedDescription
            showAlert = true
        }
        isPerformingAction = false
    }
    
    func unlockDoor(_ lockId: String) async {
        isPerformingAction = true
        do {
            let result = try await api.unlockDoor(lockId, confirm: true)
            alertMessage = result.message
            if let warning = result.warning {
                alertMessage += "\n\n⚠️ \(warning)"
            }
            showAlert = true
            await loadLocks()
        } catch {
            alertMessage = error.localizedDescription
            showAlert = true
        }
        isPerformingAction = false
    }
    
    func lockAllDoors() async {
        isPerformingAction = true
        do {
            let result = try await api.lockAllDoors()
            alertMessage = result.message
            showAlert = true
            await loadLocks()
        } catch {
            alertMessage = error.localizedDescription
            showAlert = true
        }
        isPerformingAction = false
    }
}

#Preview {
    LocksView()
}
