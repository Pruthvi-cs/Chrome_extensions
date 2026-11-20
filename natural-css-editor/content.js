(() => {
  if (window.__naturalCssEditor) return;

  let active = false;
  let hovered = null;
  let selected = null;
  let snapshot = null;

  const host = document.createElement("div");
  host.id = "natural-css-editor-shadow-host";
  host.style.cssText =
    "position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:2147483647!important;pointer-events:none!important;border:0!important;margin:0!important;padding:0!important;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .box { position: fixed; border: 2px solid #2563eb; border-radius: 2px; background: rgba(37,99,235,.06); pointer-events: none; box-sizing: border-box; }
    .bar { position: fixed; width: 340px; max-width: calc(100vw - 16px); pointer-events: auto; font: 13px system-ui,-apple-system,sans-serif; color: #172033; }
    .panel { border: 1px solid #d7dde7; border-radius: 10px; background: #fff; box-shadow: 0 10px 28px rgba(15,23,42,.22); overflow: hidden; }
    form { display:flex; gap:6px; padding:8px; }
    input { flex:1; min-width:0; border:1px solid #cbd5e1; border-radius:7px; padding:8px 9px; outline:none; font:13px system-ui,sans-serif; }
    input:focus { border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.12); }
    button { border:0; border-radius:7px; padding:7px 9px; background:#2563eb; color:#fff; cursor:pointer; font-weight:700; }
    .actions { display:flex; gap:6px; border-top:1px solid #edf0f5; padding:7px 8px; }
    .actions button { flex:1; background:#eef2f7; color:#334155; }
    .actions button.primary { background:#2563eb; color:#fff; }
    .message { min-height:15px; padding:0 8px 7px; color:#64748b; }
  `;
  shadow.appendChild(style);

  const box = document.createElement("div");
  box.className = "box";
  box.hidden = true;
  shadow.appendChild(box);

  const bar = document.createElement("div");
  bar.className = "bar";
  bar.hidden = true;
  bar.innerHTML = `
    <div class="panel">
      <form>
        <input aria-label="Editing instruction" placeholder="Describe a visual change..." autocomplete="off">
        <button type="submit">Apply</button>
      </form>
      <div class="actions">
        <button type="button" data-action="undo">Undo</button>
        <button type="button" data-action="keep" class="primary">Keep</button>
        <button type="button" data-action="copy">Copy CSS</button>
      </div>
      <div class="message" aria-live="polite"></div>
    </div>`;
  shadow.appendChild(bar);

  const input = bar.querySelector("input");
  const message = bar.querySelector(".message");

  function positionOverlay(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;

    if (!bar.hidden) {
      let left = rect.right + 10;
      let top = rect.top;
      if (left + 340 > window.innerWidth) left = Math.max(8, rect.left - 350);
      if (top + 120 > window.innerHeight) top = Math.max(8, window.innerHeight - 128);
      bar.style.left = `${left}px`;
      bar.style.top = `${top}px`;
    }
  }

  function isPageElement(element) {
    return element instanceof Element &&
      element !== host &&
      !host.contains(element) &&
      !element.closest("#natural-css-editor-shadow-host");
  }

  function mouseover(event) {
    if (!active || selected) return;
    if (!isPageElement(event.target)) return;
    hovered = event.target;
    box.hidden = false;
    positionOverlay(hovered);
  }

  function mousemove(event) {
    if (!active || selected) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (isPageElement(target) && target !== hovered) {
      hovered = target;
      box.hidden = false;
      positionOverlay(target);
    }
  }

  function getComputedStyles(element) {
    const computed = getComputedStyle(element);
    const result = {};
    for (let i = 0; i < computed.length; i++) {
      const property = computed[i];
      result[property] = computed.getPropertyValue(property);
    }
    return result;
  }

  function freezeSelection(element) {
    selected = element;
    snapshot = {
      style: element.getAttribute("style"),
      html: element.innerHTML
    };
    box.hidden = false;
    box.style.border = "2px solid #2563eb";
    positionOverlay(element);
    bar.hidden = false;
    positionOverlay(element);
    input.focus();
  }

  function click(event) {
    if (!active) return;
    if (bar.contains(event.target)) return;
    if (!isPageElement(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    freezeSelection(event.target);
  }

  function activate() {
    if (!host.isConnected) document.documentElement.appendChild(host);
    active = true;
  }

  function deactivate() {
    active = false;
    selected = null;
    hovered = null;
    box.hidden = true;
    bar.hidden = true;
  }

  document.addEventListener("mouseover", mouseover, true);
  document.addEventListener("mousemove", mousemove, true);
  document.addEventListener("click", click, true);
  window.addEventListener("scroll", () => positionOverlay(selected || hovered), true);
  window.addEventListener("resize", () => positionOverlay(selected || hovered));

  bar.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const instruction = input.value.trim();
    if (!instruction || !selected) return;

    message.textContent = "Generating change...";
    bar.querySelector('button[type="submit"]').disabled = true;

    chrome.runtime.sendMessage({
      type: "nce:generate",
      instruction,
      outerHTML: selected.outerHTML,
      computedStyles: getComputedStyles(selected)
    }, (response) => {
      bar.querySelector('button[type="submit"]').disabled = false;
      if (chrome.runtime.lastError) {
        message.textContent = chrome.runtime.lastError.message;
        return;
      }
      if (!response?.ok) {
        message.textContent = response?.error || "Unable to generate an edit.";
        return;
      }

      const css = typeof response.result?.css === "string"
        ? response.result.css
        : "";
      if (css) {
        const declarations = css.split(";").map((item) => item.trim()).filter(Boolean);
        for (const declaration of declarations) {
          const separator = declaration.indexOf(":");
          if (separator < 1) continue;
          const property = declaration.slice(0, separator).trim();
          const value = declaration.slice(separator + 1).trim();
          if (/^(?:-moz|-webkit|-ms)?-?[a-z][a-z0-9-]*$/i.test(property)) {
            selected.style.setProperty(property, value.replace(/;$/, ""));
          }
        }
      }

      if (typeof response.result?.html === "string" && response.result.html.trim()) {
        const template = document.createElement("template");
        template.innerHTML = response.result.html;
        template.content.querySelectorAll("script,style,link,iframe,object,embed").forEach((node) => node.remove());
        template.content.querySelectorAll("*").forEach((node) => {
          [...node.attributes].forEach((attribute) => {
            if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
            if (/^(src|href)$/i.test(attribute.name) && /^\s*javascript:/i.test(attribute.value)) {
              node.removeAttribute(attribute.name);
            }
          });
        });
        selected.replaceChildren(template.content);
      }

      snapshot = snapshot || {};
      message.textContent = "Change applied.";
      positionOverlay(selected);
    });
  });

  bar.querySelector('[data-action="undo"]').addEventListener("click", () => {
    if (!selected || !snapshot) return;
    if (snapshot.style === null) selected.removeAttribute("style");
    else selected.setAttribute("style", snapshot.style);
    selected.innerHTML = snapshot.html;
    message.textContent = "Change undone.";
    positionOverlay(selected);
  });

  bar.querySelector('[data-action="keep"]').addEventListener("click", () => {
    snapshot = null;
    selected = null;
    bar.hidden = true;
    box.hidden = true;
    message.textContent = "";
  });

  bar.querySelector('[data-action="copy"]').addEventListener("click", async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.style.cssText);
    message.textContent = "CSS copied.";
  });

  const messageListener = (messageRequest, sender, sendResponse) => {
    if (messageRequest?.type === "nce:toggle") {
      if (active) deactivate();
      else activate();
      sendResponse({ active });
      return true;
    }
    if (messageRequest?.type === "nce:getState") {
      sendResponse({ active });
      return true;
    }
  };
  chrome.runtime.onMessage.addListener(messageListener);
  window.__naturalCssEditor = true;
  window.__naturalCssEditorMessageListener = messageListener;
})();
