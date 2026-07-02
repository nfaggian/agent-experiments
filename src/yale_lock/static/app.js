const config = window.DASHBOARD_CONFIG || {};
const refreshMs = Math.max(1000, (config.snapshotRefreshSeconds || 2) * 1000);
const weatherRefreshMs = Math.max(60000, (config.weatherRefreshSeconds || 900) * 1000);
const THEME_STORAGE_KEY = "home-dashboard-theme";

const els = {
  skyBackground: document.getElementById("sky-background"),
  weatherChip: document.getElementById("weather-chip"),
  weatherIcon: document.getElementById("weather-icon"),
  weatherLabel: document.getElementById("weather-label"),
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
  bridgeDot: document.getElementById("bridge-dot"),
  lockUpdated: document.getElementById("lock-updated"),
  lockBtn: document.getElementById("lock-btn"),
  unlockBtn: document.getElementById("unlock-btn"),
  cameraSelect: document.getElementById("camera-select"),
  cameraImage: document.getElementById("camera-image"),
  cameraMessage: document.getElementById("camera-message"),
  cameraStatus: document.getElementById("camera-status"),
  activityList: document.getElementById("activity-list"),
  themeLight: document.getElementById("theme-light"),
  themeSystem: document.getElementById("theme-system"),
  themeDark: document.getElementById("theme-dark"),
};

let selectedCameraId = null;
let snapshotTimer = null;
let ambienceTimer = null;
let localTimeTimer = null;
let ambienceTimezone = null;

const weatherIcons = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
};

function localTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 21 || hour < 5) return "night";
  if (hour < 7) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function formatTemperature(value) {
  if (value == null || Number.isNaN(value)) return "";
  return `${Math.round(value)}°`;
}

function formatAmbienceLabel(ambience) {
  const temp = formatTemperature(ambience.temperature_c);
  const timeLabel = titleCase(ambience.time_of_day);
  if (temp && ambience.weather_label) {
    return `${temp} · ${ambience.weather_label}`;
  }
  if (ambience.weather_label) {
    return ambience.weather_label;
  }
  return timeLabel;
}

function applyAmbience(ambience) {
  const time = ambience?.time_of_day || localTimeOfDay();
  const weather = ambience?.weather || "clear";

  if (els.skyBackground) {
    els.skyBackground.dataset.time = time;
    els.skyBackground.dataset.weather = weather;
  }

  if (els.weatherIcon) {
    els.weatherIcon.textContent = weatherIcons[weather] || "🌤️";
  }

  if (els.weatherLabel) {
    if (ambience?.message && !ambience.configured) {
      els.weatherLabel.textContent = `${titleCase(time)} · Local time`;
    } else {
      els.weatherLabel.textContent = formatAmbienceLabel(ambience || { time_of_day: time, weather_label: titleCase(time) });
    }
  }

  if (ambience?.timezone) {
    ambienceTimezone = ambience.timezone;
  }
}

function updateLocalAmbienceTime() {
  const now = new Date();
  applyAmbience({
    time_of_day: localTimeOfDay(now),
    weather: els.skyBackground?.dataset.weather || "clear",
    weather_label: els.weatherLabel?.textContent || titleCase(localTimeOfDay(now)),
    configured: config.weatherConfigured,
  });
}

async function refreshAmbience() {
  const ambience = await api("/api/ambience");
  applyAmbience(ambience);
  return ambience;
}

function startAmbienceLoop() {
  if (ambienceTimer) clearInterval(ambienceTimer);
  ambienceTimer = setInterval(() => {
    refreshAmbience().catch(() => updateLocalAmbienceTime());
  }, weatherRefreshMs);

  if (localTimeTimer) clearInterval(localTimeTimer);
  localTimeTimer = setInterval(updateLocalAmbienceTime, 60000);
}

const activityIcons = {
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg>`,
  unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 7.5-2"/></svg>`,
  dooropen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14"/><path d="M16 19v-6a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v6"/></svg>`,
  doorclosed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14"/><path d="M10 12h4"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>`,
};

