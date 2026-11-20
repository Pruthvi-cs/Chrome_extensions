const enabledInput = document.getElementById("enabled");
const status = document.getElementById("status");

chrome.storage.local.get({ imageDownloaderEnabled: true }, ({ imageDownloaderEnabled }) => {
  enabledInput.checked = imageDownloaderEnabled;
});

enabledInput.addEventListener("change", async () => {
  await chrome.storage.local.set({
    imageDownloaderEnabled: enabledInput.checked
  });

  status.textContent = enabledInput.checked
    ? "Hover buttons are enabled."
    : "Hover buttons are disabled.";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "imageDownloader:setEnabled",
      enabled: enabledInput.checked
    }).catch(() => {});
  }
});
