(() => {
  if (window.__liquidGlassContent) {
    chrome.runtime.onMessage.addListener(window.__liquidGlassContent);
  }
  if (window.__liquidGlassLoaded) return;

  window.__liquidGlassLoaded = true;

  const styleId = "liquid-glass-generated-css";
  const controlsId = "liquid-glass-control-css";
  let domain = location.hostname;
  let generatedCss = "";
  let blur = 18;
  let opacity = 18;

  function colorToHex(value) {
    if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") return null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = value;
    const normalized = context.fillStyle;
    if (normalized.startsWith("#")) {
      return normalized.length === 7 ? normalized : null;
    }
    const match = normalized.match(/[\d.]+/g);
    if (!match) return null;
    const rgb = match.slice(0, 3).map((part) => Math.round(Number(part)));
    return "#" + rgb.map((part) => part.toString(16).padStart(2, "0")).join("");
  }

  function summarizePage() {
    const bodyStyle = getComputedStyle(document.body);
    const textCandidate = document.querySelector("h1, h2, p") || document.body;
    const textStyle = getComputedStyle(textCandidate);
    const major = {};

    ["header", "nav", "article", "aside", ".card"].forEach((selector) => {
      const elements = [...document.querySelectorAll(selector)].slice(0, 5);
      major[selector] = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          size: [Math.round(rect.width), Math.round(rect.height)],
          background: colorToHex(style.backgroundColor),
          color: colorToHex(style.color),
          borderRadius: style.borderRadius
        };
      });
    });

    return {
      domain,
      title: document.title,
      language: document.documentElement.lang || null,
      backgroundColor: colorToHex(bodyStyle.backgroundColor),
      textColor: colorToHex(textStyle.color),
      majorContainers: major,
      viewport: [innerWidth, innerHeight]
    };
  }

  function controlCss() {
    return `
#${styleId} { --liquid-glass-blur: ${blur}px; --liquid-glass-opacity: ${opacity / 100}; }
.liquid-glass-fallback-body,
body.liquid-glass-enabled {
  background-attachment: fixed !important;
}
.liquid-glass-fallback-body header,
.liquid-glass-fallback-body nav,
.liquid-glass-fallback-body article,
.liquid-glass-fallback-body aside,
.liquid-glass-fallback-body .card {
  background: rgba(255,255,255,var(--liquid-glass-opacity)) !important;
  backdrop-filter: blur(var(--liquid-glass-blur)) saturate(160%) !important;
  -webkit-backdrop-filter: blur(var(--liquid-glass-blur)) saturate(160%) !important;
  border: 1px solid rgba(255,255,255,0.25) !important;
  box-shadow: 0 12px 36px rgba(15,23,42,.12) !important;
}
`;
  }

  function setControlCss() {
    let style = document.getElementById(controlsId);
    if (!style) {
      style = document.createElement("style");
      style.id = controlsId;
      document.documentElement.appendChild(style);
    }
    style.textContent = controlCss();
  }

  function applyGeneratedCss(css) {
    generatedCss = css;
  }

  async function enable(blurValue, opacityValue) {
    blur = blurValue ?? blur;
    opacity = opacityValue ?? opacity;
    document.body?.classList.add("liquid-glass-enabled");
    setControlCss();

    const summary = summarizePage();
    chrome.storage.sync.get([`lgDomain:${domain}:css`], (stored) => {
      const cached = stored[`lgDomain:${domain}:css`];
      if (cached) {
        applyGeneratedCss(cached);
        chrome.runtime.sendMessage({
          type: "lg:applyCached",
          css: cached
        });
        return;
      }

      chrome.runtime.sendMessage({
        type: "lg:generate",
        summary
      }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) return;
        applyGeneratedCss(response.css);
        chrome.storage.sync.set({ [`lgDomain:${domain}:css`]: response.css });
      });
    });
  }

  function disable() {
    document.body?.classList.remove("liquid-glass-enabled");
    document.getElementById(controlsId)?.remove();
    if (generatedCss) {
      chrome.runtime.sendMessage({
        type: "lg:remove",
        css: generatedCss
      });
      generatedCss = "";
    }
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
    if (message?.type === "lg:getState") {
      chrome.storage.sync.get([`lgDomain:${domain}:enabled`], (stored) => {
        sendResponse({ enabled: Boolean(stored[`lgDomain:${domain}:enabled`]) });
      });
      return true;
    }
    if (message?.type === "lg:settings") {
      blur = message.blur;
      opacity = message.opacity;
      setControlCss();
      sendResponse({ ok: true });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  window.__liquidGlassContent = listener;

  chrome.storage.sync.get([`lgDomain:${domain}:enabled`], (stored) => {
    if (stored[`lgDomain:${domain}:enabled`]) {
      chrome.storage.sync.get(["lgBlur", "lgOpacity"], (settings) => {
        enable(settings.lgBlur ?? 18, settings.lgOpacity ?? 18);
      });
    }
  });
})();
