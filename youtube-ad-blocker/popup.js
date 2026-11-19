const enabledInput = document.getElementById("enabled");
const status = document.getElementById("status");

function renderStatus(enabled) {
  status.textContent = enabled
    ? "Blocking is enabled for YouTube."
    : "Blocking is disabled.";
}

async function loadSettings() {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  enabledInput.checked = enabled;
  renderStatus(enabled);
}

loadSettings();

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });
  renderStatus(enabled);
});
