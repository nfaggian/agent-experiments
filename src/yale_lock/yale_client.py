"""Yale smart lock client wrapper."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from aiohttp import ClientSession
from yalexs.api_async import ApiAsync
from yalexs.authenticator_async import AuthenticationState, AuthenticatorAsync
from yalexs.lock import LockDoorStatus, LockStatus

from yale_lock.config import Settings
from yale_lock.models import (
    ActivityView,
    AuthState,
    DoorStatusView,
    LockInfo,
    LockStatusView,
    serialize_activity,
)

if TYPE_CHECKING:
    from yalexs.activity import ActivityTypes
    from yalexs.lock import Lock, LockDetail

_LOGGER = logging.getLogger(__name__)

_LOCK_STATUS_MAP = {
    LockStatus.LOCKED: LockStatusView.LOCKED,
    LockStatus.UNLOCKED: LockStatusView.UNLOCKED,
    LockStatus.LOCKING: LockStatusView.LOCKING,
    LockStatus.UNLOCKING: LockStatusView.UNLOCKING,
    LockStatus.UNLATCHED: LockStatusView.UNLATCHED,
    LockStatus.UNLATCHING: LockStatusView.UNLATCHING,
    LockStatus.JAMMED: LockStatusView.JAMMED,
    LockStatus.UNKNOWN: LockStatusView.UNKNOWN,
}

_DOOR_STATUS_MAP = {
    LockDoorStatus.OPEN: DoorStatusView.OPEN,
    LockDoorStatus.CLOSED: DoorStatusView.CLOSED,
    LockDoorStatus.UNKNOWN: DoorStatusView.UNKNOWN,
    LockDoorStatus.DISABLED: DoorStatusView.DISABLED,
}


class YaleLockClient:
    """Async wrapper around the yalexs library."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._session: ClientSession | None = None
        self._api: ApiAsync | None = None
        self._authenticator: AuthenticatorAsync | None = None
        self._access_token: str | None = None
        self._auth_state = AuthState.NOT_CONFIGURED
        self._auth_message: str | None = None
        self._lock: Lock | None = None
        self._lock_detail: LockDetail | None = None
        self._activities: list[ActivityView] = []
        self._lock_status = LockStatusView.UNKNOWN
        self._door_status = DoorStatusView.UNKNOWN
        self._lock_status_updated_at: datetime | None = None
        self._door_status_updated_at: datetime | None = None
        self._poll_task: asyncio.Task[None] | None = None
        self._refresh_lock = asyncio.Lock()

    @property
    def auth_state(self) -> AuthState:
        return self._auth_state

    @property
    def auth_message(self) -> str | None:
        return self._auth_message

    @property
    def is_authenticated(self) -> bool:
        return self._auth_state == AuthState.AUTHENTICATED

    async def start(self) -> None:
        if not self._settings.yale_configured:
            self._auth_state = AuthState.NOT_CONFIGURED
            self._auth_message = "Set YALE_USERNAME and YALE_PASSWORD in .env"
            return

        await self._ensure_session()
        await self._setup_authenticator()
        await self.authenticate()
        if self.is_authenticated:
            await self.refresh()
            self._poll_task = asyncio.create_task(self._poll_loop())

    async def stop(self) -> None:
        if self._poll_task:
            self._poll_task.cancel()
            try:
                await self._poll_task
            except asyncio.CancelledError:
                pass
            self._poll_task = None

        if self._session and not self._session.closed:
            await self._session.close()
        self._session = None
        self._api = None
        self._authenticator = None

    async def _ensure_session(self) -> None:
        if self._session is None or self._session.closed:
            self._session = ClientSession()
            self._api = ApiAsync(
                self._session,
                timeout=20,
                brand=self._settings.yale_brand_enum,
            )

    async def _setup_authenticator(self) -> None:
        if self._api is None:
            await self._ensure_session()
        assert self._api is not None

        self._authenticator = AuthenticatorAsync(
            self._api,
            self._settings.yale_login_method,
            self._settings.yale_username,
            self._settings.yale_password,
            access_token_cache_file=str(self._settings.yale_auth_cache_file),
        )
        await self._authenticator.async_setup_authentication()

    async def authenticate(self) -> AuthState:
        if not self._settings.yale_configured:
            self._auth_state = AuthState.NOT_CONFIGURED
            return self._auth_state

        try:
            await self._ensure_session()
            await self._setup_authenticator()
            assert self._authenticator is not None

            authentication = await self._authenticator.async_authenticate()
            if authentication.state is AuthenticationState.AUTHENTICATED:
                self._access_token = authentication.access_token
                self._auth_state = AuthState.AUTHENTICATED
                self._auth_message = None
            elif authentication.state is AuthenticationState.REQUIRES_VALIDATION:
                self._auth_state = AuthState.REQUIRES_VALIDATION
                self._auth_message = "Enter the verification code sent to your email or phone."
            elif authentication.state is AuthenticationState.BAD_PASSWORD:
                self._auth_state = AuthState.BAD_PASSWORD
                self._auth_message = "Invalid Yale credentials."
            else:
                self._auth_state = AuthState.REQUIRES_AUTHENTICATION
                self._auth_message = "Yale authentication required."
        except Exception as exc:
            _LOGGER.exception("Yale authentication failed")
            self._auth_state = AuthState.ERROR
            self._auth_message = str(exc)

        return self._auth_state

    async def send_verification_code(self) -> bool:
        if self._authenticator is None:
            await self._setup_authenticator()
        assert self._authenticator is not None
        return bool(await self._authenticator.async_send_verification_code())

    async def validate_verification_code(self, code: str) -> AuthState:
        if self._authenticator is None:
            await self._setup_authenticator()
        assert self._authenticator is not None

        await self._authenticator.async_validate_verification_code(code)
        return await self.authenticate()

    async def login(self, username: str, password: str, login_method: str = "email") -> AuthState:
        self._settings.yale_username = username
        self._settings.yale_password = password
        self._settings.yale_login_method = login_method
        self._authenticator = None
        state = await self.authenticate()
        if self.is_authenticated:
            await self.refresh()
            if self._poll_task is None:
                self._poll_task = asyncio.create_task(self._poll_loop())
        return state

    async def _get_access_token(self) -> str:
        if not self._access_token:
            await self.authenticate()
        if not self._access_token:
            raise RuntimeError("Not authenticated with Yale")
        return self._access_token

    async def _resolve_lock(self) -> Lock:
        api = self._api
        if api is None:
            raise RuntimeError("Yale API not initialized")

        access_token = await self._get_access_token()
        locks = await api.async_get_locks(access_token)
        if not locks:
            raise RuntimeError("No Yale locks found on this account")

        if self._settings.yale_lock_id:
            for lock in locks:
                if lock.device_id == self._settings.yale_lock_id:
                    self._lock = lock
                    return lock
            raise RuntimeError(f"Lock {self._settings.yale_lock_id} not found")

        self._lock = locks[0]
        return locks[0]

    async def refresh(self) -> None:
        if not self.is_authenticated:
            return

        async with self._refresh_lock:
            api = self._api
            if api is None:
                return

            access_token = await self._get_access_token()
            lock = await self._resolve_lock()
            detail = await api.async_get_lock_detail(access_token, lock)
            self._lock_detail = detail

            door_status, lock_status = await api.async_get_lock_door_status(
                access_token,
                lock.device_id,
                lock_status=True,
            )
            self._lock_status = _LOCK_STATUS_MAP.get(lock_status, LockStatusView.UNKNOWN)
            self._door_status = _DOOR_STATUS_MAP.get(door_status, DoorStatusView.UNKNOWN)
            now = datetime.now(tz=UTC)
            self._lock_status_updated_at = now
            if detail.doorsense:
                self._door_status_updated_at = now

            raw_activities: list[ActivityTypes] = await api.async_get_house_activities(
                access_token,
                lock.house_id,
                limit=self._settings.yale_activity_limit,
            )
            lock_id = lock.device_id
            filtered = [
                activity
                for activity in raw_activities
                if activity.device_id == lock_id or activity.device_id is None
            ]
            self._activities = [serialize_activity(activity) for activity in filtered]

    async def lock_door(self) -> None:
        api = self._api
        if api is None:
            raise RuntimeError("Yale API not initialized")

        access_token = await self._get_access_token()
        lock = await self._resolve_lock()
        await api.async_lock(access_token, lock.device_id)
        await self.refresh()

    async def unlock_door(self) -> None:
        api = self._api
        if api is None:
            raise RuntimeError("Yale API not initialized")

        access_token = await self._get_access_token()
        lock = await self._resolve_lock()
        await api.async_unlock(access_token, lock.device_id)
        await self.refresh()

    def get_lock_info(self) -> LockInfo | None:
        if self._lock is None or self._lock_detail is None:
            return None

        return LockInfo(
            lock_id=self._lock.device_id,
            name=self._lock.device_name,
            house_id=self._lock.house_id,
            battery_level=self._lock_detail.battery_level,
            bridge_online=self._lock_detail.bridge_is_online,
            doorsense=self._lock_detail.doorsense,
        )

    def get_activities(self) -> list[ActivityView]:
        return list(self._activities)

    def get_lock_status(self) -> LockStatusView:
        return self._lock_status

    def get_door_status(self) -> DoorStatusView:
        return self._door_status

    def get_lock_status_updated_at(self) -> datetime | None:
        return self._lock_status_updated_at

    def get_door_status_updated_at(self) -> datetime | None:
        return self._door_status_updated_at

    async def _poll_loop(self) -> None:
        while True:
            try:
                await asyncio.sleep(self._settings.yale_poll_interval_seconds)
                await self.refresh()
            except asyncio.CancelledError:
                raise
            except Exception:
                _LOGGER.exception("Yale poll failed")
