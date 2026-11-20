const currentCss = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender?.tab?.id) return;

  if (message?.type === "lg:apply") {
    const tabId = sender.tab.id;
    (async () => {
      const previous = currentCss.get(tabId);
      if (previous) {
        await chrome.scripting.removeCSS({
          target: { tabId },
          css: previous
        }).catch(() => {});
      }
      await chrome.scripting.insertCSS({
        target: { tabId },
        css: message.css
      });
      currentCss.set(tabId, message.css);
      sendResponse({ ok: true });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "lg:remove") {
    const tabId = sender.tab.id;
    (async () => {
      const previous = currentCss.get(tabId);
      if (previous) {
        await chrome.scripting.removeCSS({
          target: { tabId },
          css: previous
        }).catch(() => {});
      }
      currentCss.delete(tabId);
      sendResponse({ ok: true });
    })();
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => currentCss.delete(tabId));
