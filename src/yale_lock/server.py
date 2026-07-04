"""FastAPI application for Yale lock and UniFi camera dashboard."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from yale_lock.config import Settings
from yale_lock.models import (
    AmbienceSnapshot,
    AuthState,
    CredentialsRequest,
    OperationResult,
    StatusSnapshot,
    VerificationRequest,
)
from yale_lock.unifi_client import UniFiCameraClient
from yale_lock.weather import WeatherService
from yale_lock.yale_client import YaleLockClient

_LOGGER = logging.getLogger(__name__)
APP_DIR = Path(__file__).resolve().parent


class DashboardApp:
    """Coordinates Yale and UniFi clients for the web dashboard."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.yale = YaleLockClient(settings)
        self.unifi = UniFiCameraClient(settings)
        self.weather = WeatherService(settings)
        self._status_subscribers: set[asyncio.Queue[StatusSnapshot]] = set()
        self._weather_task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        await self.yale.start()
        await self.unifi.start()
        await self.weather.refresh()
        self._weather_task = asyncio.create_task(self._weather_loop())

    async def stop(self) -> None:
        if self._weather_task:
            self._weather_task.cancel()
            try:
                await self._weather_task
            except asyncio.CancelledError:
                pass
            self._weather_task = None
        await self.yale.stop()
        await self.unifi.stop()

    async def _weather_loop(self) -> None:
        while True:
            try:
                await asyncio.sleep(self.settings.weather_refresh_seconds)
                await self.weather.refresh()
            except asyncio.CancelledError:
                raise
            except Exception:
                _LOGGER.exception("Weather poll failed")

    def build_status(self) -> StatusSnapshot:
        return StatusSnapshot(
            authenticated=self.yale.is_authenticated,
            auth_state=self.yale.auth_state,
            auth_message=self.yale.auth_message,
            lock=self.yale.get_lock_info(),
            lock_status=self.yale.get_lock_status(),
            door_status=self.yale.get_door_status(),
            lock_status_updated_at=self.yale.get_lock_status_updated_at(),
            door_status_updated_at=self.yale.get_door_status_updated_at(),
            activities=self.yale.get_activities(),
            camera=self.unifi.get_status(),
            updated_at=datetime.now(tz=UTC),
        )

    async def refresh_all(self) -> StatusSnapshot:
        if self.yale.is_authenticated:
            await self.yale.refresh()
        await self.unifi.refresh()
        status = self.build_status()
        await self._broadcast(status)
        return status

    async def _broadcast(self, status: StatusSnapshot) -> None:
        for queue in list(self._status_subscribers):
            try:
                queue.put_nowait(status)
            except asyncio.QueueFull:
                self._status_subscribers.discard(queue)

    def subscribe(self) -> asyncio.Queue[StatusSnapshot]:
        queue: asyncio.Queue[StatusSnapshot] = asyncio.Queue(maxsize=8)
        self._status_subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[StatusSnapshot]) -> None:
        self._status_subscribers.discard(queue)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    dashboard = DashboardApp(settings)
    templates = Jinja2Templates(directory=str(APP_DIR / "templates"))

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await dashboard.start()
        yield
        await dashboard.stop()

    app = FastAPI(
        title="Home Dashboard",
        description="Yale lock and UniFi camera dashboard",
        lifespan=lifespan,
    )
    app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")
    app.state.dashboard = dashboard
    app.state.templates = templates
    app.state.settings = settings

    @app.get("/", response_class=HTMLResponse)
    async def index(request: Request) -> HTMLResponse:
        status = dashboard.build_status()
        return templates.TemplateResponse(
            request,
            "index.html",
            {
                "status": status,
                "settings": settings,
            },
        )

    @app.get("/api/status", response_model=StatusSnapshot)
    async def get_status() -> StatusSnapshot:
        return dashboard.build_status()

    @app.post("/api/refresh", response_model=StatusSnapshot)
    async def refresh_status() -> StatusSnapshot:
        return await dashboard.refresh_all()

    @app.post("/api/lock", response_model=OperationResult)
    async def lock_door() -> OperationResult:
        try:
            await dashboard.yale.lock_door()
            status = dashboard.build_status()
            await dashboard._broadcast(status)
            return OperationResult(success=True, message="Lock command sent.", status=status)
        except Exception as exc:
            _LOGGER.exception("Lock command failed")
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/unlock", response_model=OperationResult)
    async def unlock_door() -> OperationResult:
        try:
            await dashboard.yale.unlock_door()
            status = dashboard.build_status()
            await dashboard._broadcast(status)
            return OperationResult(success=True, message="Unlock command sent.", status=status)
        except Exception as exc:
            _LOGGER.exception("Unlock command failed")
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/auth/login", response_model=StatusSnapshot)
    async def login(payload: CredentialsRequest) -> StatusSnapshot:
        state = await dashboard.yale.login(
            payload.username,
            payload.password,
            payload.login_method,
        )
        if state == AuthState.REQUIRES_VALIDATION:
            await dashboard.yale.send_verification_code()
        if dashboard.yale.is_authenticated:
            await dashboard.unifi.refresh()
        status = dashboard.build_status()
        await dashboard._broadcast(status)
        return status

    @app.post("/api/auth/verify", response_model=StatusSnapshot)
    async def verify(payload: VerificationRequest) -> StatusSnapshot:
        await dashboard.yale.validate_verification_code(payload.code)
        if dashboard.yale.is_authenticated:
            await dashboard.yale.refresh()
        status = dashboard.build_status()
        await dashboard._broadcast(status)
        return status

    @app.post("/api/auth/send-code")
    async def send_code() -> dict[str, bool]:
        sent = await dashboard.yale.send_verification_code()
        return {"sent": sent}

    @app.get("/api/cameras")
    async def list_cameras() -> dict[str, object]:
        await dashboard.unifi.refresh()
        status = dashboard.unifi.get_status()
        return status.model_dump()

    @app.post("/api/cameras/{camera_id}/select")
    async def select_camera(camera_id: str) -> dict[str, object]:
        if not dashboard.unifi.select_camera(camera_id):
            raise HTTPException(status_code=404, detail="Camera not found")
        status = dashboard.unifi.get_status()
        return status.model_dump()

    @app.get("/api/camera/snapshot")
    async def camera_snapshot(camera_id: str | None = None) -> Response:
        snapshot = await dashboard.unifi.get_snapshot(camera_id)
        if snapshot is None:
            raise HTTPException(status_code=503, detail="Camera snapshot unavailable")
        return Response(content=snapshot, media_type="image/jpeg")

    @app.get("/api/ambience", response_model=AmbienceSnapshot)
    async def get_ambience() -> AmbienceSnapshot:
        return dashboard.weather.snapshot

    @app.post("/api/ambience/refresh", response_model=AmbienceSnapshot)
    async def refresh_ambience() -> AmbienceSnapshot:
        return await dashboard.weather.refresh()

    @app.get("/api/events")
    async def event_stream() -> StreamingResponse:
        queue = dashboard.subscribe()

        async def generator() -> AsyncIterator[str]:
            try:
                initial = dashboard.build_status()
                yield f"data: {initial.model_dump_json()}\n\n"
                while True:
                    status = await queue.get()
                    yield f"data: {status.model_dump_json()}\n\n"
            finally:
                dashboard.unsubscribe(queue)

        return StreamingResponse(
            generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    return app


app = create_app()
