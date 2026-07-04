"""Server entry point for the Home Security Mobile API."""

import uvicorn


def main() -> None:
    """Run the Home Security Mobile API server."""
    uvicorn.run(
        "src.mobile_api.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
