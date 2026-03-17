// =============================================
// WAHID BLOCKER - Popup Script v3.0
// =============================================

let S = null; // settings
let unlocked = false;

document.addEventListener("DOMContentLoaded", async () => {
  await load();
  checkLock();
  bind();
});

// ─── Load ─────────────────────────────────────────────────────────────────────
async function load() {
  const r = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  S = r.settings;
  render();
}

// ─── Password Gate ────────────────────────────────────────────────────────────
function checkLock() {
  if (S.passwordEnabled && S.password && !unlocked) {
    document.getElementById("pw-gate").classList.add("show");
    setTimeout(() => document.getElementById("pw-input").focus(), 80);
  }
}

function bind() {
  // Gate unlock
  document.getElementById("pw-submit").addEventListener("click", tryUnlock);
  document.getElementById("pw-input").addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });

  // Master toggle
  document.getElementById("master-toggle").addEventListener("click", () => flip("enabled"));

  // Tabs
  document.querySelectorAll(".tab[data-tab]").forEach(t =>
    t.addEventListener("click", () => switchTab(t.dataset.tab))
  );

  // All feature toggles
  document.querySelectorAll(".tog[data-key]").forEach(tog =>
    tog.addEventListener("click", () => flip(tog.dataset.key))
  );

  // Block current site
  document.getElementById("btn-block-current").addEventListener("click", blockCurrent);

  // Domain management
  document.getElementById("btn-add-block").addEventListener("click", addBlock);
  document.getElementById("block-input").addEventListener("keydown", e => { if (e.key === "Enter") addBlock(); });
  document.getElementById("btn-add-whitelist").addEventListener("click", addWhitelist);
  document.getElementById("whitelist-input").addEventListener("keydown", e => { if (e.key === "Enter") addWhitelist(); });

  // Analytics clear
  document.getElementById("btn-clear-log").addEventListener("click", clearLog);

  // Screen time save
  document.getElementById("btn-st-save").addEventListener("click", saveScreentime);

  // Night shield slider
  document.getElementById("ns-slider").addEventListener("input", e => {
    S.nightShieldOpacity = parseInt(e.target.value);
    document.getElementById("ns-val").textContent = e.target.value + "%";
    save();
  });

  // Password management
  document.getElementById("btn-pw-save").addEventListener("click", savePw);
  document.getElementById("btn-pw-enable").addEventListener("click", enablePw);
  document.getElementById("btn-pw-disable").addEventListener("click", disablePw);

  // Export
  document.getElementById("btn-export").addEventListener("click", exportLog);

  // Reset
  document.getElementById("btn-reset").addEventListener("click", resetAll);
}

