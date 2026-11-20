const toggleButton = document.getElementById("toggle");
const status = document.getElementById("status");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function updateState(tab) {
  if (!tab?.id) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "nce:getState" });
    const active = Boolean(response?.active);
    toggleButton.textContent = active ? "Deactivate editor" : "Activate editor";
    status.textContent = active ? "Editor is active. Hover and click an element." : "Editor is inactive.";
  } catch {
    toggleButton.textContent = "Activate editor";
    status.textContent = "Editor is inactive.";
  }
}

toggleButton.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (error) {
    status.textContent = "Cannot edit this page.";
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: "nce:toggle" });
  toggleButton.textContent = response?.active ? "Deactivate editor" : "Activate editor";
  status.textContent = response?.active
    ? "Editor is active. Hover and click an element."
    : "Editor is inactive.";
});

getActiveTab().then(updateState);
