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

# Run Prefect workflows
make prefect-server
```

## Components

### Agents
- **`doc_agent`**: Technical writing assistant with Google Docs integration
  - Uses local Ollama models (`gpt-oss:20b`) via LiteLLM
  - Includes Google Docs tools for creating and formatting documents
- **`home_agent`**: Voice-controlled home assistant for iPhone and browsers
  - Uses Gemini Live API for real-time voice conversations
  - Pluggable skills (Home Assistant, routines) via `config/skills.yaml`
  - Safety guardrails via `config/guardrails.yaml`
  - Native iOS app (`ios/`) and web PWA served by the voice WebSocket server

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
make home_web         # Run ADK web UI for home agent only
make voice            # Run iPhone-friendly voice server
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
│   ├── doc_agent/           # Technical writing assistant
│   │   ├── agent.py
│   │   └── tools/
│   └── home_agent/          # Voice home assistant
│       ├── agent.py
│       ├── config/          # skills.yaml, guardrails.yaml
│       ├── guardrails/
│       ├── skills/
│       └── tools/
├── server/
│   ├── voice_server.py      # WebSocket voice server + PWA
│   └── static/              # Browser web client
└── workflows/
ios/
└── HomeVoiceAgent.xcodeproj # Native iPhone app (SwiftUI)
```

## Configuration

- **Ollama**: Set `OLLAMA_API_BASE` in `.env` or environment
- **Google Docs**: Place `credentials.json` in project root (token.json auto-generated)
- **Home Voice Agent**: Copy `.env.example` to `.env` and set:
  - `GOOGLE_API_KEY` — Gemini API key (required for voice)
  - `HOME_ASSISTANT_URL` and `HOME_ASSISTANT_TOKEN` — Home Assistant access
  - Customize skills in `src/agents/home_agent/config/skills.yaml`
  - Customize guardrails in `src/agents/home_agent/config/guardrails.yaml`
- **Prefect UI**: Available at `http://127.0.0.1:4200` (or port specified by `PREFECT_PORT`)

## Home Voice Agent (iPhone)

### Native iOS app (recommended)

1. Copy `.env.example` to `.env` and add your Gemini + Home Assistant credentials
2. Start the voice server on your Mac: `make voice`
3. Open `ios/HomeVoiceAgent.xcodeproj` in Xcode
4. Set your development team, build to your iPhone
5. In app Settings, enter your server host (e.g. `192.168.1.42:8000`)
6. Tap **Start Voice** and talk to your home

See `ios/README.md` for full setup and remote access options.

### Web client (alternative)

1. Start the voice server: `make voice`
2. On your iPhone (same Wi‑Fi), open `http://<your-computer-ip>:8000`
3. Tap **Start Voice**, allow the microphone, and talk to your home

For HTTPS/WSS from your phone outside the LAN, put the server behind a reverse proxy
or tunnel (e.g. Cloudflare Tunnel, Tailscale) and use `wss://`.
