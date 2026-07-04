"""FastAPI voice server for iPhone and browser clients."""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.genai.types import Blob, Content, Part

AGENTS_DIR = Path(__file__).resolve().parents[1] / "agents"
if str(AGENTS_DIR) not in sys.path:
    sys.path.insert(0, str(AGENTS_DIR))

from home_agent.agent import root_agent  # noqa: E402

load_dotenv()

APP_NAME = "home_voice_agent"
STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Home Voice Agent")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

runner = InMemoryRunner(app_name=APP_NAME, agent=root_agent)


async def start_agent_session(user_id: str, is_audio: bool = False) -> tuple[object, LiveRequestQueue]:
    session = await runner.session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
    )
    modality = "AUDIO" if is_audio else "TEXT"
    run_config = RunConfig(response_modalities=[modality])
    live_request_queue = LiveRequestQueue()
    live_events = runner.run_live(
        session=session,
        live_request_queue=live_request_queue,
        run_config=run_config,
    )
    return live_events, live_request_queue


async def agent_to_client_messaging(websocket: WebSocket, live_events: object) -> None:
    async for event in live_events:
        if event.turn_complete or event.interrupted:
            message = {
                "turn_complete": event.turn_complete,
                "interrupted": event.interrupted,
            }
            await websocket.send_text(json.dumps(message))
            continue

        part = event.content and event.content.parts and event.content.parts[0]
        if not part:
            continue

        is_audio = part.inline_data and part.inline_data.mime_type.startswith("audio/pcm")
        if is_audio:
            audio_data = part.inline_data and part.inline_data.data
            if audio_data:
                message = {
                    "mime_type": "audio/pcm",
                    "data": base64.b64encode(audio_data).decode("ascii"),
                }
                await websocket.send_text(json.dumps(message))
            continue

        if part.text and event.partial:
            message = {"mime_type": "text/plain", "data": part.text}
            await websocket.send_text(json.dumps(message))


async def client_to_agent_messaging(
    websocket: WebSocket,
    live_request_queue: LiveRequestQueue,
) -> None:
    while True:
        message_json = await websocket.receive_text()
        message = json.loads(message_json)
        mime_type = message["mime_type"]
        data = message["data"]

        if mime_type == "text/plain":
            content = Content(role="user", parts=[Part.from_text(text=data)])
            live_request_queue.send_content(content=content)
        elif mime_type == "audio/pcm":
            decoded_data = base64.b64decode(data)
            live_request_queue.send_realtime(Blob(data=decoded_data, mime_type=mime_type))
        else:
            raise ValueError(f"Mime type not supported: {mime_type}")


@app.get("/")
async def root() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/manifest.json")
async def manifest() -> FileResponse:
    return FileResponse(STATIC_DIR / "manifest.json")


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, is_audio: str = "false") -> None:
    await websocket.accept()
    live_events, live_request_queue = await start_agent_session(
        user_id,
        is_audio == "true",
    )

    agent_task = asyncio.create_task(agent_to_client_messaging(websocket, live_events))
    client_task = asyncio.create_task(client_to_agent_messaging(websocket, live_request_queue))
    await asyncio.wait([agent_task, client_task], return_when=asyncio.FIRST_EXCEPTION)
    live_request_queue.close()


def main() -> None:
    import uvicorn

    host = os.getenv("VOICE_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("VOICE_SERVER_PORT", "8000"))
    uvicorn.run("server.voice_server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
