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
└── workflows/
    ├── pipeline.py          # Main Prefect workflow
    ├── serve.py             # Flow serving entry point
    └── discover.py          # Flow discovery utility
```

## Configuration

- **Ollama**: Set `OLLAMA_API_BASE` in `.env` or environment
- **Google Docs**: Place `credentials.json` in project root (token.json auto-generated)
- **Prefect UI**: Available at `http://127.0.0.1:4200` (or port specified by `PREFECT_PORT`)
