"""UniFi Protect camera client wrapper."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from uiprotect import ProtectApiClient

from yale_lock.config import Settings
from yale_lock.models import CameraInfo, CameraStatus

if TYPE_CHECKING:
    from uiprotect.data.devices import Camera

_LOGGER = logging.getLogger(__name__)


class UniFiCameraClient:
    """Async wrapper around the uiprotect library."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: ProtectApiClient | None = None
        self._connected = False
        self._message: str | None = None
        self._cameras: list[CameraInfo] = []
        self._selected_camera_id: str | None = None
        self._connect_lock = asyncio.Lock()

    @property
    def configured(self) -> bool:
        return self._settings.unifi_configured

    @property
    def connected(self) -> bool:
        return self._connected

    async def start(self) -> None:
        if not self.configured:
            self._message = "Set UNIFI_HOST, UNIFI_USERNAME, and UNIFI_PASSWORD in .env"
            return
        await self.connect()

    async def stop(self) -> None:
        if self._client is not None:
            await self._client.close_session()
        self._client = None
        self._connected = False

    async def connect(self) -> bool:
        if not self.configured:
            self._message = "UniFi Protect is not configured"
            return False

        async with self._connect_lock:
            try:
                api_key = self._settings.unifi_api_key or None
                self._client = ProtectApiClient(
                    self._settings.unifi_host,
                    self._settings.unifi_port,
                    self._settings.unifi_username,
                    self._settings.unifi_password,
                    api_key=api_key,
                    verify_ssl=self._settings.unifi_verify_ssl,
                )
                await self._client.update()
                self._connected = True
                self._message = None
                await self._refresh_cameras()
                return True
            except Exception as exc:
                _LOGGER.exception("UniFi Protect connection failed")
                self._connected = False
                self._message = str(exc)
                return False

    async def _refresh_cameras(self) -> None:
        if self._client is None or not self._connected:
            return

        cameras = list(self._client.bootstrap.cameras.values())
        self._cameras = [self._serialize_camera(camera) for camera in cameras]

        if self._settings.unifi_camera_id:
            if any(camera.camera_id == self._settings.unifi_camera_id for camera in self._cameras):
                self._selected_camera_id = self._settings.unifi_camera_id
            elif self._cameras:
                self._selected_camera_id = self._cameras[0].camera_id
        elif self._cameras and not self._selected_camera_id:
            self._selected_camera_id = self._cameras[0].camera_id

    def _serialize_camera(self, camera: Camera) -> CameraInfo:
        return CameraInfo(
            camera_id=camera.id,
            name=camera.name or "Camera",
            is_connected=camera.is_connected,
            is_recording=camera.is_recording,
            is_motion_detected=camera.is_motion_detected,
            last_motion=camera.last_motion,
        )

    def get_status(self) -> CameraStatus:
        return CameraStatus(
            configured=self.configured,
            connected=self._connected,
            message=self._message,
            cameras=self._cameras,
            selected_camera_id=self._selected_camera_id,
        )

    def select_camera(self, camera_id: str) -> bool:
        if any(camera.camera_id == camera_id for camera in self._cameras):
            self._selected_camera_id = camera_id
            return True
        return False

    async def get_snapshot(self, camera_id: str | None = None) -> bytes | None:
        if self._client is None or not self._connected:
            connected = await self.connect()
            if not connected:
                return None

        assert self._client is not None
        target_id = camera_id or self._selected_camera_id
        if not target_id:
            await self._refresh_cameras()
            target_id = self._selected_camera_id
        if not target_id:
            return None

        return await self._client.get_camera_snapshot(
            target_id,
            width=self._settings.unifi_snapshot_width,
            height=self._settings.unifi_snapshot_height,
        )

    async def refresh(self) -> None:
        if self._client is None or not self._connected:
            await self.connect()
            return
        await self._refresh_cameras()
