# Agent Experiments

Experiments with Google Agent Development Kit (ADK) for building AI agents with local Ollama models and Prefect workflows.

## Quick Start

This project uses [uv](https://docs.astral.sh/uv/) for Python version management, virtual environments, and dependencies. The lockfile (`uv.lock`) pins exact versions for reproducible installs.

```bash
# Install uv (once per machine)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create .venv and install dependencies from uv.lock
make install

# Configure Ollama (create .env file)
echo 'OLLAMA_API_BASE="http://localhost:11434"' > .env

# Run agents via web interface
make web

# Run Prefect workflows
make prefect-server
```

All commands run through `uv run`, so you do not need to activate the virtual environment manually.

## Components

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

- [uv](https://docs.astral.sh/uv/) (installs and manages Python 3.13 per `.python-version`)
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
make dashboard        # Run Yale lock + UniFi camera dashboard
make dashboard-1password  # Run dashboard with 1Password secrets
```

## Home Dashboard (Yale Lock + UniFi Camera)

A web dashboard for monitoring and controlling a Yale smart lock and viewing UniFi Protect camera snapshots.

### Setup

```bash
# Sync the uv environment (uses uv.lock + .python-version)
make install

# Copy and edit environment variables
cp .env.example .env
```

To add or upgrade a dependency, use uv and commit the updated lockfile:

```bash
uv add <package>          # runtime dependency
uv add --dev <package>    # dev dependency
uv lock                   # refresh uv.lock after manual pyproject edits
```

Configure `.env` with your Yale, UniFi, and weather settings (see `.env.example` for all options).

**Weather** appears alongside the UniFi camera feed. For Australian locations, use the [Bureau of Meteorology](https://www.bom.gov.au/) observation JSON feeds (no API key):

```bash
WEATHER_PROVIDER=bom
BOM_PRODUCT_ID=IDN60801    # state product ID from the BOM JSON URL
BOM_STATION_ID=94768       # station WMO ID from the same URL
WEATHER_LOCATION_NAME=Sydney
```

Example feed: `https://reg.bom.gov.au/fwo/IDN60801/IDN60801.94768.json`

Alternatively, set `WEATHER_PROVIDER=open_meteo` with `WEATHER_LATITUDE` and `WEATHER_LONGITUDE` for global coverage via Open-Meteo.

### Run

```bash
make dashboard
```

Open `http://127.0.0.1:8080` in your browser.

### Run with 1Password

Store Yale and UniFi credentials in 1Password, then inject them at runtime with the [1Password CLI](https://developer.1password.com/docs/cli/) (`op`). Non-secret settings (hostnames, ports, weather coordinates) stay as plaintext in your env file; only passwords and usernames use `op://` secret references.

```bash
# Install the 1Password CLI and sign in
op signin

# Create your local env file from the example
cp .env.1password.example .env.1password

# Edit .env.1password — replace vault/item/field names with your references.
# List field references for an item:
op item get "Yale Access" --format json | jq '.fields[] | {label, reference}'

# Start the dashboard (secrets are resolved by op run, never written to disk)
make dashboard-1password
```

Optional environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `ONEPASSWORD_ENV_FILE` | `.env.1password` | Path to the env file with `op://` references |
| `ONEPASSWORD_ENVIRONMENT` | _(unset)_ | 1Password Environment ID (`op run --environment`) |

Example with a 1Password Environment plus a local override file:

```bash
ONEPASSWORD_ENVIRONMENT=env_abc123 make dashboard-1password
```

### Features

- **Yale lock**: live lock/door status, recent activity feed, lock/unlock controls
- **UniFi camera**: camera selector, live snapshot feed, and local weather panel (temperature, wind, humidity, rain since 9am)
- **Real-time updates**: Server-Sent Events push status changes to the browser
- **Dynamic background**: sky gradient reflects time of day and live weather (BOM or Open-Meteo)

### Requirements

- Yale lock connected via Yale Access / August app with Wi-Fi bridge
- UniFi Protect NVR (Cloud Key+, Dream Machine, etc.) on your network
- [uv](https://docs.astral.sh/uv/) with Python 3.13 (see `.python-version`)

## Project Structure

```
src/
├── agents/
│   └── doc_agent/           # Technical writing assistant
│       ├── agent.py         # Agent definition
│       └── tools/
│           └── google_docs_tool.py  # Google Docs integration
├── yale_lock/               # Yale lock + UniFi camera dashboard
│   ├── server.py            # FastAPI application
│   ├── yale_client.py       # Yale lock integration
│   ├── unifi_client.py      # UniFi Protect camera integration
│   ├── static/              # Web UI assets
│   └── templates/           # HTML templates
└── workflows/
    ├── pipeline.py          # Main Prefect workflow
    ├── serve.py             # Flow serving entry point
    └── discover.py          # Flow discovery utility
```

## Configuration

- **Ollama**: Set `OLLAMA_API_BASE` in `.env` or environment
- **Google Docs**: Place `credentials.json` in project root (token.json auto-generated)
- **Prefect UI**: Available at `http://127.0.0.1:4200` (or port specified by `PREFECT_PORT`)
