<div align="center">

<img src="https://img.shields.io/badge/Wahid%20Blocker-v3.0-e63030?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Wahid Blocker"/>
<img src="https://img.shields.io/badge/Manifest-v3-4499ff?style=for-the-badge" alt="Manifest v3"/>
<img src="https://img.shields.io/badge/License-MIT-22cc66?style=for-the-badge" alt="MIT"/>
<img src="https://img.shields.io/badge/Chrome-Extension-ff9944?style=for-the-badge&logo=googlechrome" alt="Chrome"/>

# 🛡️ Wahid Blocker

**The complete child safety & productivity Chrome Extension.**  
Blocks adult content, ads, spam, and distractions — with dark mode, night shield, reader mode, screen time tracking, and powerful analytics. Built on Manifest V3.

[Installation](#-installation) · [Features](#-features) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Contributing](#-contributing)

</div>

---

## 📦 Installation

> **No Chrome Web Store required** — install directly from source in under 60 seconds.

1. **Download** this repository as a ZIP and extract it, **or** clone it:
   ```bash
   git clone https://github.com/yourusername/wahid-blocker.git
   ```
2. Open Chrome and navigate to **`chrome://extensions/`**
3. Toggle **Developer mode** ON (top-right corner)
4. Click **"Load unpacked"**
5. Select the extracted `wahid-blocker` folder
6. The 🛡️ icon will appear in your Chrome toolbar — you're protected!

> ⚠️ After updating the code, click the **🔄 refresh** icon on the extension card at `chrome://extensions/` to reload changes.

---

## ✨ Features

Wahid Blocker is organized into **5 tabs**: Protect, Browse, Domains, Analytics, and Settings.

---

### 🛡️ Protect Tab

#### 🔞 Adult Content Block
Automatically blocks **30+ major adult, pornographic, and 18+ websites** the moment they are navigated to. Uses a built-in domain blocklist that is matched against every navigation. Blocked pages are replaced with the Wahid Blocker shield page instead of loading any content.

**Blocked categories include:** Pornographic streaming sites · Live cam platforms · Hentai & explicit art sites

---

#### 🚫 Spam & Phishing Block
Uses **heuristic pattern matching** on URLs in real time to detect and block harmful websites even if they are not on any static list. Catches phishing attempts, fake prize pages, virus scare pages, and gambling URLs automatically.

**Detected patterns include:**
- `free*(iphone|prize|winner|gift)`
- `virus*(alert|warning|detected)`
- `adult|xxx|sex|porn` in URL
- `casino|gambling|bet` patterns

---

#### 📢 Ads Blocker
Removes advertisements at two levels:

1. **Network level** — `declarativeNetRequest` rules block requests to 15+ known ad networks before they even load (Google Ads, DoubleClick, Taboola, Outbrain, Amazon DSP, AppNexus, and more).
2. **DOM level** — CSS collapses all ad containers to `height:0; width:0` with no leftover empty space. A `MutationObserver` watches for dynamically injected ads and removes them instantly.

Also removes **invisible 1×1 tracking pixels** from Facebook, Google, Bing, and analytics beacons.

---

#### 🔍 Safe Search
Forces **Google SafeSearch** to `active` on every Google search. When a search is detected, the extension automatically appends `&safe=active` to the query URL before the page loads — ensuring no explicit results appear.

---

#### 🎬 YouTube Complete Block
Entirely prevents access to YouTube (`youtube.com`, `youtu.be`). Any navigation attempt is intercepted and redirected to the Wahid Blocker shield page. Useful for households where YouTube should not be accessible at all.

---

#### 📵 YouTube Shorts Block Only
Blocks **only** the YouTube Shorts section while leaving all regular videos accessible. Works by:
- Intercepting navigations to `/shorts/` URLs and redirecting to the YouTube homepage
- Overriding `history.pushState` and `history.replaceState` to catch SPA navigation
- Injecting CSS to hide all Shorts shelf components in the YouTube feed

Normal YouTube videos, playlists, and subscriptions continue to work unaffected.

---

#### 🎯 YouTube Focus Mode
Adds a **🎯 Focus** button inside the YouTube player controls. When activated:
- Hides the entire sidebar (recommended videos, channel info)
- Hides comments section
- Hides end-screen cards and autoplay overlay
- Enters theater mode for a full-focus viewing experience
- Button toggles back to "✕ Exit Focus" — click again to restore the page

---

#### 🔒 YouTube Restrict Mode
Injects CSS to permanently hide distracting YouTube elements:
- **Shorts shelf** in home and subscription feeds
- **Comments section** on all videos
- **Recommended sidebar** on watch pages
- **Autoplay toggle** button
- **End-screen card overlays**
- **Homepage recommendation grid** (only search results shown)

---

#### 📺 YouTube PiP Button
Adds a **Picture-in-Picture button** directly below every YouTube video. Clicking it requests the browser's native PiP API, floating the video in a resizable overlay that persists while you switch tabs or windows. The button label updates to "✕ Exit PiP" while active, and reverts automatically when PiP is dismissed via the system.

---

#### 🔔 Block Notifications
Sends a **desktop notification** every time a site is blocked, showing the domain name and the reason for blocking (Adult/Spam Block, Custom Block, YouTube Block, Spam Detected, etc.). Can be toggled off if silent operation is preferred.

---

#### ⏱️ Screen Time Limit
Sets a **daily browsing limit in minutes**. A background alarm runs every minute and increments the usage counter. When the limit is reached, further navigation attempts are blocked and redirected to the shield page with the reason "Screen Time Limit Reached".

- Visual progress bar shows today's usage vs. the limit
- Counter resets automatically at midnight
- Configurable from 10 to 480 minutes per day

---

### 🌐 Browse Tab

#### 🌙 Dark Mode
Forces **dark mode on every website** by applying:
```css
html { color-scheme: dark; filter: invert(1) hue-rotate(180deg); }
img, video, iframe, canvas { filter: invert(1) hue-rotate(180deg); }
```
Images and videos are double-inverted to preserve their natural colors while the page background and text become dark. Works on virtually any website that does not already have a native dark mode.

---

#### 🔆 Night Shield
Overlays a **warm amber tinted layer** over every web page to reduce blue light emission, protecting your eyes during nighttime or low-light browsing. Implemented as a `position:fixed` full-viewport `div` with `mix-blend-mode: multiply` so text and images remain readable.

**Intensity slider** (10% – 80%) lets you control how warm the overlay appears. The setting is persisted and applied immediately on every page load.

---

#### 📖 Reader Mode
Strips any article or blog page down to **just the text content and images** — no navigation bars, sidebars, ads, popups, social widgets, or cookie banners. When enabled:

1. Scans the page for semantic article containers (`<article>`, `<main>`, `[role=main]`, `.post-content`, `.article-body`, etc.)
2. Extracts headings, paragraphs, blockquotes, and inline images
3. Renders them in a clean, serif-typography reader overlay with `max-width: 680px`
4. An **✕ Exit** button restores the original page

Best suited for news articles, blog posts, and documentation pages.

---

#### 🍪 Cookie Banner Remover
Automatically **dismisses GDPR/cookie consent popups** on page load. Uses a two-pass strategy:

1. **Selector matching** — identifies common cookie banner elements (OneTrust, CookieLaw, `#cookie-notice`, `[class*="consent"]`, etc.) and removes them
2. **Button clicking** — finds "Accept All", "I Accept", "Got it", "OK" buttons inside cookie containers and programmatically clicks them, then removes the container

Runs at 800ms and 2500ms after page load to catch both inline and async-loaded banners. A `MutationObserver` watches for late-appearing banners.

---

#### 👁️ Tracking Pixel Remover
CSS-based removal of **invisible tracking images** used by advertisers and analytics platforms:
- `img[width="1"][height="1"]`
- `img[src*="pixel"]`, `img[src*="tracking"]`, `img[src*="beacon"]`
- Facebook Pixel (`facebook.com/tr`)
- Bing UET (`bat.bing.com`)

These images are never displayed to users but are used to track browsing behavior across sites.

---

### 📋 Domains Tab

#### ➕ Block a Domain
Manually add any domain to the **custom blocklist**. Supports:
- Exact domain: `tiktok.com`
- Subdomains automatically matched: blocking `example.com` also blocks `sub.example.com`
- URL input is normalized (strips `https://`, `www.`, paths, query strings)

Added domains appear as removable **red pill tags** — click `×` to unblock instantly.

---

#### ✓ Whitelist (Always Allow)
Add trusted domains to the **whitelist** to exempt them from all blocking rules — including the adult blocklist, spam detection, and custom blocked domains. Useful for whitelisting school portals, trusted news sites, or work tools.

Whitelisted domains appear as **green pill tags** and are checked before any block rules apply.

---

### 📊 Analytics Tab

#### 📈 7-Day Bar Chart
Visualizes block activity over the **last 7 days** as a bar chart with daily labeled columns. Today's bar is highlighted in orange. The chart scales dynamically to the maximum value in the window.

---

#### 🃏 Stats Cards
Four summary cards displayed at a glance:
- **Total Blocked** — all-time cumulative block count
- **Today** — blocks recorded on the current date
- **Custom Rules** — number of manually added blocked domains
- **Streak** — consecutive days with at least one block event

---

#### 🏆 Top Blocked Domains
A ranked list of the **top 5 most frequently blocked domains** from the full activity log, with block counts displayed. Useful for identifying which sites are most persistently accessed.

---

#### 📤 Export Log
Exports the complete activity log as a **CSV file** (`wahid-blocker-log.csv`) containing domain, block reason, and ISO timestamp for every recorded block event. Useful for parental review or reporting.

---

### ⚙️ Settings Tab

#### 🔐 Parental Password Lock
Protect the extension settings with a password so children cannot modify blocking rules.

- **Set Password** — enter and save a password using the input field
- **Enable Lock** — activates the password gate; the popup will require the password on every open
- **Disable Lock** — removes the password requirement without deleting the stored password
- The **password unlock screen** appears over the entire popup UI and requires the correct password before any settings can be seen or changed
- Wrong password attempts show an error and clear the input field

---

#### 🔄 Reset All
Resets **all settings to factory defaults** (with a confirmation dialog). Clears custom domains, whitelists, activity log, passwords, and all feature toggles.

---

## 📊 Stats Bar (Always Visible)

Four live counters in the header area visible on every tab:

| Counter | Description |
|---------|-------------|
| **Blocked** | Total blocks across all time |
| **Session** | Blocks since the extension was last loaded |
| **Rules** | Count of custom blocked + whitelisted domains |
| **Today** | Blocks recorded on today's date |

---

## 🚫 Block Current Site Button

A **🚫 Block Site** button in the extension header instantly adds the currently active tab's domain to the custom blocklist. Provides visual feedback ("✅ Blocked!" in green) and handles edge cases like `chrome://` pages gracefully.

---

## 🔴 Master Toggle

A single **ON/OFF toggle** in the header enables or disables all protection features simultaneously. When disabled, no blocking, content injection, or monitoring takes place. The status indicator below the brand name updates to reflect the current state.

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Extension API** | Chrome Manifest V3 |
| **Background** | Service Worker (`background.js`) |
| **Blocking** | `webNavigation.onBeforeNavigate` + `declarativeNetRequest` |
| **Content Injection** | Content Scripts (DOM + CSS injection) |
| **Storage** | `chrome.storage.local` |
| **Notifications** | `chrome.notifications` |
| **Screen Time** | `chrome.alarms` (1-minute tick) |
| **UI** | Vanilla HTML/CSS/JS — no frameworks |
| **Fonts** | Google Fonts (Syne + DM Sans) |
| **Ad Rules** | JSON ruleset (`rules/ad_rules.json`) |

---

## 📁 File Structure

```
wahid-blocker/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker: blocking, logging, alarms
├── content.js             # Injected into all pages: ads, dark mode, night shield, reader, cookies
├── youtube-blocker.js     # Injected into YouTube: shorts, focus, PiP, ads
├── popup.html             # Extension popup UI (5 tabs)
├── popup.js               # Popup logic: settings, analytics, password, domains
├── blocked.html           # Page shown when a site is blocked
├── rules/
│   └── ad_rules.json      # declarativeNetRequest rules (15 ad networks)
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔒 Permissions Explained

| Permission | Why It's Needed |
|------------|----------------|
| `storage` | Save settings and activity log locally |
| `tabs` | Read current tab URL for "Block Site" button |
| `webNavigation` | Intercept page navigations before they load |
| `declarativeNetRequest` | Block ad network requests at the network level |
| `declarativeNetRequestWithHostAccess` | Required for dynamic network blocking |
| `notifications` | Show desktop alerts when a site is blocked |
| `alarms` | Run the screen time counter every minute |
| `host_permissions: *://*/*` | Inject content scripts into all web pages |

> **No data is ever sent externally.** All settings and logs are stored locally using `chrome.storage.local` and never leave your device.

---

## 🛡️ Default Blocked Domains (Built-in List)

The extension ships with a curated blocklist of **30+ domains** across categories:

| Category | Examples |
|----------|---------|
| Adult / Pornographic | pornhub.com, xvideos.com, xnxx.com, onlyfans.com, chaturbate.com (+20 more) |
| Live Cam Platforms | cam4.com, stripchat.com, bongacams.com, myfreecams.com, livejasmin.com |
| Gambling | bet365.com, pokerstars.com, 888casino.com, betway.com, casino.com |
| Explicit Art | nhentai.net, rule34.xxx, e621.net |
| Phishing / Scam | free-iphone-winner.com, claim-your-prize.com, virus-alert-fix.com |

Custom domains can be added/removed at any time from the Domains tab.

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- [ ] Add more built-in blocked domains
- [ ] Add `chrome.storage.sync` support for cross-device settings
- [ ] Export/import settings as JSON
- [ ] Add per-domain time limits
- [ ] Add a schedule (e.g., block YouTube only on weekdays)
- [ ] Support Firefox (WebExtensions API compatibility)

**To contribute:**
1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push and open a Pull Request

---

## 📄 License

```
MIT License — Copyright (c) 2025 Wahid Blocker Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, subject to the standard MIT conditions.
```

---

<div align="center">

Made with ❤️ for safer browsing · **Wahid Blocker v3.0**

⭐ Star this repo if it helped you · 🐛 Open an issue for bugs · 💡 PRs welcome

</div>