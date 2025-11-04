"""Discover and register all Prefect flows from the workflows package."""

import importlib
import inspect
import pkgutil
from pathlib import Path
from typing import Any

from prefect import flow


def discover_flows(package_name: str = "workflows") -> list[Any]:
    """
    Discover all Prefect flows in the workflows package.

    Args:
        package_name: Name of the package to search for flows

    Returns:
        List of discovered flow functions
    """
    flows: list[Any] = []
    package_path = Path(__file__).parent

    # Import the package
    try:
        package = importlib.import_module(package_name)
    except ImportError:
        return flows

    # Walk through all modules in the package
    for _, modname, ispkg in pkgutil.walk_packages(
        [str(package_path)], prefix=f"{package_name}."
    ):
        if ispkg:
            continue

        try:
            module = importlib.import_module(modname)
            # Find all flows in the module
            for name, obj in inspect.getmembers(module):
                if inspect.isfunction(obj) and hasattr(obj, "__prefect_flow__"):
                    # This is a Prefect flow
                    flows.append(obj)
        except Exception:
            # Skip modules that can't be imported
            continue

    return flows


if __name__ == "__main__":
    # Discover and print flows
    discovered_flows = discover_flows()
    print(f"Discovered {len(discovered_flows)} flow(s):")
    for flow_func in discovered_flows:
        print(f"  - {flow_func.__name__} ({flow_func.__module__})")

