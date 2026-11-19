const enabledInput = document.getElementById("enabled");
const status = document.getElementById("status");

function renderStatus(enabled) {
  status.textContent = enabled
    ? "Blocking is enabled for YouTube."
    : "Blocking is disabled.";
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  enabledInput.checked = enabled;
  renderStatus(enabled);
});

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });
  renderStatus(enabled);
});
