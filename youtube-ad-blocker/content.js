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

let enabled = true;

function removeAds() {
  if (!enabled) {
    return;
  }

  document.querySelectorAll(AD_SELECTORS.join(",")).forEach((element) => {
    element.remove();
  });

  const video = document.querySelector("video");
  const player = document.querySelector(".html5-video-player");
  if (video && player?.classList.contains("ad-showing")) {
    const skipButton = document.querySelector(".ytp-ad-skip-button, .ytp-ad-skip-button-modern");
    skipButton?.click();

    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = video.duration;
    }
  }
}

chrome.storage.local.get({ enabled: true }).then(({ enabled: storedEnabled }) => {
  enabled = storedEnabled;
  removeAds();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.enabled) {
    enabled = changes.enabled.newValue;
    removeAds();
  }
});

const observer = new MutationObserver(removeAds);
observer.observe(document.documentElement, { childList: true, subtree: true });
setInterval(removeAds, 1000);
