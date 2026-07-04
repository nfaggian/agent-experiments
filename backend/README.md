# Delta Command Backend

Python API for Delta Command, backed by YAML configuration.

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

## Configuration

Edit `config/data.yaml` to customize engineers, opportunities, and projects.
Runtime mutations are persisted to `config/runtime.yaml`.
Call `POST /api/reset` to reload from `data.yaml`.
