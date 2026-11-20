let blockingEnabled = true;
const removedElements = new WeakSet();
let blockedCount = 0;
let lastYouTubeAdVideo = null;
let youtubeAdHandledAt = 0;
let cleanupFrame = 0;

const AD_SELECTORS = [
  ".video-ads",
  ".ytp-ad-module",
  ".ytp-ad-overlay-container",
  "ytd-ad-slot-renderer",
  "ytd-display-ad-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-action-companion-ad-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-banner-promo-renderer",
  "ytd-statement-banner-renderer",
  "[data-ad-slot]",
  "[data-advertisement]",
  "[data-testid='ad-slot']",
  "[class*='sponsored-content']",
  "[class*='advertisement']",
  "[id*='google_ads']",
  ".adsbygoogle"
];

const AD_TEXT_PATTERN = /(^|\s)(advertisement|sponsored)(\s|$)/i;

function reportBlocked(count = 1) {
  if (!count) return;
  blockedCount += count;
  chrome.runtime.sendMessage({
    type: "AD_BLOCKED",
    count
  });
}

function removePageAds() {
  if (!blockingEnabled) return;

  for (const element of document.querySelectorAll(AD_SELECTORS.join(","))) {
    if (removedElements.has(element)) continue;
    removedElements.add(element);
    element.remove();
    reportBlocked();
  }

  for (const element of document.querySelectorAll("aside, div, iframe, section")) {
    if (removedElements.has(element)) continue;
    if (!AD_TEXT_PATTERN.test(element.textContent?.trim().slice(0, 80) || "")) continue;

    const className = element.className?.toString().toLowerCase() || "";
    if (!/(ad|promo|sponsor)/.test(className)) continue;

    removedElements.add(element);
    element.remove();
    reportBlocked();
  }

  skipYouTubeAd();
  hideSpotifyAd();
}

function skipYouTubeAd() {
  if (!location.hostname.endsWith("youtube.com")) return;

  const player = document.querySelector(".html5-video-player");
  const video = document.querySelector("video");
  if (!player?.classList.contains("ad-showing") || !video) {
    lastYouTubeAdVideo = null;
    return;
  }

  const now = Date.now();
  if (now - youtubeAdHandledAt < 500) return;

  const skipButton = document.querySelector(
    ".ytp-ad-skip-button, .ytp-ad-skip-button-modern"
  );
  if (skipButton) {
    youtubeAdHandledAt = now;
    skipButton.click();
  }

  if (lastYouTubeAdVideo !== video) {
    lastYouTubeAdVideo = video;
    reportBlocked();
  }
}

function hideSpotifyAd() {
  const adElements = document.querySelectorAll(
    '[data-testid="leaderboard-ad"], [data-testid="ad-slot"], [data-testid="now-playing-ad"]'
  );
  for (const element of adElements) {
    if (removedElements.has(element)) continue;
    removedElements.add(element);
    element.remove();
    reportBlocked();
  }
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  blockingEnabled = enabled;
  removePageAds();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.enabled) {
    blockingEnabled = changes.enabled.newValue;
  }
});

new MutationObserver(() => {
  if (cleanupFrame) return;
  cleanupFrame = requestAnimationFrame(() => {
    cleanupFrame = 0;
    removePageAds();
  });
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

setInterval(removePageAds, 1500);
