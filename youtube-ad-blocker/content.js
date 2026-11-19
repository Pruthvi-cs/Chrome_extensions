const AD_SELECTORS = [
  ".video-ads",
  ".ytp-ad-module",
  ".ytp-ad-overlay-container",
  ".ytp-ad-text",
  "ytd-display-ad-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-action-companion-ad-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-banner-promo-renderer",
  "ytd-statement-banner-renderer"
];

let blockingEnabled = true;

function skipVideoAd() {
  const player = document.querySelector(".html5-video-player");
  const video = document.querySelector("video");

  if (!player?.classList.contains("ad-showing") || !video) {
    return;
  }

  document
    .querySelector(".ytp-ad-skip-button, .ytp-ad-skip-button-modern")
    ?.click();

  if (Number.isFinite(video.duration) && video.duration > 0) {
    video.currentTime = video.duration;
  }
}

function removePageAds() {
  if (!blockingEnabled) {
    return;
  }

  document.querySelectorAll(AD_SELECTORS.join(",")).forEach((element) => {
    element.remove();
  });

  skipVideoAd();
}

chrome.storage.local
  .get({ enabled: true })
  .then(({ enabled }) => {
    blockingEnabled = enabled;
    removePageAds();
  });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.enabled) {
    return;
  }

  blockingEnabled = changes.enabled.newValue;
  removePageAds();
});

new MutationObserver(removePageAds).observe(document.documentElement, {
  childList: true,
  subtree: true
});

setInterval(removePageAds, 1000);
