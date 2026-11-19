const enabledInput = document.getElementById("enabled");
const status = document.getElementById("status");

function updateStatus(enabled) {
  status.textContent = enabled
    ? "Ad blocking is enabled."
    : "Ad blocking is disabled.";
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  enabledInput.checked = enabled;
  updateStatus(enabled);
});

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  await chrome.storage.local.set({ enabled });
  updateStatus(enabled);
});
