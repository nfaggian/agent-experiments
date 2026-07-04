"""CLI entry point for the home dashboard."""

from __future__ import annotations

import uvicorn

from yale_lock.config import Settings
from yale_lock.server import create_app


def main() -> None:
    settings = Settings()
    app = create_app(settings)
    uvicorn.run(
        app,
        host=settings.dashboard_host,
        port=settings.dashboard_port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
