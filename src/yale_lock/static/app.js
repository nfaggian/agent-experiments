const config = window.DASHBOARD_CONFIG || {};
const refreshMs = Math.max(1000, (config.snapshotRefreshSeconds || 2) * 1000);

const els = {
  connectionPill: document.getElementById("connection-pill"),
  refreshBtn: document.getElementById("refresh-btn"),
  authPanel: document.getElementById("auth-panel"),
  authMessage: document.getElementById("auth-message"),
  loginForm: document.getElementById("login-form"),
  verifyForm: document.getElementById("verify-form"),
  loginUsername: document.getElementById("login-username"),
  loginPassword: document.getElementById("login-password"),
  verifyCode: document.getElementById("verify-code"),
  lockName: document.getElementById("lock-name"),
  lockStatus: document.getElementById("lock-status"),
  doorStatus: document.getElementById("door-status"),
  batteryLevel: document.getElementById("battery-level"),
  lockStatusCard: document.getElementById("lock-status-card"),
  doorStatusCard: document.getElementById("door-status-card"),
  bridgeStatus: document.getElementById("bridge-status"),
  lockUpdated: document.getElementById("lock-updated"),
  lockBtn: document.getElementById("lock-btn"),
  unlockBtn: document.getElementById("unlock-btn"),
  cameraSelect: document.getElementById("camera-select"),
  cameraImage: document.getElementById("camera-image"),
  cameraMessage: document.getElementById("camera-message"),
  cameraStatus: document.getElementById("camera-status"),
  activityList: document.getElementById("activity-list"),
};

let selectedCameraId = null;
let snapshotTimer = null;

