const toggleButton = document.getElementById("toggle");
const toggleLabel = document.getElementById("toggle-label");

async function sendToPage(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (_) {
    return null;
  }
}

async function refreshState() {
  const response = await sendToPage({ type: "lci:getState" });
  const active = Boolean(response?.active);
  toggleButton.classList.toggle("active", active);
  toggleLabel.textContent = active ? "Stop Inspector" : "Start Inspector";
}

toggleButton.addEventListener("click", async () => {
  const response = await sendToPage({ type: "lci:toggle" });
  if (!response) {
    toggleLabel.textContent = "Reload page first";
    return;
  }
  toggleButton.classList.toggle("active", response.active);
  toggleLabel.textContent = response.active ? "Stop Inspector" : "Start Inspector";
});

refreshState();
