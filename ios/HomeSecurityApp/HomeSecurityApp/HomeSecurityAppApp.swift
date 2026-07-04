import SwiftUI

@main
struct HomeSecurityAppApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

class AppState: ObservableObject {
    @Published var isAuthenticated = true
    @Published var selectedTab: Tab = .dashboard
    
    enum Tab {
        case dashboard, locks, cameras, chat, settings
    }
}
