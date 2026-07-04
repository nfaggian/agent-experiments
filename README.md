# Delta Command

A polished engineering operations dashboard for delta engineering teams. Track the opportunity pipeline, team utilization, and active project delivery — built for both engineers and leadership.

## Architecture

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.12+, FastAPI, Pydantic |
| **Database** | Single JSON file (`backend/config/data.json`) |
| **Dependencies** | [UV](https://docs.astral.sh/uv/) (Python), npm (frontend) |

## Quick Start

### 1. Backend (Python + UV)

```bash
cd apps/delta-command/backend
uv sync
uv run delta-command
```

API runs at http://127.0.0.1:8000

### 2. Frontend (Next.js)

In a second terminal:

```bash
cd apps/delta-command
npm install
npm run dev
```

Open http://localhost:3000 — API requests are proxied to the Python backend.

Or use the Makefile from `apps/delta-command/`:

```bash
make install    # install both
make backend    # start API
make frontend   # start UI
make test       # run backend tests + frontend build
```

## Database

All data lives in **one JSON file**:

```
backend/config/data.json
```

Every API read and write uses this file. UI edits (opportunity stages, project status, utilization timeline cells) are saved directly to disk via atomic JSON writes.

Customize your team by editing `data.json`, or change values in the UI — both update the same file.

### Example JSON structure

```json
{
  "lastUpdated": "2026-07-04T12:00:00Z",
  "engineers": [
    {
      "id": "eng-1",
      "name": "Sarah Chen",
      "role": "Principal Engineer",
      "utilization": 95,
      "status": "allocated",
      "skills": ["Architecture", "Cloud"],
      "currentProjects": ["proj-1"]
    }
  ],
  "opportunities": [
    {
      "id": "opp-1",
      "title": "Enterprise Data Platform",
      "client": "Meridian Financial",
      "stage": "negotiation",
      "value": 850000,
      "probability": 75
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Core Banking Migration",
      "status": "active",
      "progress": 68,
      "milestones": [
        {
          "id": "ms-1",
          "title": "Architecture Sign-off",
          "dueDate": "2026-02-15",
          "completed": true
        }
      ]
    }
  ]
}
```

Persistence is handled by `delta_command/json_db.py` (I/O) and `delta_command/store.py` (domain operations).

## Features

- **Executive Dashboard** — KPIs, pipeline funnel, utilization charts, at-risk alerts
- **Opportunity Pipeline** — Kanban board with stage management (persisted)
- **Team Utilization** — Editable timeline grid (persisted)
- **Project Execution** — Progress, budget, milestone tracking with status updates (persisted)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DELTA_API_URL` | `http://127.0.0.1:8000` | Backend URL (Next.js server-side) |
| `DELTA_DATA_PATH` | `backend/config/data.json` | JSON database file |
| `DELTA_HOST` / `DELTA_PORT` | `127.0.0.1` / `8000` | API bind address |

`DELTA_CONFIG_PATH` is supported as an alias for `DELTA_DATA_PATH`.

## Production

```bash
# Backend
cd backend && uv sync --no-dev && uv run uvicorn delta_command.main:app --host 0.0.0.0 --port 8000

# Frontend
npm run build && npm start
```

For production at scale, replace the JSON file store with PostgreSQL by extending `delta_command/store.py` — the Pydantic models and API routes can stay the same.
