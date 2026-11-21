const site = document.getElementById("site");
const refresh = document.getElementById("refresh");
const risk = document.getElementById("risk");
const thirdPartyCount = document.getElementById("third-party-count");
const trackerCount = document.getElementById("tracker-count");
const signalsList = document.getElementById("signals");
const thirdPartyList = document.getElementById("third-parties");
const cookieList = document.getElementById("cookies");

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

    const badge = document.createElement("span");
    badge.className = "count";
    badge.textContent = String(count);

    item.append(name, badge);
    element.appendChild(item);
  }
}

async function scan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\//.test(tab.url || "")) {
    site.textContent = "Open a normal website";
    risk.textContent = "N/A";
    renderList(signalsList, [], "No scan available.");
    renderList(thirdPartyList, [], "No network data available.");
    renderList(cookieList, [], "No cookie data available.");
    return;
  }

  site.textContent = new URL(tab.url).hostname;
  const report = await chrome.runtime.sendMessage({
    type: "privacy:getReport",
    tabId: tab.id
  });

  const storageEntries = [];
  const storage = report?.storage || {};
  if (storage.localStorageKeys) {
    storageEntries.push([`Local storage: ${storage.localStorageKeys} key(s)`, storage.localStorageKeys]);
  }
  if (storage.sessionStorageKeys) {
    storageEntries.push([`Session storage: ${storage.sessionStorageKeys} key(s)`, storage.sessionStorageKeys]);
  }
  if (storage.indexedDb) storageEntries.push(["IndexedDB available", 1]);

  const signalEntries = [
    ...(report?.collectionSignals || []),
    ...storageEntries
  ];
  const thirdParties = report?.thirdPartyHosts || [];
  const trackers = report?.trackerHosts || [];
  const cookies = report?.cookieHosts || [];

  thirdPartyCount.textContent = String(thirdParties.length);
  trackerCount.textContent = String(trackers.length);

  const score =
    thirdParties.length +
    trackers.length * 2 +
    cookies.length +
    storageEntries.length;
  if (score >= 8) risk.textContent = "High";
  else if (score >= 3) risk.textContent = "Medium";
  else risk.textContent = "Low";

  renderList(signalsList, signalEntries, "No obvious collection signals found.");
  renderList(thirdPartyList, thirdParties, "No third-party domains detected.");
  renderList(cookieList, cookies, "No accessible cookies detected.");
}

refresh.addEventListener("click", scan);
scan();
