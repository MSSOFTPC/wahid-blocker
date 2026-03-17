// =============================================
// WAHID BLOCKER - Content Script v3.0
// =============================================

(async function () {
  const { settings: S } = await chrome.storage.local.get("settings");
  if (!S || !S.enabled) return;

  // ── 1. Ads Blocker ──────────────────────────────────────────────────────────
  if (S.adBlockEnabled) {
    const adCSS = document.createElement("style");
    adCSS.id = "wb-ads";
    adCSS.textContent = `
      ins.adsbygoogle,.adsbygoogle,[id^="google_ads_"],[id^="div-gpt-ad"],
      [class*="gpt-ad"],iframe[src*="doubleclick"],iframe[src*="googlesyndication"],
      iframe[src*="adservice.google"],iframe[src*="amazon-adsystem"],
      iframe[src*="adnxs.com"],iframe[src*="outbrain"],iframe[src*="taboola"],
      .OUTBRAIN,[id*="taboola"],[class*="taboola"],.trc_rbox_div,
      [data-ad="true"],[class*="ad-slot"],[class*="ad-container"],[class*="ad-wrapper"],
      [class*="advertisement"],[class*="ads-container"],[id*="adsense"],
      [class*="banner-ad"],[class*="popup-ad"],[class*="interstitial"] {
        display:none!important;height:0!important;width:0!important;
        min-height:0!important;overflow:hidden!important;
        margin:0!important;padding:0!important;
        position:absolute!important;top:-9999px!important;left:-9999px!important;
      }
    `;
    (document.head || document.documentElement).appendChild(adCSS);

    const AD_SRCS = ["doubleclick.net","googlesyndication","adservice.google",
      "amazon-adsystem","adnxs.com","outbrain.com","taboola.com","criteo.com",
      "pubmatic.com","rubiconproject.com","moatads.com","scorecardresearch.com"];
    function cleanAds() {
      document.querySelectorAll("iframe,ins,script[src]").forEach(el => {
        const src = el.src || el.href || "";
        if (AD_SRCS.some(p => src.includes(p))) el.remove();
      });
    }
    cleanAds();
    new MutationObserver(cleanAds).observe(document.documentElement, { childList: true, subtree: true });
  }

  // ── 2. Dark Mode ────────────────────────────────────────────────────────────
  if (S.darkModeEnabled) {
    const dm = document.createElement("style");
    dm.id = "wb-darkmode";
    dm.textContent = `
      html { color-scheme: dark !important; filter: invert(1) hue-rotate(180deg) !important; }
      img, video, iframe, canvas, picture, svg { filter: invert(1) hue-rotate(180deg) !important; }
    `;
    (document.head || document.documentElement).appendChild(dm);
  }

  // ── 3. Night Shield ─────────────────────────────────────────────────────────
  if (S.nightShieldEnabled) {
    const opacity = ((S.nightShieldOpacity || 40) / 100) * 0.6;
    const overlay = document.createElement("div");
    overlay.id = "wb-night-shield";
    overlay.style.cssText = `
      position:fixed!important;inset:0!important;z-index:2147483647!important;
      background:rgba(255,140,0,${opacity})!important;
      pointer-events:none!important;mix-blend-mode:multiply!important;
    `;
    document.documentElement.appendChild(overlay);
  }

  // ── 4. Reader Mode ──────────────────────────────────────────────────────────
  if (S.readerModeEnabled) {
    // Wait for DOM ready
    const applyReader = () => {
      if (document.getElementById("wb-reader")) return;

      // Extract main content
      const candidates = ["article","main","[role=main]","#content","#main-content",".post-content",".article-body",".entry-content"];
      let article = null;
      for (const sel of candidates) {
        article = document.querySelector(sel);
        if (article) break;
      }
      if (!article) return; // not an article page, skip

      const title = document.title;
      const imgs = [...article.querySelectorAll("img")].map(i => i.outerHTML).join("");
      const paras = [...article.querySelectorAll("p,h1,h2,h3,h4,blockquote")]
        .map(e => e.outerHTML).join("");

      const reader = document.createElement("div");
      reader.id = "wb-reader";
      reader.innerHTML = `
        <div style="
          position:fixed;inset:0;z-index:2147483640;
          background:#f5f0e8;color:#2a2a2a;overflow-y:auto;
          font-family:Georgia,serif;padding:40px 20px;
        ">
          <div style="max-width:680px;margin:0 auto;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #ddd;">
              <span style="font-size:18px;">🛡️</span>
              <span style="font-size:11px;color:#888;font-family:sans-serif;text-transform:uppercase;letter-spacing:1px;">Wahid Blocker — Reader Mode</span>
              <button id="wb-reader-close" style="margin-left:auto;background:#e63030;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-family:sans-serif;font-weight:700;">✕ Exit</button>
            </div>
            <h1 style="font-size:26px;font-weight:700;margin-bottom:20px;line-height:1.3;">${title}</h1>
            ${paras}
            ${imgs ? `<div style="margin-top:20px;">${imgs}</div>` : ""}
          </div>
        </div>
      `;
      document.body.appendChild(reader);
      document.getElementById("wb-reader-close").addEventListener("click", () => reader.remove());
    };

    if (document.readyState === "complete") applyReader();
    else window.addEventListener("load", applyReader);
  }

  // ── 5. Cookie Banner Remover ─────────────────────────────────────────────────
  if (S.cookieBannerBlock) {
    const COOKIE_SELECTORS = [
      "[id*='cookie'],[class*='cookie'],[id*='consent'],[class*='consent']",
      "[id*='gdpr'],[class*='gdpr'],[id*='privacy-banner']",
      "[class*='cookie-banner'],[class*='cookie-notice'],[class*='cookie-popup']",
      "[aria-label*='cookie'],[aria-label*='consent']",
      ".cc-window,.cc-banner,.cc-dialog",
      "#onetrust-consent-sdk,#onetrust-banner-sdk",
      ".cookielaw-alert,.cookie-law-info-bar",
      "#cookie-notice,#cookie-law-info-bar"
    ];
    function removeCookieBanners() {
      COOKIE_SELECTORS.forEach(sel => {
        try {
          document.querySelectorAll(sel).forEach(el => {
            // Check it's an overlay/banner (fixed or has accept button)
            const cs = window.getComputedStyle(el);
            if (cs.position === "fixed" || cs.position === "sticky" || el.querySelector("button")) {
              el.remove();
            }
          });
        } catch (e) {}
      });
      // Auto-click "Accept" buttons in cookie banners
      document.querySelectorAll("button,a").forEach(btn => {
        const txt = (btn.textContent || "").trim().toLowerCase();
        if (/^(accept all|accept cookies|i accept|got it|ok|agree)$/.test(txt)) {
          const parent = btn.closest("[id*='cookie'],[class*='cookie'],[id*='consent']");
          if (parent) { btn.click(); setTimeout(() => parent.remove(), 300); }
        }
      });
    }
    setTimeout(removeCookieBanners, 800);
    setTimeout(removeCookieBanners, 2500);
    new MutationObserver(() => setTimeout(removeCookieBanners, 200))
      .observe(document.body || document.documentElement, { childList: true, subtree: false });
  }

  // ── 6. Tracking Pixel Remover (part of adBlockEnabled) ─────────────────────
  if (S.adBlockEnabled) {
    const tpCSS = document.createElement("style");
    tpCSS.textContent = `
      img[width="1"][height="1"], img[width="0"][height="0"],
      img[src*="pixel"],img[src*="tracking"],img[src*="beacon"],
      img[src*="analytics"],img[src*="bat.bing"],img[src*="facebook.com/tr"] {
        display:none!important;
      }
    `;
    (document.head || document.documentElement).appendChild(tpCSS);
  }

})();
