chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "imageDownloader:download") return;

  if (!message.url) {
    sendResponse({ ok: false, error: "Image URL unavailable." });
    return;
  }

  const filename = (message.filename || "image")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .slice(0, 180);

  chrome.downloads.download({
    url: message.url,
    filename,
    saveAs: false,
    conflictAction: "uniquify"
  }).then((downloadId) => {
    sendResponse({ ok: true, downloadId });
  }).catch((error) => {
    sendResponse({ ok: false, error: error.message });
  });

  return true;
});
