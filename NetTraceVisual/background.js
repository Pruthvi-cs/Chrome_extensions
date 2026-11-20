const tabData = new Map();

function getData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, {
      domain: null,
      destinationIp: null,
      redirects: [],
      thirdPartyDomains: new Set()
    });
  }
  return tabData.get(tabId);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    tabData.set(tabId, {
      domain: null,
      destinationIp: null,
      redirects: [],
      thirdPartyDomains: new Set()
    });
  }
  if (tab.url?.startsWith("http")) {
    getData(tabId).domain = new URL(tab.url).hostname;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => tabData.delete(tabId));

chrome.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const data = getData(details.tabId);
    data.redirects.push({
      from: details.url,
      redirectUrl: details.redirectUrl,
      statusCode: details.statusCode,
      timeStamp: details.timeStamp
    });
  },
  { urls: ["<all_urls>"] }
);

chrome.webRequest.onResponseStarted.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const data = getData(details.tabId);
    if (details.type === "main_frame" && details.ip) data.destinationIp = details.ip;

    try {
      const requestUrl = new URL(details.url);
      if (data.domain && requestUrl.hostname !== data.domain &&
          !requestUrl.hostname.endsWith(`.${data.domain}`)) {
        data.thirdPartyDomains.add(requestUrl.hostname);
      }
    } catch {}
  },
  { urls: ["http://*/*", "https://*/*"] }
);

async function geolocate(ip) {
  if (!ip || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|::1)/.test(ip)) {
    return { ip, city: "Private network", region: "", country: "", lat: null, lon: null, asn: "", org: "Private network" };
  }
  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!response.ok) throw new Error("Geolocation failed");
    const value = await response.json();
    return {
      ip,
      city: value.city || "Unknown",
      region: value.region || "",
      country: value.country_name || value.country || "",
      lat: value.latitude ?? null,
      lon: value.longitude ?? null,
      asn: value.asn || "",
      org: value.org || value.asn || "Organization unavailable"
    };
  } catch {
    return { ip, city: "Unknown", region: "", country: "", lat: null, lon: null, asn: "", org: "Organization unavailable" };
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function globalpingTrace(domain) {
  const createResponse = await fetch("https://api.globalping.io/v1/measurements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "traceroute",
      target: domain,
      limit: 1,
      locations: [{ country: "US" }, { country: "GB" }, { country: "DE" }]
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Globalping request failed (${createResponse.status})`);
  }

  const created = await createResponse.json();
  const measurementId = created.id;
  if (!measurementId) throw new Error("Globalping did not return a measurement ID.");

  let result = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await wait(attempt === 0 ? 1000 : 1500);
    const response = await fetch(`https://api.globalping.io/v1/measurements/${measurementId}`);
    if (!response.ok) continue;
    result = await response.json();
    if (result.status === "finished") break;
  }

  if (!result?.results?.length) throw new Error("Traceroute did not return results.");

  const hops = [];
  for (const probe of result.results) {
    const probeHops = probe?.result?.hops || [];
    for (const hop of probeHops) {
      const ip = hop?.resolvedAddress || hop?.address || hop?.ip;
      if (!ip || hop?.timeout) continue;
      hops.push({
        ttl: Number(hop.ttl || hop.hop || hops.length + 1),
        ip,
        latency: Number(hop?.rtt?.[0] ?? hop?.rtt ?? hop?.latency ?? 0)
      });
    }
  }

  const unique = new Map();
  for (const hop of hops) {
    if (!unique.has(hop.ip)) unique.set(hop.ip, hop);
  }
  return [...unique.values()].sort((a, b) => a.ttl - b.ttl);
}

async function backendTrace(endpoint, domain) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain })
  });
  if (!response.ok) throw new Error(`Trace backend failed (${response.status})`);
  const result = await response.json();
  const hops = Array.isArray(result) ? result : result.hops;
  if (!Array.isArray(hops)) throw new Error("Trace backend returned no hops.");
  return hops.map((hop, index) => ({
    ttl: Number(hop.ttl || hop.hop || index + 1),
    ip: String(hop.ip || hop.address || ""),
    latency: Number(hop.latency || hop.rtt || hop.avg || 0)
  })).filter((hop) => hop.ip);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "nt:getState") {
    const tabId = message.tabId;
    const data = getData(tabId);
    sendResponse({
      domain: data.domain,
      destinationIp: data.destinationIp,
      redirects: data.redirects,
      thirdPartyDomains: [...data.thirdPartyDomains]
    });
    return true;
  }

  if (message?.type === "nt:trace") {
    (async () => {
      const tabId = message.tabId;
      const data = getData(tabId);
      const domain = message.domain || data.domain;
      if (!domain) throw new Error("No active HTTP domain found.");

      const settings = await chrome.storage.sync.get(["traceEndpoint"]);
      const rawHops = settings.traceEndpoint
        ? await backendTrace(settings.traceEndpoint, domain)
        : await globalpingTrace(domain);

      const hops = [];
      for (const hop of rawHops) {
        hops.push({ ...hop, ...(await geolocate(hop.ip)) });
      }
      sendResponse({ ok: true, hops, routeData: {
        domain,
        destinationIp: data.destinationIp,
        redirects: data.redirects,
        thirdPartyDomains: [...data.thirdPartyDomains]
      } });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

});
