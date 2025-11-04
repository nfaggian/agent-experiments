"""Entry point for serving Prefect flows from the workflows package.

This module imports all flows to ensure they are registered with Prefect.
Run this with: prefect flow serve src/workflows/serve.py

To add new flows:
1. Create a new flow in workflows/pipeline.py (or a new module)
2. Import it here: from workflows.module_name import flow_name
3. Add it to __all__: __all__ = ["agent_workflow", "flow_name"]
"""

# Import all flows to register them
from workflows.pipeline import agent_workflow  # noqa: F401

# This makes flows discoverable when running `prefect flow serve`
# Add new flows here as you create them
__all__ = ["agent_workflow"]

# Ensure flows are available at module level for discovery
if __name__ == "__main__":
    # This allows direct execution and ensures flows are registered
    pass

