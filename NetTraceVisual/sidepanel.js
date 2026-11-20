let activeTabId = null;
let routeData = null;

const domainEl = document.getElementById("domain");
const traceButton = document.getElementById("traceButton");
const pathList = document.getElementById("pathList");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  activeTabId = tab.id;
  if (tab.url?.startsWith("http")) {
    routeData = {
      ...(routeData || {}),
      domain: new URL(tab.url).hostname
    };
    domainEl.textContent = routeData.domain;
  }
  return tab;
}

function getState() {
  if (!activeTabId) return;
  chrome.runtime.sendMessage({
    type: "nt:getState",
    tabId: activeTabId
  }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    routeData = response;
    domainEl.textContent = response.domain || "Unknown domain";
  });
}

function renderPath(hops) {
  pathList.replaceChildren();
  if (!hops.length) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No public IPs returned.";
    pathList.appendChild(item);
    return;
  }

  for (const hop of hops) {
    const item = document.createElement("li");
    item.appendChild(document.createElement("strong")).textContent = hop.ip;

    const details = document.createElement("span");
    details.className = "hop-details";

    const location = [hop.city, hop.region, hop.country].filter(Boolean).join(", ");
    const server = hop.org || "Organization unavailable";
    const asn = hop.asn || "ASN unavailable";
    const ipType = hop.ip.includes(":") ? "IPv6" : "IPv4";
    const latency = hop.latency != null && hop.latency > 0
      ? `${Number(hop.latency).toFixed(1)} ms`
      : "Latency unavailable";

    details.textContent =
      `${location || "Location unavailable"} · ${server} · ${asn} · ${ipType} · ${latency}`;
    item.appendChild(details);
    pathList.appendChild(item);
  }
}

traceButton.addEventListener("click", async () => {
  await getActiveTab();
  if (!activeTabId) return;

  await getActiveTab();
  traceButton.disabled = true;
  traceButton.textContent = "Tracing...";
  pathList.innerHTML = '<li class="empty">Tracing route...</li>';

  chrome.runtime.sendMessage({
    type: "nt:trace",
    tabId: activeTabId,
    domain: routeData?.domain
  }, (response) => {
    traceButton.disabled = false;
    traceButton.textContent = "Trace Route";
    if (chrome.runtime.lastError) {
      pathList.innerHTML = `<li class="empty">${chrome.runtime.lastError.message}</li>`;
      return;
    }
    if (!response?.ok) {
      pathList.innerHTML = `<li class="empty">${response?.error || "Trace failed"}</li>`;
      return;
    }
    routeData = response.routeData || routeData;
    renderPath(response.hops || []);
  });
});

getActiveTab().then(getState);
