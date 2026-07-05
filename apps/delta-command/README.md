# Delta Command

An engineering operations dashboard for delta engineering teams. Tracks opportunity pipeline, team utilization, and active project delivery.

## Architecture

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.12+, FastAPI, Pydantic |
| **Database** | Single JSON file (`backend/config/data.json`) |
| **Dependencies** | [UV](https://docs.astral.sh/uv/) (Python), npm (frontend) |

## Quick Start

```bash
# Backend (in one terminal)
cd apps/delta-command/backend && uv sync && uv run delta-command   # → :8000

# Frontend (in another)
cd apps/delta-command && npm install && npm run dev                 # → :3000
```

Or use the Makefile:

```bash
make install   # install both
make backend   # start API
make frontend  # start UI
make test      # backend tests + frontend build
```

## How it works

The whole app is small on purpose:

- **Backend** is a thin CRUD layer with 4 endpoints (see `backend/README.md`). It never computes derived metrics.
- **Frontend** fetches the full database via `GET /api/state` once per page and derives every KPI, chart, and insight on the client.
- **Data model** is `Engineer | Opportunity | Project` in `backend/config/data.json`.
- **Mutations** (opportunity stage, project status, timeline cells) `PATCH` the JSON file atomically and return the updated state.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `DELTA_API_URL` | `http://127.0.0.1:8000` | Backend URL (used by Next.js server-side and rewrites). |
| `DELTA_DATA_PATH` | `backend/config/data.json` | JSON database file. |
| `DELTA_HOST` / `DELTA_PORT` | `127.0.0.1` / `8000` | Backend bind address. |
| `LLM_API_KEY` | *(unset)* | Enables the **Delta chat** surface and executive briefing. |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint (Groq, Ollama, etc.). |
| `LLM_MODEL` | `gpt-4o-mini` | Model name. |

### Delta chat

With `LLM_API_KEY` set, `/chat` becomes a full conversational surface: composer, message thread, starter prompts, streaming reveal. Every turn sends the current pipeline, team-capacity, and delivery state as the system prompt, so answers stay grounded. The dashboard "Ask Delta" callout deep-links into `/chat?prompt=<id>` and auto-submits the first turn. Works with any OpenAI-compatible provider:

```bash
# OpenAI
export LLM_API_KEY=sk-...

# Groq
export LLM_API_KEY=gsk_...
export LLM_BASE_URL=https://api.groq.com/openai/v1
export LLM_MODEL=llama-3.1-70b-versatile

# Local Ollama
export LLM_API_KEY=ollama
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=llama3.2
```

## Production

```bash
# Backend
cd backend && uv sync --no-dev && uv run uvicorn delta_command.main:app --host 0.0.0.0 --port 8000

# Frontend
npm run build && npm start
```

For scale, swap the JSON file store in `delta_command/store.py` for a real database — the Pydantic models and API routes stay the same.
