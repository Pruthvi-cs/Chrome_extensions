const enabledInput = document.getElementById("enabled");
const blockedCount = document.getElementById("blocked-count");

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  enabledInput.checked = enabled;
});

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });

  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["common-ad-rules"]
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["common-ad-rules"]
      });
    }
  } catch (error) {
    console.error("Unable to update ad blocking rules:", error);
  }
});

async function updateCount() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.runtime.sendMessage(
    { type: "GET_TAB_COUNT", tabId: tab.id },
    (response) => {
      blockedCount.textContent = String(response?.count || 0);
    }
  );
}

updateCount();
setInterval(updateCount, 500);
