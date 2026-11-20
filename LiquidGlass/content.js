(() => {
  if (window.__liquidGlassLoaded) return;
  window.__liquidGlassLoaded = true;

  if (!["github.com", "www.github.com"].includes(location.hostname)) return;

  let blur = 18;
  let opacity = 18;

  function createCss() {
    const tint = opacity / 100;
    return `
html {
  scroll-behavior: smooth !important;
}

body {
  background-attachment: fixed !important;
}

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
  animation: liquid-glass-mesh 18s ease-in-out infinite alternate;
}

@keyframes liquid-glass-mesh {
  0% { transform: translate3d(-2%, -1%, 0) scale(1); }
  50% { transform: translate3d(2%, 1%, 0) scale(1.08) rotate(1deg); }
  100% { transform: translate3d(-1%, 2%, 0) scale(1.04) rotate(-1deg); }
}

@keyframes liquid-glass-enter {
  from { opacity: 0; transform: translateY(10px) scale(.992); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.Box,
.TimelineItem,
.Layout-sidebar,
.Layout-main,
.discussion-timeline-actions,
.file,
.TableObject,
.topic-tag,
.Label,
.Counter,
.filter-item,
.dropdown-menu,
.Popover-message,
.SelectMenu-modal,
.ActionList {
  transition:
    background-color .24s ease,
    border-color .24s ease,
    box-shadow .24s ease,
    transform .24s cubic-bezier(.22, 1, .36, 1),
    opacity .24s ease !important;
}

.Box:hover,
.TimelineItem:hover,
.file:hover,
.topic-tag:hover,
.Label:hover,
.filter-item:hover,
.ActionList-item:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 16px 38px rgba(15, 23, 42, ${tint + 0.12}) !important;
}

button,
.btn,
.Link--primary,
a[role="button"] {
  transition:
    transform .18s cubic-bezier(.22, 1, .36, 1),
    box-shadow .18s ease,
    background-color .18s ease,
    opacity .18s ease !important;
}

button:active,
.btn:active,
a[role="button"]:active {
  transform: scale(.96) !important;
}

button:hover,
.btn:hover,
a[role="button"]:hover {
  box-shadow: 0 8px 22px rgba(56, 189, 248, ${tint}) !important;
}

.Layout-main,
.application-main,
.repository-content,
.markdown-body,
.js-discussion,
[data-turbo-temporary],
.Box {
  animation: liquid-glass-enter .42s cubic-bezier(.22, 1, .36, 1) both;
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

html[data-color-mode="dark"] .Box:hover,
html[data-color-mode="dark"] .TimelineItem:hover,
html[data-color-mode="dark"] .file:hover,
html[data-color-mode="dark"] .topic-tag:hover,
html[data-color-mode="dark"] .Label:hover,
html[data-color-mode="dark"] .filter-item:hover {
  box-shadow: 0 16px 42px rgba(0, 0, 0, ${Math.min(tint + 0.32, 0.72)}) !important;
}

html[data-color-mode="dark"] body,
html[data-color-mode="dark"] .application-main,
html[data-color-mode="dark"] .pagehead,
html[data-color-mode="dark"] .Layout {
  background-color: rgba(13, 17, 23, 0.72) !important;
}

html[data-color-mode="dark"] .markdown-body {
  color: #e6edf3 !important;
  background: rgba(13, 17, 23, ${Math.min(tint + 0.2, 0.76)}) !important;
}

html[data-color-mode="dark"] input,
html[data-color-mode="dark"] textarea,
html[data-color-mode="dark"] select,
html[data-color-mode="dark"] .form-control,
html[data-color-mode="dark"] .search-input {
  background: rgba(22, 27, 34, ${Math.min(tint + 0.48, 0.88)}) !important;
  color: #e6edf3 !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
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

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto !important;
  }

  body::before,
  .Layout-main,
  .application-main,
  .repository-content,
  .markdown-body,
  .js-discussion,
  [data-turbo-temporary],
  .Box {
    animation: none !important;
  }

  .Box,
  .TimelineItem,
  .Layout-sidebar,
  .Layout-main,
  .discussion-timeline-actions,
  .file,
  .TableObject,
  button,
  .btn,
  a,
  .topic-tag,
  .Label,
  .Counter,
  .filter-item {
    transition: none !important;
  }

  .Box:hover,
  .TimelineItem:hover,
  .file:hover,
  button:active,
  .btn:active {
    transform: none !important;
  }
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
