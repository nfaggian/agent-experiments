/**
 * Home Voice Agent client for iPhone Safari and desktop browsers.
 */

const sessionId = Math.random().toString().substring(2, 12);
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${window.location.host}/ws/${sessionId}`;

let websocket = null;
let isAudio = false;
let currentMessageId = null;

let audioPlayerNode;
let audioPlayerContext;
let audioRecorderNode;
let audioRecorderContext;
let micStream;

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
const startAudioButton = document.getElementById("startAudioButton");

import { startAudioPlayerWorklet } from "./audio-player.js";
import { startAudioRecorderWorklet } from "./audio-recorder.js";

function connectWebsocket() {
  websocket = new WebSocket(`${wsUrl}?is_audio=${isAudio}`);

  websocket.onopen = function () {
    document.getElementById("sendButton").disabled = false;
    messagesDiv.textContent = "Connected. Ask me to control your home.";
    addSubmitHandler();
  };

  websocket.onmessage = function (event) {
    const messageFromServer = JSON.parse(event.data);

    if (messageFromServer.turn_complete === true) {
      currentMessageId = null;
      return;
    }

    if (messageFromServer.interrupted === true) {
      if (audioPlayerNode) {
        audioPlayerNode.port.postMessage({ command: "endOfAudio" });
      }
      return;
    }

    if (messageFromServer.mime_type === "audio/pcm" && audioPlayerNode) {
      audioPlayerNode.port.postMessage(base64ToArray(messageFromServer.data));
    }

    if (messageFromServer.mime_type === "text/plain") {
      if (currentMessageId == null) {
        currentMessageId = Math.random().toString(36).substring(7);
        const message = document.createElement("p");
        message.id = currentMessageId;
        messagesDiv.appendChild(message);
      }
      const message = document.getElementById(currentMessageId);
      message.textContent += messageFromServer.data;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  };

  websocket.onclose = function () {
    document.getElementById("sendButton").disabled = true;
    messagesDiv.textContent = "Connection closed. Reconnecting...";
    setTimeout(connectWebsocket, 3000);
  };
}

connectWebsocket();

function addSubmitHandler() {
  messageForm.onsubmit = function (event) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) {
      return false;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = `> ${message}`;
    messagesDiv.appendChild(paragraph);
    messageInput.value = "";
    sendMessage({ mime_type: "text/plain", data: message });
    return false;
  };
}

function sendMessage(message) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  }
}

function base64ToArray(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window.btoa(binary);
}

function audioRecorderHandler(pcmData) {
  sendMessage({
    mime_type: "audio/pcm",
    data: arrayBufferToBase64(pcmData),
  });
}

function startAudio() {
  startAudioPlayerWorklet().then(([node, context]) => {
    audioPlayerNode = node;
    audioPlayerContext = context;
  });
  startAudioRecorderWorklet(audioRecorderHandler).then(([node, context, stream]) => {
    audioRecorderNode = node;
    audioRecorderContext = context;
    micStream = stream;
  });
}

startAudioButton.addEventListener("click", () => {
  startAudioButton.disabled = true;
  startAudioButton.textContent = "Voice Active";
  startAudio();
  isAudio = true;
  connectWebsocket();
});
