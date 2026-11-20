const tabCounts = new Map();

function resetTab(tabId) {
  tabCounts.set(tabId, 0);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AD_BLOCKED" && sender.tab?.id) {
    const current = tabCounts.get(sender.tab.id) || 0;
    tabCounts.set(sender.tab.id, current + (Number(message.count) || 1));
  }

  if (message.type === "GET_TAB_COUNT") {
    sendResponse({ count: tabCounts.get(message.tabId) || 0 });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    resetTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabCounts.delete(tabId);
});