function titleCase(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function activityIconClass(action) {
  if (!action) return "default";
  if (action.includes("lock") && !action.includes("unlock")) return "lock";
  if (action.includes("unlock")) return "unlock";
  if (action.includes("dooropen") || action.includes("door_open")) return "dooropen";
  if (action.includes("doorclose") || action.includes("door_close") || action.includes("doorclosed")) {
    return "doorclosed";
  }
  return "default";
}

function setPill(text, tone = "neutral") {
  els.connectionPill.innerHTML = `<span class="pill-dot"></span>${text}`;
  els.connectionPill.className = `pill pill-${tone}`;
}

function applyStatusCard(card, value) {
  card.classList.remove("locked", "unlocked", "open", "closed");
  if (value) card.classList.add(value);
}

function setCameraMessage(text) {
  const messageSpan = els.cameraMessage.querySelector("span");
  if (messageSpan) {
    messageSpan.textContent = text;
  } else {
    els.cameraMessage.textContent = text;
  }
  els.cameraMessage.classList.remove("hidden");
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(THEME_STORAGE_KEY, mode);

  for (const button of [els.themeLight, els.themeSystem, els.themeDark]) {
    button?.classList.remove("active");
  }

  if (mode === "light") els.themeLight?.classList.add("active");
  if (mode === "system") els.themeSystem?.classList.add("active");
  if (mode === "dark") els.themeDark?.classList.add("active");
}

function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || "system";
  applyTheme(saved);

  els.themeLight?.addEventListener("click", () => applyTheme("light"));
  els.themeSystem?.addEventListener("click", () => applyTheme("system"));
  els.themeDark?.addEventListener("click", () => applyTheme("dark"));
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
    els.activityList.innerHTML = `
      <li class="activity-item">
        <div class="activity-main">
          <div class="activity-icon default">${activityIcons.default}</div>
          <div class="activity-copy"><strong>No recent activity</strong><span class="muted">Events will appear here</span></div>
        </div>
      </li>`;
    return;
  }

  for (const activity of activities) {
    const iconClass = activityIconClass(activity.action);
    const item = document.createElement("li");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-main">
        <div class="activity-icon ${iconClass}">${activityIcons[iconClass] || activityIcons.default}</div>
        <div class="activity-copy">
          <strong>${activity.label}</strong>
          <span class="muted">${activity.operator || activity.device_name || "System"}</span>
        </div>
      </div>
      <span class="activity-time">${formatTime(activity.timestamp)}</span>
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
    setCameraMessage("Unable to load camera snapshot");
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

  if (lock) {
    const bridgeOnline = lock.bridge_online;
    els.bridgeStatus.innerHTML = `<span class="meta-dot ${bridgeOnline ? "online" : "offline"}"></span>Bridge: ${bridgeOnline ? "Online" : "Offline"}`;
  } else {
    els.bridgeStatus.innerHTML = `<span class="meta-dot"></span>Bridge: —`;
  }

  els.lockUpdated.textContent = `Updated: ${formatTime(status.lock_status_updated_at || status.updated_at)}`;

  applyStatusCard(els.lockStatusCard, status.lock_status);
  applyStatusCard(els.doorStatusCard, status.door_status);

  const controlsEnabled = status.authenticated && !!lock;
  els.lockBtn.disabled = !controlsEnabled;
  els.unlockBtn.disabled = !controlsEnabled;

  renderActivities(status.activities);

  const camera = status.camera || {};
  if (!config.unifiConfigured) {
    setCameraMessage("Set UNIFI_HOST, UNIFI_USERNAME, and UNIFI_PASSWORD in .env");
    els.cameraImage.hidden = true;
    return;
  }

  if (!camera.connected) {
    setCameraMessage(camera.message || "UniFi Protect unavailable");
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
    setCameraMessage(error.message);
  }
});

async function init() {
  initTheme();
  updateLocalAmbienceTime();
  try {
    await refreshAmbience();
    startAmbienceLoop();
  } catch {
    updateLocalAmbienceTime();
  }
  try {
    const status = await api("/api/status");
    renderStatus(status);
    connectEvents();
  } catch (error) {
    setPill(error.message, "danger");
  }
}

init();
