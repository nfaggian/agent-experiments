# Agent Experiments

Experiments with Google Agent Development Kit (ADK) for building AI agents with local Ollama models and Prefect workflows. Also includes MCP (Model Context Protocol) servers for home automation.

## Quick Start

```bash
# Install dependencies
make install

# Configure Ollama (create .env file)
echo 'OLLAMA_API_BASE="http://localhost:11434"' > .env

# Run agents via web interface
make web

# Run Prefect workflows
make prefect-server

# Run Home Security MCP Server
python -m src.mcp_servers.home_security.server
```

## Components

### MCP Servers
- **`home_security`**: MCP server for home security automation
  - **Cameras**: Manage security cameras (view, record, snapshots, motion detection)
  - **Smart Locks**: Control front door lock (lock/unlock, access codes, logs)
  - Supports stdio and SSE transports for LLM integration

### Agents
- **`doc_agent`**: Technical writing assistant with Google Docs integration
  - Uses local Ollama models (`gpt-oss:20b`) via LiteLLM
  - Includes Google Docs tools for creating and formatting documents

### Workflows
- **`pipeline.py`**: Prefect workflow for orchestrating document creation and content generation
- **`serve.py`**: Entry point for serving Prefect flows

### Tools
- **Google Docs Tool** (`doc_agent/tools/google_docs_tool.py`): 
  - Create new Google Docs
  - Write plain text or markdown content
  - Convert markdown to formatted Google Docs (headings, lists, bold/italic, links, code blocks, blockquotes, etc.)

## Prerequisites

- Python 3.13+
- Ollama installed and running
- Google OAuth credentials (`credentials.json`) for Google Docs API

## Commands

```bash
make web              # Run ADK web interface
make api_server       # Run ADK FastAPI server
make prefect-server   # Start Prefect server and serve flows
make prefect-flows    # Serve flows (server must be running)
make test             # Run tests
make check            # Lint and type check
```

## Project Structure

```
src/
├── agents/
│   └── doc_agent/           # Technical writing assistant
│       ├── agent.py         # Agent definition
│       └── tools/
│           └── google_docs_tool.py  # Google Docs integration
├── mcp_servers/
│   └── home_security/       # Home security MCP server
│       ├── server.py        # FastMCP server with tools & resources
│       ├── camera.py        # Camera management
│       ├── lock.py          # Smart lock management
│       └── models.py        # Data models
└── workflows/
    ├── pipeline.py          # Main Prefect workflow
    ├── serve.py             # Flow serving entry point
    └── discover.py          # Flow discovery utility
```

## Home Security MCP Server

The home security MCP server provides tools and resources for managing security cameras and smart locks.

### Running the Server

```bash
# Run with stdio transport (for local LLM clients like Claude Desktop)
python -m src.mcp_servers.home_security.server

# Run with SSE transport (for remote access)
python -m src.mcp_servers.home_security.server --transport sse --port 8000
```

### Available Resources

| Resource URI | Description |
|-------------|-------------|
| `security://cameras` | List all cameras |
| `security://cameras/{id}` | Get camera details |
| `security://cameras/{id}/status` | Get camera status |
| `security://cameras/{id}/storage` | Get storage info |
| `security://locks` | List all locks |
| `security://locks/{id}` | Get lock details |
| `security://locks/{id}/status` | Get lock status |
| `security://locks/{id}/battery` | Get battery status |
| `security://alerts` | Get all security alerts |
| `security://system/status` | Get overall system status |

### Available Tools

#### Camera Tools
- `get_camera_status` - Get camera operational status
- `start_camera_recording` - Start recording
- `stop_camera_recording` - Stop recording
- `get_camera_stream_url` - Get RTSP stream URL
- `capture_camera_snapshot` - Capture a snapshot
- `configure_motion_detection` - Enable/disable motion detection
- `get_motion_events` - Get recent motion events
- `acknowledge_motion_event` - Acknowledge an event
- `get_camera_recordings` - List available recordings
- `update_camera_settings` - Update camera settings

#### Lock Tools
- `get_lock_status` - Get lock status
- `lock_door` - Lock the door
- `unlock_door` - Unlock the door (with optional PIN)
- `add_lock_access_code` - Add a new PIN code
- `remove_lock_access_code` - Remove a PIN code
- `list_lock_access_codes` - List all codes
- `deactivate_lock_access_code` - Deactivate a code
- `get_lock_access_logs` - Get access history
- `configure_auto_lock` - Configure auto-lock
- `clear_lock_tamper_alert` - Clear tamper alert

#### Alert Tools
- `get_security_alerts` - Get all alerts
- `acknowledge_security_alert` - Acknowledge an alert

### Claude Desktop Integration

Add to your Claude Desktop config (`~/.cursor/mcp.json` or similar):

```json
{
  "mcpServers": {
    "home-security": {
      "command": "python",
      "args": ["-m", "src.mcp_servers.home_security.server"],
      "cwd": "/path/to/this/project"
    }
  }
}
```

## Configuration

- **Ollama**: Set `OLLAMA_API_BASE` in `.env` or environment
- **Google Docs**: Place `credentials.json` in project root (token.json auto-generated)
- **Prefect UI**: Available at `http://127.0.0.1:4200` (or port specified by `PREFECT_PORT`)
