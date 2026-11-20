let activeTabId = null;
let routeData = null;
let currentHops = [];

const domainEl = document.getElementById("domain");
const destinationIpEl = document.getElementById("destinationIp");
const thirdPartyCountEl = document.getElementById("thirdPartyCount");
const redirectCountEl = document.getElementById("redirectCount");
const traceButton = document.getElementById("traceButton");
const traceStatus = document.getElementById("traceStatus");
const latencyList = document.getElementById("latencyList");
const diagnoseButton = document.getElementById("diagnoseButton");
const diagnosis = document.getElementById("diagnosis");

const map = L.map("map", {
  zoomControl: true,
  attributionControl: true,
  preferCanvas: true
}).setView([20, 0], 2);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap &copy; CARTO"
}).addTo(map);

let routeLayer = L.layerGroup().addTo(map);

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  activeTabId = tab.id;
  return tab;
}

async function refreshState() {
  if (!activeTabId) await getActiveTab();
  if (!activeTabId) return;

  chrome.runtime.sendMessage({
    type: "nt:getState",
    tabId: activeTabId
  }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    routeData = response;
    try {
      domainEl.textContent = response.domain || "Unknown domain";
    } catch {
      domainEl.textContent = "Unknown domain";
    }
    destinationIpEl.textContent = response.destinationIp || "--";
    thirdPartyCountEl.textContent = String(response.thirdPartyDomains?.length || 0);
    redirectCountEl.textContent = String(response.redirects?.length || 0);
  });
}

function latencyColor(latency) {
  if (latency >= 150) return "#f87171";
  if (latency >= 80) return "#fb923c";
  return "#34d399";
}

function renderLatency(hops) {
  if (!hops.length) {
    latencyList.innerHTML = '<p class="empty">No public hops were reported.</p>';
    return;
  }

  const maxLatency = Math.max(...hops.map((hop) => hop.latency || 0), 1);
  latencyList.innerHTML = "";

  hops.forEach((hop, index) => {
    const row = document.createElement("div");
    row.className = "latency-row";
    const width = hop.latency ? Math.max(4, (hop.latency / maxLatency) * 100) : 2;
    row.innerHTML = `
      <span class="hop-number">${String(index + 1).padStart(2, "0")}</span>
      <div class="hop-info">
        <div class="hop-label">
          <strong title="${escapeHtml(hop.ip)}">${escapeHtml(hop.city || "Unknown")}</strong>
          <span>${hop.latency ? `${hop.latency.toFixed(1)} ms` : "timeout"}</span>
        </div>
        <div class="bar-track">
          <div class="bar" style="width:${width}%;background:${latencyColor(hop.latency)}"></div>
        </div>
      </div>`;
    latencyList.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderMap(hops) {
  routeLayer.clearLayers();

  const points = hops
    .filter((hop) => Number.isFinite(hop.lat) && Number.isFinite(hop.lon))
    .map((hop) => ({
      hop,
      latLng: [hop.lat, hop.lon]
    }));

  if (!points.length) {
    map.setView([20, 0], 2);
    return;
  }

  const latLngs = [];
  points.forEach(({ hop, latLng }, index) => {
    latLngs.push(latLng);
    const color = latencyColor(hop.latency);
    const marker = L.circleMarker(latLng, {
      radius: index === points.length - 1 ? 8 : 6,
      color: "#e0f2fe",
      weight: 1,
      fillColor: color,
      fillOpacity: 0.92
    });
    marker.bindPopup(`
      <strong>Hop ${index + 1}</strong><br>
      ${escapeHtml(hop.ip)}<br>
      ${escapeHtml(hop.city || "Unknown")}, ${escapeHtml(hop.country || "")}<br>
      ${escapeHtml(hop.asn || "ASN unknown")}<br>
      ${hop.latency ? `${hop.latency.toFixed(1)} ms` : "timeout"}
    `);
    marker.addTo(routeLayer);
  });

  L.polyline(latLngs, {
    color: "#67e8f9",
    weight: 2,
    opacity: 0.78,
    dashArray: "5 7"
  }).addTo(routeLayer);

  if (latLngs.length === 1) {
    map.setView(latLngs[0], 5);
  } else {
    map.fitBounds(latLngs, { padding: [30, 30], maxZoom: 7 });
  }
}

traceButton.addEventListener("click", async () => {
  await getActiveTab();
  if (!activeTabId) return;

  await refreshState();
  traceButton.disabled = true;
  traceStatus.textContent = "Tracing...";
  diagnosis.textContent = "Trace a route to generate an AI diagnosis.";
  diagnoseButton.disabled = true;

  chrome.runtime.sendMessage({
    type: "nt:trace",
    tabId: activeTabId,
    domain: routeData?.domain
  }, (response) => {
    traceButton.disabled = false;
    if (chrome.runtime.lastError) {
      traceStatus.textContent = chrome.runtime.lastError.message;
      return;
    }
    if (!response?.ok) {
      traceStatus.textContent = response?.error || "Trace failed";
      return;
    }

    currentHops = response.hops || [];
    routeData = response.routeData || routeData;
    traceStatus.textContent = `${currentHops.length} public hops`;
    renderLatency(currentHops);
    renderMap(currentHops);
    diagnoseButton.disabled = !currentHops.length;
  });
});

diagnoseButton.addEventListener("click", () => {
  diagnoseButton.disabled = true;
  diagnosis.textContent = "Analyzing route...";

  chrome.runtime.sendMessage({
    type: "nt:diagnose",
    hops: currentHops,
    routeData
  }, (response) => {
    diagnoseButton.disabled = false;
    if (chrome.runtime.lastError) {
      diagnosis.textContent = chrome.runtime.lastError.message;
      return;
    }
    diagnosis.textContent = response?.ok
      ? response.text
      : response?.error || "Diagnosis failed.";
  });
});

getActiveTab().then(refreshState);
setInterval(refreshState, 3000);
