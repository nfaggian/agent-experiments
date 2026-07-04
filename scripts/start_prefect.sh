#!/bin/bash
# Start Prefect server and serve flows

set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Default port
PREFECT_PORT=${PREFECT_PORT:-4200}
PREFECT_API_URL="http://127.0.0.1:${PREFECT_PORT}/api"

# Check if port is already in use
if lsof -Pi :${PREFECT_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port ${PREFECT_PORT} is already in use."
    echo "   Either stop the existing process or set PREFECT_PORT to a different value."
    echo "   Example: PREFECT_PORT=4201 ./scripts/start_prefect.sh"
    exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
    echo "❌ uv is not installed."
    echo "   Install: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

uv sync --quiet
VENV_PYTHON="$(uv run python -c 'import sys; print(sys.executable)')"

# Export environment variables
export PREFECT_SERVER_UI_SHOW_PROMOTIONAL_CONTENT=false
export PREFECT_API_URL="${PREFECT_API_URL}"
export PYTHONPATH="$PROJECT_ROOT/src:$PYTHONPATH"

# Set Prefect profile to use the API URL and Python interpreter
echo "🔧 Configuring Prefect profile..."
uv run prefect config set PREFECT_API_URL="${PREFECT_API_URL}" || true
uv run prefect config set PREFECT_PYTHON_PATH="${VENV_PYTHON}" || true

# Start Prefect server in background
echo "🚀 Starting Prefect server on port ${PREFECT_PORT}..."
uv run prefect server start --host 0.0.0.0 --port ${PREFECT_PORT} > /tmp/prefect_server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for Prefect server to start..."
MAX_WAIT=30
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -s "${PREFECT_API_URL}/health" > /dev/null 2>&1; then
        echo "✅ Prefect server is ready!"
        break
    fi
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
    echo -n "."
done
echo ""

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Prefect server failed to start"
    echo "📋 Server logs:"
    tail -20 /tmp/prefect_server.log
    exit 1
fi

# Final health check
if ! curl -s "${PREFECT_API_URL}/health" > /dev/null 2>&1; then
    echo "❌ Prefect server did not become ready within ${MAX_WAIT} seconds"
    echo "📋 Server logs:"
    tail -20 /tmp/prefect_server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Prefect server is running (PID: $SERVER_PID)"
echo "🚀 Serving Prefect flows from src/workflows..."
echo "📝 UI available at http://127.0.0.1:${PREFECT_PORT}"
echo "🔗 API available at ${PREFECT_API_URL}"

# Serve flows (this will block)
# Use the virtual environment's Python explicitly via uv run
uv run prefect flow serve src/workflows/pipeline.py:agent_workflow --name agent-workflow