function tryUnlock() {
  const v = document.getElementById("pw-input").value;
  const err = document.getElementById("pw-err");
  if (v === S.password) {
    unlocked = true;
    document.getElementById("pw-gate").classList.remove("show");
    err.style.display = "none";
    document.getElementById("pw-input").value = "";
  } else {
    err.style.display = "block";
    document.getElementById("pw-input").value = "";
    document.getElementById("pw-input").style.borderColor = "#ff3333";
    setTimeout(() => { document.getElementById("pw-input").style.borderColor = ""; }, 900);
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  if (!S) return;

  // Master
  document.getElementById("master-toggle").classList.toggle("on", !!S.enabled);
  document.getElementById("status-text").textContent = S.enabled ? "Active — Protection ON" : "Disabled";

  // Stats
  const today = new Date().toLocaleDateString();
  const todayCount = (S.dailyStats || {})[today] || 0;
  document.getElementById("st-total").textContent  = S.blockCount || 0;
  document.getElementById("st-session").textContent = S.sessionBlockCount || 0;
  document.getElementById("st-custom").textContent  = (S.customBlockedDomains?.length || 0) + (S.customWhitelistDomains?.length || 0);
  document.getElementById("st-today").textContent   = todayCount;

  // Toggles — all with data-key
  document.querySelectorAll(".tog[data-key]").forEach(tog => {
    tog.classList.toggle("on", !!S[tog.dataset.key]);
  });

  // Domain lists
  renderTags("block-list",     S.customBlockedDomains  || [], "block");
  renderTags("whitelist-list", S.customWhitelistDomains || [], "whitelist");

  // Screen time settings panel
  const stOn = !!S.screentimeEnabled;
  document.getElementById("st-settings").style.display = stOn ? "block" : "none";
  if (stOn) {
    document.getElementById("st-limit").value = S.screentimeLimitMins || 60;
    const pct = Math.min(100, Math.round(((S.screentimeUsedToday || 0) / (S.screentimeLimitMins || 60)) * 100));
    document.getElementById("st-bar").style.width = pct + "%";
    document.getElementById("st-used").textContent = (S.screentimeUsedToday || 0) + " min used";
    document.getElementById("st-limit-disp").textContent = (S.screentimeLimitMins || 60) + " min limit";
    document.getElementById("st-desc").textContent = `${S.screentimeUsedToday || 0}/${S.screentimeLimitMins || 60} min today`;
  }

  // Night shield slider
  const nsOn = !!S.nightShieldEnabled;
  document.getElementById("ns-slider-row").style.display = nsOn ? "flex" : "none";
  document.getElementById("ns-slider").value = S.nightShieldOpacity || 40;
  document.getElementById("ns-val").textContent = (S.nightShieldOpacity || 40) + "%";

  // Password UI
  const pwEnabled = !!S.passwordEnabled;
  const badge = document.getElementById("pw-status-badge");
  badge.textContent = pwEnabled ? "ON" : "OFF";
  badge.className = "pw-status " + (pwEnabled ? "on" : "off");

  // Analytics
  renderAnalytics();
}

// ─── Domain Tags ──────────────────────────────────────────────────────────────
function renderTags(id, list, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  if (!list.length) {
    el.innerHTML = `<span style="font-size:9px;color:var(--muted)">None added yet</span>`;
    return;
  }
  list.forEach(d => {
    const t = document.createElement("div");
    t.className = "dtag" + (type === "whitelist" ? " wtag" : "");
    t.innerHTML = `${d} <span class="x">×</span>`;
    t.querySelector(".x").addEventListener("click", () => removeDomain(d, type));
    el.appendChild(t);
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function renderAnalytics() {
  const stats = S.dailyStats || {};
  const today = new Date().toLocaleDateString();

  // Build last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString();
    const lbl = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ key, lbl, val: stats[key] || 0 });
  }
  const maxVal = Math.max(...days.map(d => d.val), 1);

  const barsEl = document.getElementById("analytics-bars");
  barsEl.innerHTML = days.map(d => `
    <div class="bar-col">
      <div class="bar-val">${d.val || ""}</div>
      <div class="bar" style="height:${Math.round((d.val / maxVal) * 50) + 2}px;${d.key === today ? "background:linear-gradient(180deg,#ffaa55,#ff6622);" : ""}"></div>
      <div class="bar-lbl">${d.lbl}</div>
    </div>`).join("");

  // Cards
  const todayCount = stats[today] || 0;
  document.getElementById("ana-total").textContent  = S.blockCount || 0;
  document.getElementById("ana-today").textContent  = todayCount;
  document.getElementById("ana-rules").textContent  = (S.customBlockedDomains?.length || 0);
  // Streak: consecutive days with at least 1 block
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if ((stats[d.toLocaleDateString()] || 0) > 0) streak++;
    else break;
  }
  document.getElementById("ana-streak").textContent = streak;

  // Top blocked domains
  const log = S.activityLog || [];
  const domCount = {};
  log.forEach(e => { domCount[e.domain] = (domCount[e.domain] || 0) + 1; });
  const sorted = Object.entries(domCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topEl = document.getElementById("top-domains");
  if (!sorted.length) {
    topEl.innerHTML = `<div style="font-size:10px;color:var(--muted);padding:6px 0;text-align:center">No activity yet</div>`;
  } else {
    topEl.innerHTML = sorted.map(([d, c]) => `
      <div class="td-row"><span class="td-name">${d}</span><span class="td-count">${c}×</span></div>`).join("");
  }
}

// ─── Flip toggle ──────────────────────────────────────────────────────────────
async function flip(key) {
  S[key] = !S[key];
  await save();
}

async function save() {
  await chrome.runtime.sendMessage({ type: "UPDATE_SETTINGS", settings: S });
  render();
}

// ─── Tab Switch ───────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".pane").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-" + name)?.classList.add("active");
}

