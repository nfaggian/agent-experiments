# Delta Command Backend

A thin FastAPI CRUD layer over a single JSON file. Four endpoints total.

## Setup

```bash
cd apps/delta-command/backend
uv sync
uv run delta-command    # → http://127.0.0.1:8000
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/state` | Return the entire database (`engineers`, `opportunities`, `projects`, `lastUpdated`). The frontend derives every metric from this. |
| PATCH | `/api/opportunities` | Update stage (probability auto-set to 100/0 for won/lost). |
| PATCH | `/api/projects` | Update status. |
| PATCH | `/api/timeline` | Update one weekly utilization cell for one engineer; recomputes engineer.utilization and status. |
| POST | `/api/briefing` | Author an executive briefing via an OpenAI-compatible LLM. Returns `503` if `LLM_API_KEY` is not set. |

### LLM configuration

`POST /api/briefing` uses an OpenAI-compatible chat completions endpoint:

```
LLM_API_KEY    required
LLM_BASE_URL   default https://api.openai.com/v1
LLM_MODEL      default gpt-4o-mini
```

Works with OpenAI, Groq, Ollama, or any provider that speaks `/v1/chat/completions`.

## Database

All data lives in **`config/data.json`**. Set `DELTA_DATA_PATH` to override the path.

Writes are atomic (`delta_command/json_db.py`).

Regenerate the 30-engineer seed dataset:

```bash
uv run python scripts/seed_team.py
```

`scripts/seed_team.py` is the single source of truth for timeline shape — the API only ever updates existing cells, it never adds new weeks.

## Layout

```
delta_command/
├── json_db.py   # atomic file I/O
├── models.py    # Pydantic models (snake_case in Python, camelCase in JSON)
├── store.py     # domain operations (load/save/update)
├── briefing.py  # LLM-authored executive briefing
└── main.py      # FastAPI routes
```
