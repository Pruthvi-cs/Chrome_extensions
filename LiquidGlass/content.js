(() => {
  if (window.__liquidGlassLoaded) return;
  window.__liquidGlassLoaded = true;

  if (!["github.com", "www.github.com"].includes(location.hostname)) return;

  let blur = 18;
  let opacity = 18;

  function createCss() {
    const tint = opacity / 100;
    return `
html[data-color-mode="dark"] body::before,
html[data-color-mode="auto"] body::before,
body::before {
  content: "";
  position: fixed;
  inset: -25%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 20%, rgba(56, 189, 248, ${tint + 0.18}), transparent 28%),
    radial-gradient(circle at 78% 18%, rgba(168, 85, 247, ${tint + 0.12}), transparent 30%),
    radial-gradient(circle at 65% 78%, rgba(59, 130, 246, ${tint + 0.12}), transparent 32%);
  filter: blur(48px);
  transform: translateZ(0);
}

body {
  background-attachment: fixed !important;
}

.application-main,
.Layout,
.Box,
.Box-header,
.Box-body,
.TimelineItem,
.discussion-timeline-actions,
.js-discussion,
.repository-content,
[role="navigation"],
.Header,
.header,
.js-header-wrapper,
.pagehead,
.UnderlineNav,
.file,
.blob-wrapper,
.markdown-body,
.topic-tag,
.filter-item,
.Label,
.Counter,
.dropdown-menu,
.Popover-message,
.SelectMenu-modal,
.ActionList,
.TableObject {
  backdrop-filter: blur(${blur}px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(160%) !important;
  background: rgba(255, 255, 255, ${tint}) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12) !important;
}

html[data-color-mode="dark"] .Box,
html[data-color-mode="dark"] .Box-header,
html[data-color-mode="dark"] .Box-body,
html[data-color-mode="dark"] .TimelineItem,
html[data-color-mode="dark"] .Layout,
html[data-color-mode="dark"] .Header,
html[data-color-mode="dark"] .file,
html[data-color-mode="dark"] .blob-wrapper,
html[data-color-mode="dark"] .dropdown-menu,
html[data-color-mode="dark"] .SelectMenu-modal,
html[data-color-mode="dark"] .Popover-message {
  background: rgba(13, 17, 23, ${Math.min(tint + 0.28, 0.82)}) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
}

.Box,
.TimelineItem,
.Layout-sidebar,
.Layout-main,
.discussion-timeline-actions,
.file,
.TableObject {
  border-radius: 12px !important;
}

.topic-tag,
.Label,
.Counter,
.filter-item,
button,
input,
textarea,
select {
  border-radius: 8px !important;
}
`;
  }

  function applySettings(blurValue, opacityValue) {
    blur = blurValue ?? blur;
    opacity = opacityValue ?? opacity;
    chrome.runtime.sendMessage({
      type: "lg:apply",
      css: createCss()
    });
  }

  function enable(blurValue, opacityValue) {
    applySettings(blurValue, opacityValue);
  }

  function disable() {
    chrome.runtime.sendMessage({ type: "lg:remove" });
  }

  const listener = (message, sender, sendResponse) => {
    if (message?.type === "lg:enable") {
      enable(message.blur, message.opacity);
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "lg:disable") {
      disable();
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "lg:settings") {
      applySettings(message.blur, message.opacity);
      sendResponse({ ok: true });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  window.__liquidGlassContent = listener;

  chrome.storage.sync.get([`lgDomain:github.com:enabled`], (stored) => {
    if (stored["lgDomain:github.com:enabled"]) {
      chrome.storage.sync.get(["lgBlur", "lgOpacity"], (settings) => {
        enable(settings.lgBlur ?? 18, settings.lgOpacity ?? 18);
      });
    }
  });
})();
