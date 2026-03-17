// =============================================
// WAHID BLOCKER - Background Service Worker v3
// =============================================

const DEFAULT_BLOCKED_DOMAINS = [
  "pornhub.com","xvideos.com","xnxx.com","redtube.com","youporn.com",
  "tube8.com","spankbang.com","xhamster.com","brazzers.com","bangbros.com",
  "onlyfans.com","chaturbate.com","cam4.com","bongacams.com","stripchat.com",
  "myfreecams.com","livejasmin.com","sex.com","porn.com","adult.com",
  "hentai.com","nhentai.net","rule34.xxx","e621.net",
  "bet365.com","pokerstars.com","888casino.com","williamhill.com",
  "betway.com","draftkings.com","fanduel.com","casino.com",
  "extremeteen.com","darkweb.com","hitman.com",
  "free-iphone-winner.com","claim-your-prize.com","virus-alert-fix.com"
];

const DEFAULT_SETTINGS = {
  enabled: true,
  adBlockEnabled: true,
  adultBlockEnabled: true,
  spamBlockEnabled: true,
  youtubeBlockEnabled: false,
  youtubeShortsBlock: false,
  youtubeFocusMode: false,
  youtubeRestrictMode: true,
  youtubePiP: true,
  darkModeEnabled: false,
  nightShieldEnabled: false,
  nightShieldOpacity: 40,
  readerModeEnabled: false,
  screentimeEnabled: false,
  screentimeLimitMins: 60,
  screentimeUsedToday: 0,
  screentimeLastDate: "",
  safeSearchEnabled: true,
  customBlockedDomains: [],
  customWhitelistDomains: [],
  password: "",
  passwordEnabled: false,
  monitoringEnabled: true,
  blockCount: 0,
  sessionBlockCount: 0,
  activityLog: [],
  dailyStats: {},
  theme: "dark"
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("settings");
  const merged = Object.assign({}, DEFAULT_SETTINGS, existing.settings || {});
  await chrome.storage.local.set({ settings: merged });
  console.log("[Wahid Blocker] Installed & initialized v3.");
});

// ─── Navigation Blocking ──────────────────────────────────────────────────────
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings || !settings.enabled) return;

  // Track screentime
  if (settings.screentimeEnabled) {
    const today = new Date().toLocaleDateString();
    if (settings.screentimeLastDate !== today) {
      settings.screentimeUsedToday = 0;
      settings.screentimeLastDate = today;
    }
    if (settings.screentimeUsedToday >= settings.screentimeLimitMins) {
      await logAndBlock(details.tabId, "screentime-limit", "Screen Time Limit Reached", settings);
      return;
    }
  }

  const url = new URL(details.url);
  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  // Whitelist check
  const whitelisted = (settings.customWhitelistDomains || []).some(d =>
    hostname === d.toLowerCase() || hostname.endsWith("." + d.toLowerCase())
  );
  if (whitelisted) return;

  // Safe Search redirect
  if (settings.safeSearchEnabled) {
    if (hostname === "google.com" || hostname === "www.google.com") {
      const q = url.searchParams.get("q");
      if (q && !url.searchParams.get("safe")) {
        const safeUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&safe=active`;
        chrome.tabs.update(details.tabId, { url: safeUrl });
        return;
      }
    }
  }

  // YouTube block
  if (settings.youtubeBlockEnabled && (hostname.includes("youtube.com") || hostname.includes("youtu.be"))) {
    await logAndBlock(details.tabId, hostname, "YouTube Block", settings);
    return;
  }

  // Adult/custom block
  if (settings.adultBlockEnabled) {
    const isBlocked = DEFAULT_BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
    const isCustomBlocked = (settings.customBlockedDomains || []).some(d =>
      d && (hostname === d.toLowerCase() || hostname.endsWith("." + d.toLowerCase()))
    );
    if (isBlocked || isCustomBlocked) {
      await logAndBlock(details.tabId, hostname, isCustomBlocked ? "Custom Block" : "Adult/Harmful Block", settings);
      return;
    }
  }

  // Spam heuristic
  if (settings.spamBlockEnabled) {
    const spamPatterns = [
      /free.*(iphone|prize|winner|gift)/i,
      /virus.*(alert|warning|detected)/i,
      /click.*(here|now).*(win|free)/i,
      /adult|xxx|sex|porn/i,
      /casino|gambling|bet\d/i
    ];
    if (spamPatterns.some(p => p.test(details.url.toLowerCase()))) {
      await logAndBlock(details.tabId, hostname, "Spam Detected", settings);
    }
  }
});

async function logAndBlock(tabId, domain, reason, settings) {
  settings.blockCount = (settings.blockCount || 0) + 1;
  settings.sessionBlockCount = (settings.sessionBlockCount || 0) + 1;

  // Daily stats
  const today = new Date().toLocaleDateString();
  if (!settings.dailyStats) settings.dailyStats = {};
  settings.dailyStats[today] = (settings.dailyStats[today] || 0) + 1;
  // Keep only last 7 days
  const keys = Object.keys(settings.dailyStats).slice(-7);
  const trimmed = {};
  keys.forEach(k => { trimmed[k] = settings.dailyStats[k]; });
  settings.dailyStats = trimmed;

  const logEntry = {
    domain, reason,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-US")
  };
  settings.activityLog = [logEntry, ...(settings.activityLog || [])].slice(0, 300);
  await chrome.storage.local.set({ settings });

  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}`)
  });

  if (settings.monitoringEnabled) {
    chrome.notifications.create({
      type: "basic", iconUrl: "icons/icon48.png",
      title: "Wahid Blocker 🛡️",
      message: `Blocked: ${domain} (${reason})`
    });
  }
}

// ─── Screentime Alarm (runs every minute) ────────────────────────────────────
chrome.alarms.create("screentime-tick", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "screentime-tick") return;
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings || !settings.screentimeEnabled) return;
  const today = new Date().toLocaleDateString();
  if (settings.screentimeLastDate !== today) {
    settings.screentimeUsedToday = 0;
    settings.screentimeLastDate = today;
  }
  settings.screentimeUsedToday = (settings.screentimeUsedToday || 0) + 1;
  await chrome.storage.local.set({ settings });
});

// ─── Messages ─────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then(({ settings }) => {
      sendResponse({ settings: Object.assign({}, DEFAULT_SETTINGS, settings || {}) });
    });
    return true;
  }
  if (message.type === "UPDATE_SETTINGS") {
    chrome.storage.local.set({ settings: message.settings }).then(() => sendResponse({ success: true }));
    return true;
  }
  if (message.type === "CLEAR_LOG") {
    chrome.storage.local.get("settings").then(({ settings }) => {
      settings.activityLog = [];
      settings.sessionBlockCount = 0;
      chrome.storage.local.set({ settings }).then(() => sendResponse({ success: true }));
    });
    return true;
  }
  if (message.type === "OPEN_POPUP") {
    try { chrome.action.openPopup(); } catch (e) {}
    sendResponse({ success: true });
    return true;
  }
});

console.log("[Wahid Blocker] Background v3 running.");
