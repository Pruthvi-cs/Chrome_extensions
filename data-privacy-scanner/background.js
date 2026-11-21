const tabReports = new Map();
const trackerHosts = [
  "google-analytics.com",
  "googletagmanager.com",
  "googleadservices.com",
  "doubleclick.net",
  "facebook.net",
  "connect.facebook.net",
  "hotjar.com",
  "clarity.ms",
  "mixpanel.com",
  "segment.com",
  "segment.io",
  "amplitude.com",
  "newrelic.com",
  "sentry.io",
  "adobedtm.com",
  "demdex.net",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "tiktok.com",
  "snapads.com",
  "quantserve.com",
  "scorecardresearch.com"
];

function createReport(tabId, tabUrl) {
  return {
    tabId,
    pageUrl: tabUrl || "",
    pageHost: tabUrl ? new URL(tabUrl).hostname : "",
    startedAt: Date.now(),
    thirdPartyHosts: new Map(),
    trackerHosts: new Map(),
    cookieHosts: new Map(),
    collectionSignals: new Map(),
    storage: {
      localStorageKeys: 0,
      sessionStorageKeys: 0,
      indexedDb: false,
      clipboardReadAttempt: false,
      geolocationAttempt: false,
      cameraAttempt: false,
      microphoneAttempt: false,
      notificationAttempt: false
    }
  };
}

function getReport(tabId) {
  if (!tabReports.has(tabId)) tabReports.set(tabId, createReport(tabId, ""));
  return tabReports.get(tabId);
}

function classifyHost(host) {
  return trackerHosts.find((tracker) =>
    host === tracker || host.endsWith(`.${tracker}`)
  );
}

function resetReport(tabId, tabUrl) {
  tabReports.set(tabId, createReport(tabId, tabUrl));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") resetReport(tabId, tab.url || tab.pendingUrl);
});

chrome.tabs.onRemoved.addListener((tabId) => tabReports.delete(tabId));

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.tabId || details.tabId < 0 || details.type === "main_frame") return;
    const report = getReport(details.tabId);
    if (!report.pageHost) {
      chrome.tabs.get(details.tabId).then((tab) => {
        if (tab.url) report.pageUrl = tab.url;
        try {
          report.pageHost = tab.url ? new URL(tab.url).hostname : "";
        } catch (_) {}
      }).catch(() => {});
    }

    let host;
    try {
      host = new URL(details.url).hostname;
    } catch (_) {
      return;
    }

    if (report.pageHost && host !== report.pageHost &&
        !host.endsWith(`.${report.pageHost}`) &&
        !report.pageHost.endsWith(`.${host}`)) {
      report.thirdPartyHosts.set(host, (report.thirdPartyHosts.get(host) || 0) + 1);
    }

    const tracker = classifyHost(host);
    if (tracker) {
      report.trackerHosts.set(tracker, (report.trackerHosts.get(tracker) || 0) + 1);
    }

    const url = details.url.toLowerCase();
    if (/utm_|analytics|pixel|collect|telemetry|tracking|track\//i.test(url)) {
      report.collectionSignals.set(
        "Analytics or tracking parameters",
        (report.collectionSignals.get("Analytics or tracking parameters") || 0) + 1
      );
    }
  },
  { urls: ["http://*/*", "https://*/*"] },
  []
);

async function refreshCookies(report) {
  if (!report.pageUrl) return;
  report.cookieHosts.clear();
  const cookies = await chrome.cookies.getAll({ url: report.pageUrl });
  for (const cookie of cookies) {
    const name = cookie.domain || report.pageHost;
    report.cookieHosts.set(name, (report.cookieHosts.get(name) || 0) + 1);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "privacy:pageSignals" && sender.tab?.id) {
    const report = getReport(sender.tab.id);
    Object.assign(report.storage, message.storage || {});
    for (const signal of message.signals || []) {
      report.collectionSignals.set(
        signal,
        (report.collectionSignals.get(signal) || 0) + 1
      );
    }
  }

  if (message.type === "privacy:getReport") {
    const report = getReport(message.tabId);
    refreshCookies(report).then(() => {
      sendResponse({
        pageUrl: report.pageUrl,
        pageHost: report.pageHost,
        thirdPartyHosts: [...report.thirdPartyHosts.entries()],
        trackerHosts: [...report.trackerHosts.entries()],
        cookieHosts: [...report.cookieHosts.entries()],
        collectionSignals: [...report.collectionSignals.entries()],
        storage: report.storage,
        startedAt: report.startedAt
      });
    }).catch(() => {
      sendResponse({
        pageUrl: report.pageUrl,
        pageHost: report.pageHost,
        thirdPartyHosts: [...report.thirdPartyHosts.entries()],
        trackerHosts: [...report.trackerHosts.entries()],
        cookieHosts: [...report.cookieHosts.entries()],
        collectionSignals: [...report.collectionSignals.entries()],
        storage: report.storage,
        startedAt: report.startedAt
      });
    });
    return true;
  }
});
