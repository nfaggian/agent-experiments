# Delta Command Backend

Python API for Delta Command, backed by a JSON file database.

## Setup

```bash
cd apps/delta-command/backend
uv sync
```

## Run

```bash
uv run delta-command
```

API available at http://127.0.0.1:8000

## Database

- **Seed:** `config/data.json` — edit to customize engineers, opportunities, and projects
- **Runtime:** `config/runtime.json` — live database (gitignored, created automatically)
- **Reset:** `POST /api/reset` reloads runtime from seed

Persistence uses atomic JSON writes via `delta_command/json_db.py`.