function titleCase(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function setPill(text, tone = "neutral") {
  els.connectionPill.textContent = text;
  els.connectionPill.className = `pill pill-${tone}`;
}

function applyStatusCard(card, value) {
  card.classList.remove("locked", "unlocked", "open", "closed");
  if (value) card.classList.add(value);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response;
}

function renderActivities(activities) {
  els.activityList.innerHTML = "";
  if (!activities || activities.length === 0) {
    els.activityList.innerHTML = '<li class="activity-item"><span class="muted">No recent activity</span></li>';
    return;
  }

  for (const activity of activities) {
    const item = document.createElement("li");
    item.className = "activity-item";
    item.innerHTML = `
      <div>
        <strong>${activity.label}</strong>
        <span class="muted">${activity.operator || activity.device_name || "System"}</span>
      </div>
      <span class="muted">${formatTime(activity.timestamp)}</span>
    `;
    els.activityList.appendChild(item);
  }
}

function renderCameraOptions(cameras, selectedId) {
  els.cameraSelect.innerHTML = "";
  if (!cameras || cameras.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No cameras found";
    els.cameraSelect.appendChild(option);
    els.cameraSelect.disabled = true;
    return;
  }

  els.cameraSelect.disabled = false;
  for (const camera of cameras) {
    const option = document.createElement("option");
    option.value = camera.camera_id;
    option.textContent = camera.name;
    option.selected = camera.camera_id === selectedId;
    els.cameraSelect.appendChild(option);
  }
}

function updateCameraSnapshot() {
  if (!selectedCameraId) return;
  const url = `/api/camera/snapshot?camera_id=${encodeURIComponent(selectedCameraId)}&t=${Date.now()}`;
  els.cameraImage.onload = () => {
    els.cameraImage.hidden = false;
    els.cameraMessage.classList.add("hidden");
  };
  els.cameraImage.onerror = () => {
    els.cameraImage.hidden = true;
    els.cameraMessage.textContent = "Unable to load camera snapshot";
    els.cameraMessage.classList.remove("hidden");
  };
  els.cameraImage.src = url;
}

function startSnapshotLoop() {
  if (snapshotTimer) clearInterval(snapshotTimer);
  if (!selectedCameraId) return;
  updateCameraSnapshot();
  snapshotTimer = setInterval(updateCameraSnapshot, refreshMs);
}

function renderStatus(status) {
  const authState = status.auth_state;
  const needsAuth = authState !== "authenticated" && config.yaleConfigured;

  if (needsAuth || authState === "requires_validation") {
    els.authPanel.classList.remove("hidden");
    els.authMessage.textContent = status.auth_message || "Sign in to control your Yale lock.";
    els.verifyForm.classList.toggle("hidden", authState !== "requires_validation");
    els.loginForm.classList.toggle("hidden", authState === "requires_validation");
  } else {
    els.authPanel.classList.add("hidden");
  }

  if (status.authenticated) {
    setPill("Yale connected", "success");
  } else if (config.yaleConfigured) {
    setPill("Yale auth required", "warning");
  } else {
    setPill("Yale not configured", "neutral");
  }

  const lock = status.lock;
  els.lockName.textContent = lock ? lock.name : "No lock selected";
  els.lockStatus.textContent = titleCase(status.lock_status);
  els.doorStatus.textContent = titleCase(status.door_status);
  els.batteryLevel.textContent = lock && lock.battery_level != null ? `${lock.battery_level}%` : "—";
  els.bridgeStatus.textContent = lock ? `Bridge: ${lock.bridge_online ? "Online" : "Offline"}` : "Bridge: —";
  els.lockUpdated.textContent = `Updated: ${formatTime(status.lock_status_updated_at || status.updated_at)}`;

  applyStatusCard(els.lockStatusCard, status.lock_status);
  applyStatusCard(els.doorStatusCard, status.door_status);

  const controlsEnabled = status.authenticated && !!lock;
  els.lockBtn.disabled = !controlsEnabled;
  els.unlockBtn.disabled = !controlsEnabled;

  renderActivities(status.activities);

  const camera = status.camera || {};
  if (!config.unifiConfigured) {
    els.cameraMessage.textContent = "Set UNIFI_HOST, UNIFI_USERNAME, and UNIFI_PASSWORD in .env";
    els.cameraMessage.classList.remove("hidden");
    els.cameraImage.hidden = true;
    return;
  }

  if (!camera.connected) {
    els.cameraMessage.textContent = camera.message || "UniFi Protect unavailable";
    els.cameraMessage.classList.remove("hidden");
    els.cameraImage.hidden = true;
  }

  renderCameraOptions(camera.cameras || [], camera.selected_camera_id);
  selectedCameraId = camera.selected_camera_id || selectedCameraId;
  const active = (camera.cameras || []).find((item) => item.camera_id === selectedCameraId);
  els.cameraStatus.textContent = active
    ? `Status: ${active.is_connected ? "Connected" : "Offline"}${active.is_motion_detected ? " · Motion" : ""}`
    : "Status: —";

  if (camera.connected && selectedCameraId) {
    startSnapshotLoop();
  }
}

async function refreshStatus() {
  const status = await api("/api/refresh", { method: "POST" });
  renderStatus(status);
}

function connectEvents() {
  const source = new EventSource("/api/events");
  source.onmessage = (event) => {
    renderStatus(JSON.parse(event.data));
  };
  source.onerror = () => {
    setPill("Live updates paused", "warning");
  };
}

els.refreshBtn.addEventListener("click", () => {
  refreshStatus().catch((error) => setPill(error.message, "danger"));
});

els.lockBtn.addEventListener("click", async () => {
  try {
    const result = await api("/api/lock", { method: "POST" });
    if (result.status) renderStatus(result.status);
  } catch (error) {
    setPill(error.message, "danger");
  }
});

els.unlockBtn.addEventListener("click", async () => {
  try {
    const result = await api("/api/unlock", { method: "POST" });
    if (result.status) renderStatus(result.status);
  } catch (error) {
    setPill(error.message, "danger");
  }
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const status = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: els.loginUsername.value,
        password: els.loginPassword.value,
        login_method: "email",
      }),
    });
    renderStatus(status);
  } catch (error) {
    els.authMessage.textContent = error.message;
  }
});

els.verifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const status = await api("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code: els.verifyCode.value }),
    });
    renderStatus(status);
  } catch (error) {
    els.authMessage.textContent = error.message;
  }
});

els.cameraSelect.addEventListener("change", async () => {
  selectedCameraId = els.cameraSelect.value;
  try {
    await api(`/api/cameras/${encodeURIComponent(selectedCameraId)}/select`, { method: "POST" });
    startSnapshotLoop();
  } catch (error) {
    els.cameraMessage.textContent = error.message;
    els.cameraMessage.classList.remove("hidden");
  }
});

async function init() {
  try {
    const status = await api("/api/status");
    renderStatus(status);
    connectEvents();
  } catch (error) {
    setPill(error.message, "danger");
  }
}

init();
