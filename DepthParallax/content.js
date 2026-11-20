(() => {
  if (window.__depthParallaxLoaded) return;
  window.__depthParallaxLoaded = true;

  let enabled = false;
  let strength = 12;
  let smoothing = 18;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let framePending = false;
  let rafId = 0;

  const tierValues = {
    foreground: 1,
    midground: 0.55,
    background: -0.35
  };

  const elements = [];
  const originalStyles = new WeakMap();
  let nextId = 1;

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 48 || rect.height < 48) return false;
    if (rect.bottom < 0 || rect.top > innerHeight) return false;
    if (rect.right < 0 || rect.left > innerWidth) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    if (style.position === "fixed" || style.position === "sticky") return false;
    return true;
  }

  function looksLikeBackground(element) {
    const style = getComputedStyle(element);
    const background = style.backgroundImage;
    if (background && background !== "none") return true;
    return Boolean(element.querySelector("img, video, picture"));
  }

  function fallbackTier(element) {
    const className = `${element.className || ""}`.toLowerCase();
    const role = `${element.tagName} ${element.id} ${className}`;
    if (/hero|banner|masthead|cover|jumbotron|featured/.test(role)) return "foreground";
    if (/card|tile|panel|item|post|profile/.test(role) || element.matches("article")) return "midground";
    if (looksLikeBackground(element)) return "background";
    return "midground";
  }

  function scanElements() {
    const selectors = [
      "main section",
      "header",
      "[class*='hero' i]",
      "[class*='banner' i]",
      "[class*='card' i]",
      "[class*='tile' i]",
      "article",
      ".post",
      ".panel",
      "picture",
      "img",
      "[style*='background-image' i]"
    ];

    const found = new Map();
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => {
        if (isVisible(element)) found.set(element, true);
      });
    }

    elements.length = 0;
    for (const element of found.keys()) {
      if (elements.length >= 60) break;
      let id = element.getAttribute("data-depth-parallax-id");
      if (!id) {
        id = `dp-${nextId++}`;
        element.setAttribute("data-depth-parallax-id", id);
      }
      if (!originalStyles.has(element)) {
        originalStyles.set(element, {
          transform: element.style.transform,
          willChange: element.style.willChange,
          transition: element.style.transition
        });
      }
      const rectActual = element.getBoundingClientRect();
      elements.push({
        id,
        element,
        tier: fallbackTier(element),
        summary: {
          depthId: id,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute("role") || null,
          id: element.id || null,
          classes: typeof element.className === "string"
            ? element.className.slice(0, 120)
            : null,
          size: [Math.round(rectActual.width), Math.round(rectActual.height)],
          isBackgroundImage: looksLikeBackground(element)
        }
      });
    }
  }

  function applyTiers(tiers) {
    for (const item of elements) {
      const tier = tiers[item.id];
      if (tier === "foreground" || tier === "midground" || tier === "background") {
        item.tier = tier;
      }
    }
  }

  function classifyElements() {
    scanElements();
    if (!elements.length) return;

    chrome.runtime.sendMessage({
      type: "dp:classify",
      summary: elements.map((item) => item.summary)
    }, (response) => {
      if (!chrome.runtime.lastError && response?.ok) applyTiers(response.tiers);
    });
  }

  function onMouseMove(event) {
    if (!enabled) return;
    targetX = (event.clientX / innerWidth - 0.5) * 2;
    targetY = (event.clientY / innerHeight - 0.5) * 2;

    if (!framePending) {
      framePending = true;
      rafId = requestAnimationFrame(render);
    }
  }

  function render() {
    framePending = false;
    if (!enabled) return;

    const easing = smoothing / 100;
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;

    for (const item of elements) {
      if (!isVisible(item.element)) continue;
      const depth = tierValues[item.tier] || tierValues.midground;
      const x = currentX * strength * depth;
      const y = currentY * strength * depth;
      item.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      item.element.style.willChange = "transform";
    }

    if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
      rafId = requestAnimationFrame(render);
      framePending = true;
    }
  }

  function restoreElements() {
    for (const item of elements) {
      const original = originalStyles.get(item.element);
      if (!original) continue;
      item.element.style.transform = original.transform;
      item.element.style.willChange = original.willChange;
      item.element.style.transition = original.transition;
    }
  }

  function enable(settings) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    enabled = true;
    strength = settings.strength ?? 12;
    smoothing = settings.smoothness ?? 18;
    targetX = 0;
    targetY = 0;
    classifyElements();
  }

  function disable() {
    enabled = false;
    cancelAnimationFrame(rafId);
    framePending = false;
    restoreElements();
  }

  document.addEventListener("mousemove", onMouseMove, { passive: true });

  const listener = (message, sender, sendResponse) => {
    if (message?.type === "dp:toggle") {
      if (message.enabled) enable(message);
      else disable();
      sendResponse({ enabled });
      return true;
    }
    if (message?.type === "dp:settings") {
      strength = message.strength ?? strength;
      smoothing = message.smoothness ?? smoothing;
      sendResponse({ ok: true });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(listener);
  window.__depthParallaxContent = listener;

  chrome.storage.sync.get(["dpEnabled", "dpStrength", "dpSmoothness"], (settings) => {
    if (settings.dpEnabled) {
      enable({
        strength: settings.dpStrength ?? 12,
        smoothness: settings.dpSmoothness ?? 18
      });
    }
  });
})();
