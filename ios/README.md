# Home Security iOS App

A modern SwiftUI iOS application for monitoring and controlling your home security system.

## Features

### Dashboard
- **Security Score**: Visual gauge showing overall home security status (0-100)
- **Quick Actions**: One-tap routines for common scenarios
  - **Goodnight**: Lock all doors + arm in night mode
  - **Leaving**: Lock all doors + arm in away mode
  - **Arriving**: Disarm + unlock front door
- **Status Overview**: At-a-glance view of locks, cameras, sensors, and security system
- **Issues & Recommendations**: AI-powered security suggestions

### Locks
- View all smart locks with real-time status
- Lock/unlock individual doors with confirmation dialogs
- "Lock All" button for quick security
- Battery level monitoring
- Activity timestamps

### Cameras
- View all security cameras with online/offline status
- Motion detection indicators
- Camera capabilities (resolution, night vision, recording)
- Motion events timeline with event types and confidence scores
- Simulated live feed placeholders

### AI Assistant (Chat)
- Natural language interaction with your security system
- Ask questions like:
  - "What's going on at home?"
  - "Are all doors locked?"
  - "Show me motion events"
  - "Arm the security system"
- Smart suggestions for follow-up actions
- Conversation history with session continuity

### Settings
- **Server Configuration**: Connect to your Home Security API
- **Security System Control**: Arm/disarm with mode selection
- **Notification Preferences**: Configure alert types
- **Activity Log**: Full history of security events
- **Sensors View**: Detailed sensor status and battery levels

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Home Security API server running

## Setup

### 1. Start the Backend Server

```bash
# From the project root
make mobile-api

# Server will run at http://localhost:8000
```

### 2. Open in Xcode

```bash
open ios/HomeSecurityApp/HomeSecurityApp.xcodeproj
```

### 3. Configure Server URL

- For **Simulator**: Uses `http://localhost:8000` by default
- For **Physical Device**: 
  1. Find your Mac's IP address
  2. Go to Settings tab in the app
  3. Tap "Server Configuration"
  4. Enter `http://<your-mac-ip>:8000`
  5. Test connection and save

### 4. Build and Run

- Select your target device (Simulator or Physical)
- Press ⌘R or click the Run button

## Architecture

```
HomeSecurityApp/
├── HomeSecurityAppApp.swift    # App entry point
├── ContentView.swift           # Main tab view
├── Models/
│   └── Models.swift            # API data models (Codable)
├── Services/
│   └── APIService.swift        # REST API client
├── Views/
│   ├── DashboardView.swift     # Home dashboard
│   ├── LocksView.swift         # Lock management
│   ├── CamerasView.swift       # Camera monitoring
│   ├── ChatView.swift          # AI assistant chat
│   └── SettingsView.swift      # App settings
└── Assets.xcassets/            # App icons and colors
```

## API Integration

The app communicates with the Home Security API via REST endpoints:

| Feature | Endpoint | Method |
|---------|----------|--------|
| Dashboard | `/api/summary` | GET |
| Locks | `/api/locks` | GET |
| Lock Door | `/api/locks/{id}/lock` | POST |
| Unlock Door | `/api/locks/{id}/unlock` | POST |
| Cameras | `/api/cameras` | GET |
| Motion Events | `/api/cameras/motion-events` | GET |
| Sensors | `/api/sensors` | GET |
| Security Status | `/api/security-system` | GET |
| Arm System | `/api/security-system/arm` | POST |
| Disarm System | `/api/security-system/disarm` | POST |
| Activity | `/api/activity` | GET |
| Chat | `/api/chat` | POST |
| Quick Actions | `/api/quick-actions/*` | POST |

## Customization

### Colors
Edit `Assets.xcassets/AccentColor.colorset/Contents.json` to change the app's accent color.

### Server URL
The default server URL can be changed in `APIService.swift`:
```swift
self.baseURL = UserDefaults.standard.string(forKey: "serverURL") ?? "http://localhost:8000"
```

## Screenshots

The app includes:
- 📊 Dashboard with security score gauge
- 🔐 Lock cards with battery indicators
- 📹 Camera grid with motion detection
- 💬 Chat interface with typing indicators
- ⚙️ Settings with arm/disarm controls

## Future Enhancements

- [ ] Push notifications via APNs
- [ ] Live camera streaming
- [ ] Face ID/Touch ID authentication
- [ ] Apple Watch companion app
- [ ] Siri Shortcuts integration
- [ ] Home Widget for iOS
- [ ] Offline mode with local caching

## Troubleshooting

### "Connection Error" on Dashboard
1. Ensure the backend server is running (`make mobile-api`)
2. Check the server URL in Settings
3. For physical devices, ensure you're on the same network

### App won't build
1. Ensure Xcode 15+ is installed
2. Check that iOS deployment target is 17.0
3. Clean build folder (⇧⌘K) and rebuild

### Simulator network issues
The iOS simulator uses your Mac's network. Ensure `localhost:8000` is accessible from Terminal:
```bash
curl http://localhost:8000/health
```
