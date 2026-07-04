#!/usr/bin/env bash
# Run the home dashboard with secrets injected by the 1Password CLI.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

ENV_FILE="${ONEPASSWORD_ENV_FILE:-.env.1password}"
OP_ARGS=()

if ! command -v op >/dev/null 2>&1; then
    echo "❌ 1Password CLI (op) is not installed."
    echo "   Install: https://developer.1password.com/docs/cli/get-started/"
    exit 1
fi

if ! op account list >/dev/null 2>&1; then
    echo "❌ Not signed in to 1Password. Run: op signin"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file not found: $ENV_FILE"
    echo "   Copy .env.1password.example to $ENV_FILE and set your op:// references."
    exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
    echo "❌ uv is not installed."
    echo "   Install: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

uv sync --quiet

if [[ -n "${ONEPASSWORD_ENVIRONMENT:-}" ]]; then
    OP_ARGS+=(--environment "$ONEPASSWORD_ENVIRONMENT")
fi

echo "🔐 Starting home dashboard with 1Password secrets ($ENV_FILE)..."
exec op run "${OP_ARGS[@]}" --env-file="$ENV_FILE" -- uv run home-dashboard
