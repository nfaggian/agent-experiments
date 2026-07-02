const config = window.DASHBOARD_CONFIG || {};
const refreshMs = Math.max(1000, (config.snapshotRefreshSeconds || 2) * 1000);
const weatherRefreshMs = Math.max(60000, (config.weatherRefreshSeconds || 900) * 1000);
const THEME_STORAGE_KEY = "home-dashboard-theme";

const els = {
  ambient: document.getElementById("ambient"),
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
  lockRing: document.getElementById("lock-ring"),
  doorStatus: document.getElementById("door-status"),
  doorStatusCard: document.getElementById("door-status-card"),
  batteryLevel: document.getElementById("battery-level"),
  bridgeStatus: document.getElementById("bridge-status"),
  bridgeDot: document.getElementById("bridge-dot"),
  lockUpdated: document.getElementById("lock-updated"),
  lockBtn: document.getElementById("lock-btn"),
  unlockBtn: document.getElementById("unlock-btn"),
  cameraSelect: document.getElementById("camera-select"),
  cameraImage: document.getElementById("camera-image"),
  cameraPlaceholder: document.getElementById("camera-placeholder"),
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

const weatherIconSvg = {
  clear: `<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v2M10 15.5v2M3.9 3.9l1.4 1.4M14.7 14.7l1.4 1.4M2.5 10h2M15.5 10h2M3.9 16.1l1.4-1.4M14.7 5.3l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  "partly-cloudy": `<svg viewBox="0 0 20 20" fill="none"><circle cx="7.5" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 14h9a3 3 0 0 0 .4-6 3.5 3.5 0 0 0-6.8-1.2A2.5 2.5 0 0 0 5 14z" stroke="currentColor" stroke-width="1.5"/></svg>`,
  cloudy: `<svg viewBox="0 0 20 20" fill="none"><path d="M6 15h8.5a3.5 3.5 0 0 0 .5-7A4 4 0 0 0 5.2 6.5 3 3 0 0 0 6 15z" stroke="currentColor" stroke-width="1.5"/></svg>`,
  fog: `<svg viewBox="0 0 20 20" fill="none"><path d="M4 9h12M3 12h14M5 15h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  rain: `<svg viewBox="0 0 20 20" fill="none"><path d="M6 14h8.5a3 3 0 0 0 .4-6 3.5 3.5 0 0 0-6.8-1.2A2.5 2.5 0 0 0 6 14z" stroke="currentColor" stroke-width="1.5"/><path d="M8 16.5v2M12 15.5v2M10 17.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  snow: `<svg viewBox="0 0 20 20" fill="none"><path d="M6 13h8a3 3 0 0 0 .3-6 3.5 3.5 0 0 0-6.6-1.3A2.5 2.5 0 0 0 6 13z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="16" r=".8" fill="currentColor"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>`,
  storm: `<svg viewBox="0 0 20 20" fill="none"><path d="M6 12h8a3 3 0 0 0 .4-6 3.5 3.5 0 0 0-6.8-1.2A2.5 2.5 0 0 0 6 12z" stroke="currentColor" stroke-width="1.5"/><path d="M11 13l-2 4h2l-1.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

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
  if (temp && ambience.weather_label) return `${temp} · ${ambience.weather_label}`;
  if (ambience.weather_label) return ambience.weather_label;
  return titleCase(ambience.time_of_day);
}

function setWeatherIcon(weather) {
  if (!els.weatherIcon) return;
  els.weatherIcon.innerHTML = weatherIconSvg[weather] || weatherIconSvg.clear;
}

function applyAmbience(ambience) {
  const time = ambience?.time_of_day || localTimeOfDay();
  const weather = ambience?.weather || "clear";

  if (els.ambient) {
    els.ambient.dataset.time = time;
    els.ambient.dataset.weather = weather;
  }

  setWeatherIcon(weather);

  if (els.weatherLabel) {
    if (ambience?.message && !ambience.configured) {
      els.weatherLabel.textContent = `${titleCase(time)} · Local`;
    } else {
      els.weatherLabel.textContent = formatAmbienceLabel(
        ambience || { time_of_day: time, weather_label: titleCase(time) },
      );
    }
  }
}

function updateLocalAmbienceTime() {
  applyAmbience({
    time_of_day: localTimeOfDay(),
    weather: els.ambient?.dataset.weather || "clear",
    weather_label: els.weatherLabel?.textContent || titleCase(localTimeOfDay()),
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

function activityIconClass(action) {
  if (!action) return "default";
  if (action.includes("lock") && !action.includes("unlock")) return "lock";
  if (action.includes("unlock")) return "unlock";
  if (action.includes("dooropen") || action.includes("door_open")) return "dooropen";
  if (action.includes("doorclose") || action.includes("door_closed") || action.includes("doorclosed")) {
    return "doorclosed";
  }
  return "default";
}

function setPill(text, tone = "neutral") {
  if (!els.connectionPill) return;
  const textEl = els.connectionPill.querySelector(".chip__text");
  if (textEl) textEl.textContent = text;
  els.connectionPill.className = "chip chip--status";
  if (tone === "success") els.connectionPill.classList.add("is-success");
  if (tone === "warning") els.connectionPill.classList.add("is-warning");
  if (tone === "danger") els.connectionPill.classList.add("is-danger");
}

function applyLockRing(lockStatus, doorStatus) {
  if (!els.lockRing) return;
  const state = lockStatus === "unknown" ? doorStatus : lockStatus;
  els.lockRing.dataset.state = state || "unknown";
}

function applyDoorMetric(doorStatus) {
  if (!els.doorStatusCard) return;
  els.doorStatusCard.classList.remove("open", "closed");
  if (doorStatus === "open") els.doorStatusCard.classList.add("open");
  if (doorStatus === "closed") els.doorStatusCard.classList.add("closed");
}

function setCameraMessage(text) {
  const messageSpan = els.cameraMessage?.querySelector("span");
  if (messageSpan) messageSpan.textContent = text;
  els.cameraMessage?.classList.remove("hidden");
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(THEME_STORAGE_KEY, mode);

  for (const button of [els.themeLight, els.themeSystem, els.themeDark]) {
    button?.classList.remove("is-active");
  }

  if (mode === "light") els.themeLight?.classList.add("is-active");
  if (mode === "system") els.themeSystem?.classList.add("is-active");
  if (mode === "dark") els.themeDark?.classList.add("is-active");
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
  if (contentType.includes("application/json")) return response.json();
  return response;
}

function renderActivities(activities) {
  if (!els.activityList) return;
  els.activityList.innerHTML = "";

  if (!activities || activities.length === 0) {
    els.activityList.innerHTML = `<li class="timeline-empty">No events yet — lock and door activity will appear here.</li>`;
    return;
  }

  activities.forEach((activity, index) => {
    const iconClass = activityIconClass(activity.action);
    const item = document.createElement("li");
    item.className = "timeline-item";
    item.style.animationDelay = `${index * 0.04}s`;
    item.innerHTML = `
      <div class="timeline-marker ${iconClass}">${activityIcons[iconClass] || activityIcons.default}</div>
      <div class="timeline-body">
        <strong>${activity.label}</strong>
        <span>${activity.operator || activity.device_name || "System"}</span>
      </div>
      <time class="timeline-time">${formatTime(activity.timestamp)}</time>
    `;
    els.activityList.appendChild(item);
  });
}

function renderCameraOptions(cameras, selectedId) {
  if (!els.cameraSelect) return;
  els.cameraSelect.innerHTML = "";
  if (!cameras || cameras.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No cameras";
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

function showCameraFeed(show) {
  if (els.cameraImage) els.cameraImage.hidden = !show;
  if (els.cameraPlaceholder) els.cameraPlaceholder.hidden = show;
}

function updateCameraSnapshot() {
  if (!selectedCameraId) return;
  const url = `/api/camera/snapshot?camera_id=${encodeURIComponent(selectedCameraId)}&t=${Date.now()}`;
  els.cameraImage.onload = () => {
    showCameraFeed(true);
    els.cameraMessage?.classList.add("hidden");
  };
  els.cameraImage.onerror = () => {
    showCameraFeed(false);
    setCameraMessage("Unable to load snapshot");
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
    els.authPanel?.classList.remove("hidden");
    if (els.authMessage) els.authMessage.textContent = status.auth_message || "Sign in to control your Yale lock.";
    els.verifyForm?.classList.toggle("hidden", authState !== "requires_validation");
    els.loginForm?.classList.toggle("hidden", authState === "requires_validation");
  } else {
    els.authPanel?.classList.add("hidden");
  }

  if (status.authenticated) setPill("Yale connected", "success");
  else if (config.yaleConfigured) setPill("Sign in required", "warning");
  else setPill("Not configured", "neutral");

  const lock = status.lock;
  if (els.lockName) els.lockName.textContent = lock ? lock.name : "No lock selected";

  const lockLabel = titleCase(status.lock_status);
  if (els.lockStatus) els.lockStatus.textContent = lockLabel;
  if (els.doorStatus) els.doorStatus.textContent = titleCase(status.door_status);
  if (els.batteryLevel) {
    els.batteryLevel.textContent = lock && lock.battery_level != null ? `${lock.battery_level}%` : "—";
  }

  applyLockRing(status.lock_status, status.door_status);
  applyDoorMetric(status.door_status);

  if (lock && els.bridgeStatus) {
    const online = lock.bridge_online;
    els.bridgeStatus.innerHTML = `<span class="foot-dot ${online ? "is-online" : "is-offline"}"></span>Bridge ${online ? "online" : "offline"}`;
  } else if (els.bridgeStatus) {
    els.bridgeStatus.innerHTML = `<span class="foot-dot"></span>Bridge —`;
  }

  if (els.lockUpdated) {
    els.lockUpdated.textContent = `Updated ${formatTime(status.lock_status_updated_at || status.updated_at)}`;
  }

  const controlsEnabled = status.authenticated && !!lock;
  if (els.lockBtn) els.lockBtn.disabled = !controlsEnabled;
  if (els.unlockBtn) els.unlockBtn.disabled = !controlsEnabled;

  renderActivities(status.activities);

  const camera = status.camera || {};
  if (!config.unifiConfigured) {
    setCameraMessage("Set UNIFI_HOST, UNIFI_USERNAME, and UNIFI_PASSWORD in .env");
    showCameraFeed(false);
    return;
  }

  if (!camera.connected) {
    setCameraMessage(camera.message || "UniFi Protect unavailable");
    showCameraFeed(false);
  }

  renderCameraOptions(camera.cameras || [], camera.selected_camera_id);
  selectedCameraId = camera.selected_camera_id || selectedCameraId;
  const active = (camera.cameras || []).find((item) => item.camera_id === selectedCameraId);

  if (els.cameraStatus) {
    els.cameraStatus.textContent = active
      ? `${active.is_connected ? "Connected" : "Offline"}${active.is_motion_detected ? " · Motion" : ""}`
      : "—";
  }

  if (camera.connected && selectedCameraId) startSnapshotLoop();
}

async function refreshStatus() {
  const status = await api("/api/refresh", { method: "POST" });
  renderStatus(status);
}

function connectEvents() {
  const source = new EventSource("/api/events");
  source.onmessage = (event) => renderStatus(JSON.parse(event.data));
  source.onerror = () => setPill("Updates paused", "warning");
}

els.refreshBtn?.addEventListener("click", () => {
  refreshStatus().catch((error) => setPill(error.message, "danger"));
});

els.lockBtn?.addEventListener("click", async () => {
  try {
    const result = await api("/api/lock", { method: "POST" });
    if (result.status) renderStatus(result.status);
  } catch (error) {
    setPill(error.message, "danger");
  }
});

els.unlockBtn?.addEventListener("click", async () => {
  try {
    const result = await api("/api/unlock", { method: "POST" });
    if (result.status) renderStatus(result.status);
  } catch (error) {
    setPill(error.message, "danger");
  }
});

els.loginForm?.addEventListener("submit", async (event) => {
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
    if (els.authMessage) els.authMessage.textContent = error.message;
  }
});

els.verifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const status = await api("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code: els.verifyCode.value }),
    });
    renderStatus(status);
  } catch (error) {
    if (els.authMessage) els.authMessage.textContent = error.message;
  }
});

els.cameraSelect?.addEventListener("change", async () => {
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
