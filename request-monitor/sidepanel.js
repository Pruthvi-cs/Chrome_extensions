let activeTabId = null;
let report = null;
let listening = true;
let selectedRequest = null;

const domainEl = document.getElementById("domain");
const listenButton = document.getElementById("listenButton");
const clearButton = document.getElementById("clearButton");
const searchInput = document.getElementById("search");
const protocolFilter = document.getElementById("protocolFilter");
const typeFilter = document.getElementById("typeFilter");
const requestList = document.getElementById("request-list");
const detailPanel = document.getElementById("detail-panel");
const detailList = document.getElementById("detail-list");

function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  activeTabId = tab.id;
  if (/^https?:\/\//.test(tab.url || "")) {
    domainEl.textContent = new URL(tab.url).hostname;
  } else {
    domainEl.textContent = "No website selected";
  }
  return tab;
}

function statusClass(status) {
  const code = Number(status);
  if (status === "Pending") return "status-pending";
  if (code >= 400 || !Number.isFinite(code)) return "status-error";
  return "status-success";
}

function getReceivedSize(request) {
  const timing = (report?.pageTiming || []).find((entry) => entry.name === request.url);
  return timing?.encodedSize
    ?? timing?.transferredSize
    ?? request.responseBodyBytes
    ?? null;
}

function renderDetails(request) {
  selectedRequest = request;
  const received = getReceivedSize(request);
  const headersToText = (headers) => Array.isArray(headers)
    ? headers.map((header) => `${header.name}: ${header.value}`).join("\n")
    : "Unavailable";
  const timings = request.har?.timings
    ? Object.entries(request.har.timings).map(([name, value]) => `${name}: ${value} ms`).join("\n")
    : "Unavailable";
  const rows = [
    ["URL", request.url],
    ["Method", request.method],
    ["Status", request.status],
    ["Resource type", request.type],
    ["Host", request.host],
    ["IP", request.ip || "Unavailable"],
    ["Initiator", request.initiator || "Unavailable"],
    ["Duration", request.duration == null ? "Pending" : `${request.duration.toFixed(1)} ms`],
    ["Sent", formatBytes(request.requestBodyBytes)],
    ["Received", formatBytes(received)],
    ["From cache", request.fromCache ? "Yes" : "No"],
    ["Redirects", String(request.redirectCount)],
    ["Error", request.error || "None"],
    ["Request Body", request.requestBody
      ? request.requestBody.slice(0, 5000)
      : "No request body captured"],
    ["Response Body", request.responseBody
      ? request.responseBody.slice(0, 5000)
      : "No response body captured"],
    ["Request Headers", headersToText(request.requestHeaders)],
    ["Response Headers", headersToText(request.responseHeaders)],
    ["Request Cookies", headersToText(request.har?.cookies?.request)],
    ["Response Cookies", headersToText(request.har?.cookies?.response)],
    ["Timing Breakdown", timings],
    ["Server IP", request.har?.serverIPAddress || request.ip || "Unavailable"],
    ["Connection", String(request.har?.connection || "Unavailable")],
    ["MIME Type", request.har?.mimeType || "Unavailable"],
    ["Request Header Size", String(request.har?.requestHeaderSize ?? "Unavailable")],
    ["Response Header Size", String(request.har?.responseHeaderSize ?? "Unavailable")]
  ];

  detailList.replaceChildren();
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    detailList.append(term, description);
  }
  detailPanel.hidden = false;
}

function render() {
  if (!report) return;
  const query = searchInput.value.trim().toLower();
  const protocol = protocolFilter.value;
  const type = typeFilter.value;

  const requests = report.requests.filter((request) => {
    if (protocol && request.protocol !== protocol) return false;
    if (type && request.type !== type) return false;
    if (!query) return true;
    return `${request.url} ${request.host} ${request.path}`.toLower().includes(query);
  }).slice().reverse();

  const sent = report.requests.reduce((sum, item) => sum + (item.requestBodyBytes || 0), 0);
  const receivedTiming = (report.pageTiming || []).reduce(
    (sum, item) => sum + (item.transferredSize || item.encodedSize || 0),
    0
  );
  const errors = report.requests.filter((item) =>
    item.error || Number(item.status) >= 400
  ).length;

  document.getElementById("request-count").textContent = String(report.requests.length);
  document.getElementById("sent-size").textContent = formatBytes(sent);
  document.getElementById("received-size").textContent = formatBytes(receivedTiming);
  document.getElementById("error-count").textContent = String(errors);

  requestList.replaceChildren();
  if (!requests.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = listening ? "Waiting for network requests..." : "Capture paused.";
    requestList.appendChild(empty);
    return;
  }

  for (const request of requests) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "request-row";
    row.addEventListener("click", () => renderDetails(request));

    const method = document.createElement("span");
    method.className = "method";
    method.textContent = request.method;

    const status = document.createElement("span");
    status.className = statusClass(request.status);
    status.textContent = request.status;

    const url = document.createElement("span");
    url.className = "url";
    url.textContent = request.url || `${request.host}${request.path || "/"}`;
    url.title = request.url || "";

    const type = document.createElement("span");
    type.textContent = request.type;

    const time = document.createElement("span");
    time.textContent = request.duration == null ? "—" : `${Math.round(request.duration)} ms`;

    const sent = document.createElement("span");
    sent.textContent = formatBytes(request.requestBodyBytes);

    const received = document.createElement("span");
    received.textContent = formatBytes(getReceivedSize(request));

    row.append(method, status, url, type, time, sent, received);
    requestList.appendChild(row);
  }
}

function refreshReport() {
  if (!activeTabId) return;
  chrome.runtime.sendMessage({
    type: "rm:getReport",
    tabId: activeTabId
  }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    report = response;
    listening = response.listening;
    listenButton.textContent = listening ? "Pause" : "Resume";
    listenButton.classList.toggle("primary", listening);
    render();
  });
}

async function refresh() {
  await getActiveTab();
  refreshReport();
}

listenButton.addEventListener("click", () => {
  if (!activeTabId) return;
  listening = !listening;
  chrome.runtime.sendMessage({
    type: "rm:setListening",
    tabId: activeTabId,
    enabled: listening
  }, refreshReport);
});

clearButton.addEventListener("click", () => {
  if (!activeTabId) return;
  chrome.runtime.sendMessage({
    type: "rm:clear",
    tabId: activeTabId
  }, refreshReport);
});

document.getElementById("closeDetail").addEventListener("click", () => {
  selectedRequest = null;
  detailPanel.hidden = true;
});

document.getElementById("copyDetail").addEventListener("click", async () => {
  if (!selectedRequest) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(selectedRequest, null, 2));
  } catch (_) {}
});

searchInput.addEventListener("input", render);
protocolFilter.addEventListener("change", render);
typeFilter.addEventListener("change", render);
chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === activeTabId && changeInfo.status === "complete") refresh();
});

refresh();
setInterval(refreshReport, 1000);
