// =============================================
// WAHID BLOCKER - YouTube Content Script v2.0
// =============================================

(async function () {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings || !settings.enabled) return;

  // ── 1. Complete YouTube Block ──────────────────────────────────────────────
  if (settings.youtubeBlockEnabled) {
    document.documentElement.innerHTML = "";
    window.location.href = chrome.runtime.getURL(
      "blocked.html?domain=youtube.com&reason=YouTube+Block"
    );
    return;
  }

  // Build CSS to inject
  let cssRules = "";

  // ── 2. YouTube Ads Block ───────────────────────────────────────────────────
  // Collapse the ad container area completely (no empty space left)
  cssRules += `
    /* YouTube Ads — completely remove, no space left */
    .video-ads.ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-text-overlay,
    .ytp-ad-skip-button-container,
    ytd-banner-promo-renderer,
    ytd-statement-banner-renderer,
    ytd-ad-slot-renderer,
    ytd-in-feed-ad-layout-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-display-ad-renderer,
    ytd-primetime-promo-renderer,
    #masthead-ad,
    #player-ads,
    .ytd-promoted-video-renderer,
    ytd-compact-promoted-video-renderer,
    .GoogleActiveViewElement,
    #ad-text,
    .ytp-ad-player-overlay,
    .ytp-ad-player-overlay-layout,
    .ytp-ad-action-interstitial,
    .ytp-ad-progress,
    tp-yt-paper-dialog.ytd-popup-container[style*="z-index"] {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;

  // ── 3. Shorts Block Only ───────────────────────────────────────────────────
  if (settings.youtubeShortsBlock) {
    // If on Shorts page, redirect to home
    if (window.location.pathname.startsWith("/shorts")) {
      window.location.replace("https://www.youtube.com/");
      return;
    }
    cssRules += `
      /* Hide all Shorts entries in feed */
      ytd-rich-shelf-renderer[is-shorts],
      ytd-reel-shelf-renderer,
      ytd-shorts,
      a[href*="/shorts/"],
      [href*="/shorts/"],
      ytd-guide-entry-renderer a[href="/shorts"],
      ytd-mini-guide-entry-renderer a[href="/shorts"] {
        display: none !important;
      }
    `;
    // Intercept navigation to /shorts/
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    function interceptNav(url) {
      try {
        const path = new URL(url, location.href).pathname;
        if (path.startsWith("/shorts/")) {
          window.location.replace("https://www.youtube.com/");
          return true;
        }
      } catch (e) {}
      return false;
    }
    history.pushState = function (s, t, url) {
      if (url && interceptNav(url)) return;
      return origPush(s, t, url);
    };
    history.replaceState = function (s, t, url) {
      if (url && interceptNav(url)) return;
      return origReplace(s, t, url);
    };
    window.addEventListener("popstate", () => {
      if (location.pathname.startsWith("/shorts/")) {
        window.location.replace("https://www.youtube.com/");
      }
    });
  }

  // ── 4. Restrict Mode ──────────────────────────────────────────────────────
  if (settings.youtubeRestrictMode) {
    cssRules += `
      #secondary { display: none !important; }
      #comments { display: none !important; }
      .ytp-autonav-toggle-button-container { display: none !important; }
      .ytp-ce-element { display: none !important; }
      ytd-browse[page-subtype="home"] ytd-rich-grid-renderer { display: none !important; }
    `;
  }

  // Inject CSS
  if (cssRules) {
    const style = document.createElement("style");
    style.id = "wahid-yt-css";
    style.textContent = cssRules;
    (document.head || document.documentElement).appendChild(style);
  }

  // ── 5. Focus Mode ─────────────────────────────────────────────────────────
  if (settings.youtubeFocusMode) {
    injectFocusModeButton();
  }

  // ── 6. PiP Button ─────────────────────────────────────────────────────────
  if (settings.youtubePiP) {
    injectPiPButton();
  }

  // ── Re-apply on YouTube SPA navigation ────────────────────────────────────
  let lastUrl = location.href;
  const navObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      // Re-check shorts block on navigation
      if (settings.youtubeShortsBlock && location.pathname.startsWith("/shorts")) {
        window.location.replace("https://www.youtube.com/");
        return;
      }

      // Re-inject CSS if lost
      if (!document.getElementById("wahid-yt-css") && cssRules) {
        const s = document.createElement("style");
        s.id = "wahid-yt-css";
        s.textContent = cssRules;
        document.head?.appendChild(s);
      }

      // Re-inject buttons after navigation
      if (settings.youtubeFocusMode) setTimeout(injectFocusModeButton, 1500);
      if (settings.youtubePiP) setTimeout(injectPiPButton, 1500);
    }
  });
  navObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });

  // Auto-skip ads using MutationObserver
  const adObserver = new MutationObserver(() => {
    // Auto-skip skippable ads
    const skipBtn = document.querySelector(".ytp-skip-ad-button, .ytp-ad-skip-button");
    if (skipBtn) skipBtn.click();

    // Mute ad and set time to end if unskippable
    const video = document.querySelector("video");
    if (video) {
      const adBadge = document.querySelector(".ad-showing");
      if (adBadge && !video.muted) {
        video.muted = true;
        setTimeout(() => {
          if (document.querySelector(".ad-showing") && isFinite(video.duration)) {
            video.currentTime = video.duration;
          }
          if (!document.querySelector(".ad-showing")) video.muted = false;
        }, 200);
      }
    }
  });
  adObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

})(); // end main IIFE

// ── Focus Mode Button Injection ────────────────────────────────────────────────
function injectFocusModeButton() {
  if (document.getElementById("wahid-focus-btn")) return;
  if (!location.pathname.startsWith("/watch")) return;

  // Wait for player controls to load
  const tryInject = () => {
    const controls = document.querySelector(".ytp-right-controls");
    if (!controls) return setTimeout(tryInject, 800);

    const btn = document.createElement("button");
    btn.id = "wahid-focus-btn";
    btn.title = "Wahid Focus Mode — Sirf yeh video";
    btn.style.cssText = `
      background: rgba(230,48,48,0.85);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      margin: 0 6px;
      font-family: sans-serif;
      letter-spacing: 0.3px;
      transition: background 0.2s;
      vertical-align: middle;
    `;
    btn.textContent = "🎯 Focus";
    btn.addEventListener("mouseenter", () => btn.style.background = "rgba(230,48,48,1)");
    btn.addEventListener("mouseleave", () => btn.style.background = "rgba(230,48,48,0.85)");

    let focusActive = false;
    btn.addEventListener("click", () => {
      focusActive = !focusActive;
      applyFocusMode(focusActive);
      btn.textContent = focusActive ? "✕ Exit Focus" : "🎯 Focus";
      btn.style.background = focusActive ? "#22cc66" : "rgba(230,48,48,0.85)";
    });

    controls.insertBefore(btn, controls.firstChild);
  };
  tryInject();
}

function applyFocusMode(active) {
  const FOCUS_STYLE_ID = "wahid-focus-style";
  if (active) {
    const css = `
      /* Focus Mode: hide everything except the video player */
      #masthead-container,
      ytd-watch-flexy #secondary,
      #comments,
      #below,
      ytd-watch-metadata,
      #description,
      ytd-watch-flexy #chat,
      .ytd-watch-flexy[page-subtype] ytd-merch-shelf-renderer,
      ytd-related-chip-cloud-renderer {
        display: none !important;
      }
      ytd-watch-flexy #primary-inner {
        max-width: 100vw !important;
        width: 100% !important;
      }
      #movie_player, .html5-video-container {
        max-height: 90vh !important;
      }
      body { overflow: hidden !important; }
    `;
    if (!document.getElementById(FOCUS_STYLE_ID)) {
      const s = document.createElement("style");
      s.id = FOCUS_STYLE_ID;
      s.textContent = css;
      document.head.appendChild(s);
    }
    // Press 't' to enter theater mode
    document.querySelector(".ytp-size-button")?.click();
  } else {
    document.getElementById(FOCUS_STYLE_ID)?.remove();
    // Exit theater mode
    const sizeBtn = document.querySelector(".ytp-size-button");
    if (sizeBtn) sizeBtn.click();
  }
}

// ── PiP Button Injection ───────────────────────────────────────────────────────
function injectPiPButton() {
  if (document.getElementById("wahid-pip-btn")) return;
  if (!location.pathname.startsWith("/watch")) return;

  const tryInject = () => {
    // Try inserting below the video player, above description
    const belowPlayer = document.querySelector("#above-the-fold, ytd-watch-metadata, #description-inner");
    if (!belowPlayer) return setTimeout(tryInject, 1000);

    const wrapper = document.createElement("div");
    wrapper.id = "wahid-pip-btn";
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 4px 0;
      padding: 6px 0;
    `;

    const btn = document.createElement("button");
    btn.style.cssText = `
      background: linear-gradient(135deg, #8b0000, #e63030);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: sans-serif;
      box-shadow: 0 2px 8px rgba(230,48,48,0.4);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    btn.innerHTML = "📺 Picture-in-Picture";
    btn.title = "Is video ko PiP mein chalao";

    btn.addEventListener("mouseenter", () => btn.style.transform = "scale(1.04)");
    btn.addEventListener("mouseleave", () => btn.style.transform = "scale(1)");
    btn.addEventListener("click", async () => {
      const video = document.querySelector("video");
      if (!video) return;
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          btn.innerHTML = "📺 Picture-in-Picture";
        } else {
          await video.requestPictureInPicture();
          btn.innerHTML = "✕ PiP Band Karo";
        }
      } catch (e) {
        btn.innerHTML = "⚠️ PiP allowed nahi";
        setTimeout(() => { btn.innerHTML = "📺 Picture-in-Picture"; }, 2000);
      }
    });

    // Listen for pip exit via system
    document.addEventListener("leavepictureinpicture", () => {
      btn.innerHTML = "📺 Picture-in-Picture";
    });

    wrapper.appendChild(btn);

    const label = document.createElement("span");
    label.textContent = "🛡️ Wahid Blocker";
    label.style.cssText = "font-size:10px;color:#666;font-family:sans-serif;";
    wrapper.appendChild(label);

    belowPlayer.parentNode.insertBefore(wrapper, belowPlayer);
  };
  tryInject();
}
