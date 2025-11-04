#!/bin/bash
# Start Prefect server and serve flows

set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Export environment variable
export PREFECT_SERVER_UI_SHOW_PROMOTIONAL_CONTENT=false
export PYTHONPATH="$PROJECT_ROOT/src:$PYTHONPATH"

# Start Prefect server in background
echo "🚀 Starting Prefect server..."
uv run prefect server start --host 0.0.0.0 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for Prefect server to start..."
sleep 5

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Prefect server failed to start"
    exit 1
fi

echo "✅ Prefect server is running (PID: $SERVER_PID)"
echo "🚀 Serving Prefect flows from src/workflows..."
echo "📝 Flows will be available at http://127.0.0.1:4200"

# Serve flows (this will block)
uv run prefect flow serve src/workflows/serve.py --host 0.0.0.0

