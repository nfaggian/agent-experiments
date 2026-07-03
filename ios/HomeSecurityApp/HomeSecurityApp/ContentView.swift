import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(AppState.Tab.dashboard)
            
            LocksView()
                .tabItem {
                    Label("Locks", systemImage: "lock.fill")
                }
                .tag(AppState.Tab.locks)
            
            CamerasView()
                .tabItem {
                    Label("Cameras", systemImage: "video.fill")
                }
                .tag(AppState.Tab.cameras)
            
            ChatView()
                .tabItem {
                    Label("Assistant", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(AppState.Tab.chat)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(AppState.Tab.settings)
        }
        .tint(.blue)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