// ─── Block Current Site ───────────────────────────────────────────────────────
async function blockCurrent() {
  const btn = document.getElementById("btn-block-current");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  try {
    const url = new URL(tab.url);
    if (!["http:","https:"].includes(url.protocol)) return;
    const domain = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!S.customBlockedDomains) S.customBlockedDomains = [];
    if (!S.customBlockedDomains.includes(domain)) {
      S.customBlockedDomains.push(domain);
      await save();
      btn.textContent = "✅ Blocked!";
      btn.style.background = "#1a7a3a";
    } else {
      btn.textContent = "Already blocked";
    }
    setTimeout(() => { btn.textContent = "🚫 Block Site"; btn.style.background = ""; }, 2200);
  } catch (e) {}
}

// ─── Domain Add/Remove ────────────────────────────────────────────────────────
function parseDomain(v) {
  return v.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/,"").split("/")[0].split("?")[0] || "";
}

async function addBlock() {
  const inp = document.getElementById("block-input");
  const d = parseDomain(inp.value); if (!d) return;
  if (!S.customBlockedDomains) S.customBlockedDomains = [];
  if (!S.customBlockedDomains.includes(d)) { S.customBlockedDomains.push(d); await save(); }
  inp.value = "";
}

async function addWhitelist() {
  const inp = document.getElementById("whitelist-input");
  const d = parseDomain(inp.value); if (!d) return;
  if (!S.customWhitelistDomains) S.customWhitelistDomains = [];
  if (!S.customWhitelistDomains.includes(d)) { S.customWhitelistDomains.push(d); await save(); }
  inp.value = "";
}

async function removeDomain(domain, type) {
  if (type === "block") S.customBlockedDomains = (S.customBlockedDomains || []).filter(d => d !== domain);
  else S.customWhitelistDomains = (S.customWhitelistDomains || []).filter(d => d !== domain);
  await save();
}

// ─── Clear Log ────────────────────────────────────────────────────────────────
async function clearLog() {
  await chrome.runtime.sendMessage({ type: "CLEAR_LOG" });
  await load();
}

// ─── Screen Time ──────────────────────────────────────────────────────────────
async function saveScreentime() {
  const v = parseInt(document.getElementById("st-limit").value) || 60;
  S.screentimeLimitMins = Math.max(10, Math.min(480, v));
  await save();
}

// ─── Password Management ──────────────────────────────────────────────────────
async function savePw() {
  const pw = document.getElementById("pw-new").value.trim();
  if (!pw) { showPwMsg("Enter a password first.", "#ff9944"); return; }
  S.password = pw;
  unlocked = true;
  await save();
  document.getElementById("pw-new").value = "";
  showPwMsg("Password saved!", "#22cc66");
}

async function enablePw() {
  if (!S.password) { showPwMsg("Set a password first.", "#ff9944"); return; }
  S.passwordEnabled = true;
  unlocked = true;
  await save();
  showPwMsg("Lock enabled.", "#22cc66");
}

async function disablePw() {
  S.passwordEnabled = false;
  await save();
  showPwMsg("Lock disabled.", "#ff9944");
}

function showPwMsg(msg, color) {
  const el = document.getElementById("pw-msg");
  el.textContent = msg; el.style.color = color;
  setTimeout(() => { el.textContent = ""; }, 3000);
}

// ─── Export Log ───────────────────────────────────────────────────────────────
function exportLog() {
  const log = S.activityLog || [];
  const csv = ["Domain,Reason,Date"].concat(
    log.map(e => `${e.domain},${e.reason},${e.timestamp}`)
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "wahid-blocker-log.csv";
  a.click(); URL.revokeObjectURL(url);
}

// ─── Reset All ────────────────────────────────────────────────────────────────
async function resetAll() {
  if (!confirm("Reset all settings and data?")) return;
  const resp = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  const fresh = {
    enabled: true, adBlockEnabled: true, adultBlockEnabled: true, spamBlockEnabled: true,
    youtubeBlockEnabled: false, youtubeShortsBlock: false, youtubeFocusMode: false,
    youtubeRestrictMode: true, youtubePiP: true, darkModeEnabled: false,
    nightShieldEnabled: false, nightShieldOpacity: 40, readerModeEnabled: false,
    screentimeEnabled: false, screentimeLimitMins: 60, screentimeUsedToday: 0,
    screentimeLastDate: "", safeSearchEnabled: true, cookieBannerBlock: false,
    customBlockedDomains: [], customWhitelistDomains: [], password: "",
    passwordEnabled: false, monitoringEnabled: true, blockCount: 0,
    sessionBlockCount: 0, activityLog: [], dailyStats: {}, theme: "dark"
  };
  S = fresh;
  await save();
}
