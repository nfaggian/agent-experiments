# Agent Experiments

Experiments with Google Agent Development Kit (ADK) for building AI agents with local Ollama models and Prefect workflows.

## Quick Start

```bash
# Install dependencies
make install

# Configure Ollama (create .env file)
echo 'OLLAMA_API_BASE="http://localhost:11434"' > .env

# Run agents via web interface
make web

# Run Home Security Mobile API
make mobile-api

# Run Prefect workflows
make prefect-server
```

## Components

### Agents

#### Home Security Agent (NEW)
An AI-powered home security monitoring agent that manages smart locks, cameras, and sensors. Uses **Gemma 2 9B** by default via local Ollama.

**Features:**
- **Smart Lock Management**: View status, lock/unlock doors remotely
- **Camera Monitoring**: View camera status, capture snapshots, review motion events
- **Sensor Monitoring**: Track motion, door/window, smoke, and water leak sensors
- **Security System Control**: Arm/disarm with multiple modes (away, home, night)
- **AI Chat Interface**: Natural language interaction for security queries
- **Quick Actions**: Pre-built routines for common scenarios (goodnight, leaving, arriving)
- **Push Notifications**: Register devices for real-time security alerts

**Run the Mobile API:**
```bash
make mobile-api
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

**Example API Calls:**
```bash
# Get home security summary
curl http://localhost:8000/api/summary

# Get all locks status
curl http://localhost:8000/api/locks

# Lock a specific door
curl -X POST http://localhost:8000/api/locks/front_door/lock

# Chat with the AI assistant
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is going on at home?"}'

# Execute goodnight routine (lock all doors + arm in night mode)
curl -X POST http://localhost:8000/api/quick-actions/goodnight
```

#### Doc Agent
Technical writing assistant with Google Docs integration.
- Uses local Ollama models (`gpt-oss:20b`) via LiteLLM
- Includes Google Docs tools for creating and formatting documents

### Workflows
- **`pipeline.py`**: Prefect workflow for orchestrating document creation and content generation
- **`serve.py`**: Entry point for serving Prefect flows

### Mobile API
A FastAPI-based REST API designed for iOS/Android mobile app consumption.

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summary` | GET | Home security dashboard summary |
| `/api/locks` | GET | All locks status |
| `/api/locks/{id}/lock` | POST | Lock a specific door |
| `/api/locks/{id}/unlock` | POST | Unlock a door (requires confirmation) |
| `/api/locks/lock-all` | POST | Lock all doors |
| `/api/cameras` | GET | All cameras status |
| `/api/cameras/{id}/snapshot` | POST | Capture camera snapshot |
| `/api/cameras/motion-events` | GET | Recent motion detection events |
| `/api/sensors` | GET | All sensors status |
| `/api/security-system` | GET | Security system status |
| `/api/security-system/arm` | POST | Arm security system |
| `/api/security-system/disarm` | POST | Disarm security system |
| `/api/activity` | GET | Recent activity log |
| `/api/chat` | POST | AI assistant chat |
| `/api/quick-actions/goodnight` | POST | Execute goodnight routine |
| `/api/quick-actions/leaving` | POST | Execute leaving home routine |
| `/api/quick-actions/arriving` | POST | Execute arriving home routine |

## Prerequisites

- Python 3.10+
- Ollama installed and running (for AI agents)
- Google OAuth credentials (`credentials.json`) for Google Docs API (optional)

## Commands

```bash
make web               # Run ADK web interface (all agents)
make mobile-api        # Run Home Security Mobile API server
make home-security-web # Run Home Security Agent via ADK web
make api_server        # Run ADK FastAPI server
make prefect-server    # Start Prefect server and serve flows
make test              # Run tests
make check             # Lint and type check
make clean             # Remove build artifacts and cache
```

## Project Structure

```
src/
├── agents/
│   ├── doc_agent/              # Technical writing assistant
│   │   ├── agent.py            # Agent definition
│   │   └── tools/
│   │       └── google_docs_tool.py
│   └── home_security_agent/    # Home security monitoring agent
│       ├── __init__.py
│       ├── agent.py            # Agent definition with tools
│       └── tools/
│           ├── __init__.py
│           └── device_tools.py # Smart device integration
├── mobile_api/                 # REST API for mobile apps
│   ├── __init__.py
│   ├── app.py                  # FastAPI application
│   ├── models.py               # Pydantic models
│   └── server.py               # Server entry point
└── workflows/
    ├── pipeline.py             # Main Prefect workflow
    ├── serve.py                # Flow serving entry point
    └── discover.py             # Flow discovery utility
tests/
├── test_home_security_agent.py # Agent tool tests
└── test_mobile_api.py          # API endpoint tests
```

## iOS App Integration

The Mobile API is designed for easy iOS app integration:

1. **SwiftUI/UIKit**: Use URLSession or Alamofire to call REST endpoints
2. **Widgets**: Use quick action endpoints for iOS widgets
3. **Siri Shortcuts**: Integrate quick actions with iOS Shortcuts app
4. **Push Notifications**: Register device tokens via `/api/notifications/register`

**Example Swift code:**
```swift
struct HomeSecurityAPI {
    let baseURL = "http://your-server:8000"
    
    func getSummary() async throws -> HomeSummary {
        let url = URL(string: "\(baseURL)/api/summary")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(HomeSummary.self, from: data)
    }
    
    func lockAllDoors() async throws {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/locks/lock-all")!)
        request.httpMethod = "POST"
        let (_, _) = try await URLSession.shared.data(for: request)
    }
    
    func chat(message: String) async throws -> ChatResponse {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/chat")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["message": message])
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(ChatResponse.self, from: data)
    }
}
```

## Configuration

- **Ollama**: Set `OLLAMA_API_BASE` in `.env` or environment
- **Home Security Model**: Set `HOME_SECURITY_MODEL` to override the default Gemma model
  - Default: `ollama_chat/gemma2:9b` (local Ollama)
  - Options: `ollama_chat/gemma2:27b`, `ollama_chat/gemma:7b`, `gemini/gemma-2-9b-it`
- **Google Docs**: Place `credentials.json` in project root (token.json auto-generated)
- **Prefect UI**: Available at `http://127.0.0.1:4200` (or port specified by `PREFECT_PORT`)
- **Mobile API**: Default port 8000, configurable via uvicorn options

### Setting up Gemma with Ollama

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.com/install.sh | sh

# Pull Gemma 2 9B model
ollama pull gemma2:9b

# Or for the larger 27B model (requires more RAM)
ollama pull gemma2:27b

# Start Ollama server
ollama serve
```

## Security Notes

- In production, add authentication (JWT/OAuth2) to the Mobile API
- Use HTTPS for all API communications
- Store sensitive credentials in environment variables
- The current implementation uses simulated device data for demonstration
