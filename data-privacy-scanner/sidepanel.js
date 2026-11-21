let activeTabId = null;

const domainEl = document.getElementById("domain");
const refreshButton = document.getElementById("refreshButton");
const riskEl = document.getElementById("risk");
const thirdPartyCountEl = document.getElementById("third-party-count");
const trackerCountEl = document.getElementById("tracker-count");
const cookieCountEl = document.getElementById("cookie-count");
const signalCountEl = document.getElementById("signal-count");
const thirdPartyBadgeEl = document.getElementById("third-party-badge");
const trackerBadgeEl = document.getElementById("tracker-badge");
const cookieBadgeEl = document.getElementById("cookie-badge");

function renderList(element, entries, emptyText) {
  element.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = emptyText;
    element.appendChild(empty);
    return;
  }

  for (const [label, count] of entries) {
    const item = document.createElement("div");
    item.className = "item";
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("span");
    value.textContent = String(count);
    item.append(name, value);
    element.appendChild(item);
  }
}

function setRisk(score) {
  let label = "Low";
  let color = "var(--green)";
  if (score >= 8) {
    label = "High";
    color = "var(--red)";
  } else if (score >= 3) {
    label = "Medium";
    color = "var(--orange)";
  }
  riskEl.textContent = label;
  riskEl.style.color = color;
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

async function scan() {
  await getActiveTab();
  if (!activeTabId) return;

  refreshButton.disabled = true;
  refreshButton.textContent = "Scanning...";

  chrome.runtime.sendMessage({
    type: "privacy:getReport",
    tabId: activeTabId
  }, (report) => {
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh";
    if (chrome.runtime.lastError || !report) {
      domainEl.textContent = "Scan unavailable";
      return;
    }

    const storage = report.storage || {};
    const storageEntries = [];
    if (storage.localStorageKeys) {
      storageEntries.push([`Local storage: ${storage.localStorageKeys} key(s)`, storage.localStorageKeys]);
    }
    if (storage.sessionStorageKeys) {
      storageEntries.push([`Session storage: ${storage.sessionStorageKeys} key(s)`, storage.sessionStorageKeys]);
    }
    if (storage.indexedDb) storageEntries.push(["IndexedDB available", 1]);

    const signals = [
      ...(report.collectionSignals || []),
      ...storageEntries
    ];
    const thirdParties = report.thirdPartyHosts || [];
    const trackers = report.trackerHosts || [];
    const cookies = report.cookieHosts || [];

    renderList(document.getElementById("signals"), signals, "No obvious collection signals found.");
    renderList(document.getElementById("third-parties"), thirdParties, "No third-party domains detected.");
    renderList(document.getElementById("trackers"), trackers, "No known trackers detected.");
    renderList(document.getElementById("cookies"), cookies, "No accessible cookies detected.");

    thirdPartyCountEl.textContent = String(thirdParties.length);
    trackerCountEl.textContent = String(trackers.length);
    cookieCountEl.textContent = String(cookies.length);
    signalCountEl.textContent = String(signals.length);
    thirdPartyBadgeEl.textContent = String(thirdParties.length);
    trackerBadgeEl.textContent = String(trackers.length);
    cookieBadgeEl.textContent = String(cookies.length);

    const score =
      thirdParties.length +
      trackers.length * 2 +
      cookies.length +
      storageEntries.length;
    setRisk(score);
  });
}

refreshButton.addEventListener("click", scan);
chrome.tabs.onActivated.addListener(scan);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === activeTabId && changeInfo.status === "complete") scan();
});

scan();
