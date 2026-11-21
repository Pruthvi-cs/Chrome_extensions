const tabCounts = new Map();
const RULESET_ID = "common-ad-rules";

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

async function syncRuleset(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [RULESET_ID]
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [RULESET_ID]
      });
    }
  } catch (error) {
    console.error("Unable to update Universal Ad Blocker rules:", error);
  }
}

async function syncSavedRuleset() {
  const { enabled = true } = await chrome.storage.local.get({ enabled: true });
  await syncRuleset(enabled);
}

chrome.runtime.onInstalled.addListener(syncSavedRuleset);
chrome.runtime.onStartup.addListener(syncSavedRuleset);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.enabled) {
    syncRuleset(changes.enabled.newValue);
  }
});

syncSavedRuleset();

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    resetTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabCounts.delete(tabId);
});
