# Delta Command Backend

Python API for Delta Command, backed by a single JSON file database.

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

All data is stored in **`config/data.json`** — one file for reads and writes.

UI changes (opportunity stages, project status, utilization timeline) persist directly to this file.

Override the path with `DELTA_DATA_PATH`.

Persistence uses atomic JSON writes via `delta_command/json_db.py`.
