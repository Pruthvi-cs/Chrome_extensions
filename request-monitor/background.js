const tabData = new Map();
const MAX_REQUESTS = 500;
let persistTimer = null;

async function persistData() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    const serializable = {};
    for (const [tabId, data] of tabData.entries()) {
      serializable[String(tabId)] = {
        pageUrl: data.pageUrl,
        pageHost: data.pageHost,
        listening: data.listening,
        clearStart: data.clearStart,
        pageTiming: data.pageTiming || null,
        requests: data.requests.slice(-MAX_REQUESTS)
      };
    }
    await chrome.storage.session.set({ requestMonitorData: serializable });
  }, 100);
}

async function restoreData() {
  const saved = await chrome.storage.session.get("requestMonitorData");
  for (const [tabId, data] of Object.entries(saved.requestMonitorData || {})) {
    tabData.set(Number(tabId), {
      pageUrl: data.pageUrl || "",
      pageHost: data.pageHost || "",
      listening: data.listening !== false,
      clearStart: data.clearStart || Date.now(),
      pageTiming: data.pageTiming || null,
      requests: Array.from(data.requests || [])
    });
  }
}

restoreData();

function getData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, {
      pageUrl: "",
      pageHost: "",
      requests: [],
      clearStart: Date.now(),
      listening: true
    });
  }
  return tabData.get(tabId);
}

function resetData(tabId, tabUrl) {
  let pageUrl = tabUrl || "";
  let pageHost = "";
  try {
    if (/^https?:/.test(pageUrl)) pageHost = new URL(pageUrl).hostname;
  } catch (_) {}

  tabData.set(tabId, {
    pageUrl,
    pageHost,
    requests: [],
    clearStart: Date.now(),
    listening: true
  });
  persistData();
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    const data = getData(tabId);
    const nextUrl = tab.url || tab.pendingUrl || "";
    let nextHost = "";
    try {
      nextHost = new URL(nextUrl).hostname;
    } catch (_) {}

    if (!data.pageHost || !nextHost || data.pageHost !== nextHost) {
      resetData(tabId, nextUrl);
    } else {
      data.pageUrl = nextUrl;
    }
  }
  if (changeInfo.status === "complete") {
    const data = getData(tabId);
    data.pageUrl = tab.url || data.pageUrl;
    try {
      data.pageHost = new URL(data.pageUrl).hostname;
    } catch (_) {}
    persistData();
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    const data = getData(tabId);
    data.pageUrl = tab.url || "";
    try {
      data.pageHost = new URL(data.pageUrl).hostname;
    } catch (_) {
      data.pageHost = "";
    }
  } catch (_) {}
});

chrome.tabs.onRemoved.addListener((tabId) => tabData.delete(tabId));

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) await chrome.sidePanel.open({ windowId: tab.windowId });
});

function addRequest(details, update) {
  if (details.tabId < 0) return;
  const data = getData(details.tabId);
  if (!data.listening) return;

  let url;
  let host = "";
  try {
    url = new URL(details.url);
    host = url.hostname;
  } catch (_) {
    url = null;
  }

  let request = data.requests.find((item) => item.requestId === details.requestId);
  if (!request) {
    request = {
      requestId: details.requestId,
      method: details.method || "GET",
      url: details.url,
      host,
      path: url?.pathname || "",
      protocol: url?.protocol || "",
      type: details.type || "other",
      initiator: details.initiator || "",
      status: "Pending",
      fromCache: false,
      ip: "",
      requestBodyBytes: 0,
      responseBodyBytes: null,
      startTime: details.timeStamp,
      endTime: null,
      duration: null,
      transferredBytes: null,
      redirectCount: 0,
      error: ""
    };

    data.requests.push(request);
    if (data.requests.length > MAX_REQUESTS) data.requests.shift();
  }

  if (update.statusCode) request.status = String(update.statusCode);
  if (update.fromCache != null) request.fromCache = update.fromCache;
  if (update.ip) request.ip = update.ip;
  if (update.error) request.error = update.error;

  if (details.requestBody) {
    request.requestBodyBytes = estimateRequestBody(details.requestBody);
  }

  persistData();
}

function estimateRequestBody(requestBody) {
  if (!requestBody) return 0;
  if (typeof requestBody.raw === "object" && Array.isArray(requestBody.raw)) {
    return requestBody.raw.reduce((total, item) => total + (item.bytes?.byteLength || item.bytes?.length || 0), 0);
  }
  if (requestBody.formData) {
    return JSON.stringify(requestBody.formData).length;
  }
  return 0;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => addRequest(details, {}),
  { urls: ["http://*/*", "https://*/*"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const data = getData(details.tabId);
    const request = data.requests.find((item) => item.requestId === details.requestId);
    if (request) request.redirectCount++;
  },
  { urls: ["http://*/*", "https://*/*"] }
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => addRequest(details, { statusCode: details.statusLine?.match(/(\d{3})/)?.[1] }),
  { urls: ["http://*/*", "https://*/*"] },
  []
);

chrome.webRequest.onResponseStarted.addListener(
  (details) => addRequest(details, {
    statusCode: details.statusCode,
    fromCache: details.fromCache,
    ip: details.ip
  }),
  { urls: ["http://*/*", "https://*/*"] }
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const data = getData(details.tabId);
    const request = data.requests.find((item) => item.requestId === details.requestId);
    if (!request) return;
    request.status = String(details.statusCode || request.status);
    request.fromCache = Boolean(details.fromCache);
    request.ip = details.ip || request.ip;
    request.endTime = details.timeStamp;
    request.duration = Math.max(0, details.timeStamp - request.startTime);
  },
  { urls: ["http://*/*", "https://*/*"] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => addRequest(details, { error: details.error }),
  { urls: ["http://*/*", "https://*/*"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "rm:pageTiming" && sender.tab?.id) {
    const data = getData(sender.tab.id);
    data.pageTiming = message.timing;
    persistData();
  }

  if (message?.type === "rm:getReport") {
    const data = getData(message.tabId);
    sendResponse({
      pageUrl: data.pageUrl,
      pageHost: data.pageHost,
      listening: data.listening,
      clearStart: data.clearStart,
      pageTiming: data.pageTiming || null,
      requests: data.requests.map((request) => ({ ...request }))
    });
    return true;
  }

  if (message?.type === "rm:setListening") {
    const data = getData(message.tabId);
    data.listening = Boolean(message.enabled);
    persistData();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "rm:clear") {
    const data = getData(message.tabId);
    data.requests = [];
    data.clearStart = Date.now();
    persistData();
    sendResponse({ ok: true });
    return true;
  }
});
