# Home Voice Agent — Native iOS App

Native SwiftUI iPhone app for talking to your home agent over the voice WebSocket server.

## Requirements

- macOS with Xcode 15+
- iPhone running iOS 17+ (or adjust deployment target in Xcode)
- Home voice server running (`make voice` from repo root)

## Open in Xcode

1. Open `ios/HomeVoiceAgent.xcodeproj` in Xcode
2. Select your development team under **Signing & Capabilities**
3. Build and run on your iPhone (same Wi‑Fi as the server)

## Configure the server

In the app **Settings** screen:

| Field | Example |
|-------|---------|
| Host | `192.168.1.42:8000` |
| Use TLS | Off for local dev, On for remote `wss://` |

The app connects to:

```
ws(s)://<host>/ws/<user-id>?is_audio=true
```

## Features

- Real-time voice via microphone (16 kHz PCM uplink)
- Agent voice playback (24 kHz PCM downlink)
- Text chat fallback
- Persistent server settings
- Reconnect from Settings

## Project structure

```
ios/HomeVoiceAgent/
├── HomeVoiceAgentApp.swift      # App entry
├── ContentView.swift            # Main chat UI
├── SettingsView.swift           # Server configuration
├── ViewModels/ChatViewModel.swift
├── Services/
│   ├── AgentWebSocketClient.swift
│   ├── AudioCaptureManager.swift
│   └── AudioPlaybackManager.swift
└── Models/
    ├── ChatMessage.swift
    └── ServerSettings.swift
```

## Remote access

For use outside your home network:

1. Put the Python voice server behind HTTPS (Tailscale, Cloudflare Tunnel, or reverse proxy)
2. Enable **Use TLS** in app settings
3. Enter your public hostname, e.g. `home-agent.example.com`

## Troubleshooting

- **Cannot connect**: Confirm `make voice` is running and the host IP is reachable from your phone
- **No audio**: Check microphone permission in iOS Settings → Home Agent
- **Voice cuts out**: Use headphones to reduce echo feedback
