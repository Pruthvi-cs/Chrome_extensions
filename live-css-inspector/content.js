(() => {
  if (window.__liveCssInspector) return;

  let active = false;
  let hovered = null;
  let selected = null;
  let originalInlineStyle = "";
  let currentSelectionInline = "";

  const host = document.createElement("div");
  host.id = "live-css-inspector-host";
  host.style.cssText =
    "position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:2147483647!important;pointer-events:none!important;border:0!important;margin:0!important;padding:0!important;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .outline {
      position: fixed;
      border: 2px solid #2563eb;
      background: rgba(37, 99, 235, .08);
      border-radius: 2px;
      box-sizing: border-box;
      pointer-events: none;
    }
    .tag {
      position: fixed;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 4px 4px 0 0;
      padding: 3px 6px;
      background: #2563eb;
      color: #fff;
      box-sizing: border-box;
      font: 11px/14px ui-monospace, SFMono-Regular, Menlo, monospace;
      pointer-events: none;
    }
    .panel {
      position: fixed;
      width: 350px;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      overflow: auto;
      border: 1px solid #d7dee8;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 12px 34px rgba(15, 23, 42, .24);
      color: #172033;
      font: 12px/1.45 Arial, sans-serif;
      pointer-events: auto;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid #edf0f5;
      padding: 9px 10px;
    }
    .selector {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 700;
    }
    .close {
      border: 0;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
      line-height: 18px;
    }
    .properties {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1px;
      border-bottom: 1px solid #edf0f5;
      background: #edf0f5;
    }
    .property {
      min-width: 0;
      padding: 7px 9px;
      background: #f8fafc;
    }
    .property-name {
      display: block;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
    }
    .property-value {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #1e293b;
      font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .editor {
      padding: 9px;
    }
    textarea {
      width: 100%;
      height: 128px;
      resize: vertical;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 8px;
      outline: none;
      color: #172033;
      background: #fff;
      font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    textarea:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      margin-top: 7px;
    }
    button.action {
      border: 0;
      border-radius: 6px;
      padding: 7px 8px;
      background: #eef2f7;
      color: #334155;
      cursor: pointer;
      font-weight: 700;
    }
    button.primary {
      background: #2563eb;
      color: #fff;
    }
    .status {
      min-height: 16px;
      margin-top: 5px;
      color: #64748b;
    }
  `;
  shadow.appendChild(style);

  const outline = document.createElement("div");
  outline.className = "outline";
  outline.hidden = true;
  shadow.appendChild(outline);

  const tag = document.createElement("div");
  tag.className = "tag";
  tag.hidden = true;
  shadow.appendChild(tag);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="header">
      <div class="selector"></div>
      <button class="close" type="button" title="Close">×</button>
    </div>
    <div class="properties"></div>
    <div class="editor">
      <textarea aria-label="CSS declarations" spellcheck="false"></textarea>
      <div class="actions">
        <button class="action primary" type="button" data-action="apply">Apply</button>
        <button class="action" type="button" data-action="reset">Reset</button>
        <button class="action" type="button" data-action="copy">Copy CSS</button>
      </div>
      <div class="status" aria-live="polite"></div>
    </div>
  `;
  shadow.appendChild(panel);

  const selectorText = panel.querySelector(".selector");
  const properties = panel.querySelector(".properties");
  const textarea = panel.querySelector("textarea");
  const status = panel.querySelector(".status");

  function isPageElement(element) {
    return element instanceof Element &&
      element !== host &&
      !host.contains(element) &&
      !element.closest("#live-css-inspector-host");
  }

  function positionElementOverlay(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    outline.style.left = `${left}px`;
    outline.style.top = `${top}px`;
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;

    tag.textContent = getSelectorHint(element);
    tag.style.left = `${left}px`;
    tag.style.top = `${Math.max(0, top - 20)}px`;
    return rect;
  }

  function getTagName(element) {
    const tagName = element.tagName.toLowerCase();
    const inputType = element.tagName === "INPUT" ? element.type : "";
    return inputType ? `${tagName}[type="${inputType}"]` : tagName;
  }

  function getSelectorHint(element) {
    if (element.id) return `${getTagName(element)}#${element.id}`;
    const className =
      typeof element.className === "string"
        ? element.className.trim().split(/\s+/)[0]
        : "";
    return className
      ? `${getTagName(element)}.${CSS.escape(className)}`
      : getTagName(element);
  }

  function updateProperties(element) {
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    const values = [
      ["selector", getSelectorHint(element)],
      ["size", `${Math.round(rect.width)} × ${Math.round(rect.height)} px`],
      ["display", computed.display],
      ["position", computed.position],
      ["color", computed.color],
      ["background", computed.backgroundColor],
      ["font", `${computed.fontSize} ${computed.fontFamily.split(",")[0].replace(/["']/g, "")}`],
      ["overflow", computed.overflow]
    ];

    properties.innerHTML = "";
    for (const [name, value] of values) {
      const item = document.createElement("div");
      item.className = "property";
      item.innerHTML =
        `<span class="property-name"></span><span class="property-value"></span>`;
      item.querySelector(".property-name").textContent = name;
      item.querySelector(".property-value").textContent = value;
      item.title = value;
      properties.appendChild(item);
    }
  }

  function getEditableCss(element) {
    if (element.style.cssText.trim()) return element.style.cssText.trim();

    const computed = getComputedStyle(element);
    return [
      `color: ${computed.color};`,
      `background-color: ${computed.backgroundColor};`,
      `font-size: ${computed.fontSize};`,
      `font-weight: ${computed.fontWeight};`,
      `width: ${computed.width};`,
      `height: ${computed.height};`,
      `padding: ${computed.padding};`,
      `margin: ${computed.margin};`,
      `border: ${computed.border};`,
      `border-radius: ${computed.borderRadius};`,
      `display: ${computed.display};`
    ].join("\n");
  }

  function positionPanel(rect) {
    if (!rect) return;
    let left = rect.right + 10;
    let top = rect.top;
    if (left + 350 > window.innerWidth) left = Math.max(8, rect.left - 360);
    if (top + panel.offsetHeight > window.innerHeight) {
      top = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    }
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function selectElement(element) {
    selected = element;
    hovered = element;
    originalInlineStyle = element.getAttribute("style") || "";
    currentSelectionInline = originalInlineStyle;
    outline.hidden = false;
    tag.hidden = false;
    panel.hidden = false;
    selectorText.textContent = getSelectorHint(element);
    textarea.value = getEditableCss(element);
    status.textContent = "Editing live. Changes are not saved.";
    updateProperties(element);
    const rect = positionElementOverlay(element);
    positionPanel(rect);
  }

  function clearSelection() {
    selected = null;
    hovered = null;
    outline.hidden = true;
    tag.hidden = true;
    panel.hidden = true;
    status.textContent = "";
  }

  function mouseMove(event) {
    if (!active || selected) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!isPageElement(element)) {
      outline.hidden = true;
      tag.hidden = true;
      hovered = null;
      return;
    }
    hovered = element;
    outline.hidden = false;
    tag.hidden = false;
    positionElementOverlay(element);
  }

  function click(event) {
    if (!active || !isPageElement(event.target)) return;
    if (selected) return;
    event.preventEventDefault;
  }

  function onClick(event) {
    if (!active || selected) return;
    if (!isPageElement(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(event.target);
  }

  function applyCss() {
    if (!selected) return;

    if (selected.hasAttribute("style")) {
      selected.setAttribute("style", originalInlineStyle);
    } else {
      selected.removeAttribute("style");
    }

    let count = 0;
    for (const rawLine of textarea.value.split(/;|\n/)) {
      const declaration = rawLine.trim();
      if (!declaration || declaration.startsWith("/*")) continue;
      const separator = declaration.indexOf(":");
      if (separator < 1) continue;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      if (!/^--[a-zA-Z0-9_-]+$/.test(property) &&
          !/^(-[a-z]+-)?[a-z][a-z0-9-]*$/i.test(property)) continue;
      try {
        selected.style.setProperty(property, value.replace(/;$/, ""));
        count++;
      } catch (_) {}
    }

    currentSelectionInline = selected.getAttribute("style") || "";
    status.textContent = `${count} CSS declaration${count === 1 ? "" : "s"} applied.`;
    updateProperties(selected);
    positionElementOverlay(selected);
  }

  function resetCss() {
    if (!selected) return;
    if (originalInlineStyle) selected.setAttribute("style", originalInlineStyle);
    else selected.removeAttribute("style");
    textarea.value = getEditableCss(selected);
    currentSelectionInline = selected.getAttribute("style") || "";
    status.textContent = "Inline CSS reset.";
    updateProperties(selected);
    positionElementOverlay(selected);
  }

  async function copyCss() {
    if (!selected) return;
    const cssText = selected.style.cssText;
    try {
      await navigator.clipboard.writeText(cssText);
      status.textContent = "CSS copied.";
    } catch (_) {
      status.textContent = "Clipboard permission denied.";
    }
  }

  panel.querySelector('[data-action="apply"]').addEventListener("click", applyCss);
  panel.querySelector('[data-action="reset"]').addEventListener("click", resetCss);
  panel.querySelector('[data-action="copy"]').addEventListener("click", copyCss);
  panel.querySelector(".close").addEventListener("click", clearSelection);

  document.addEventListener("mousemove", mouseMove, true);
  document.addEventListener("click", onClick, true);
  window.addEventListener("scroll", () => {
    if (selected) {
      const rect = positionElementOverlay(selected);
      positionPanel(rect);
    } else if (hovered) {
      positionElementOverlay(hovered);
    }
  }, true);
  window.addEventListener("resize", () => {
    if (selected) {
      const rect = positionElementOverlay(selected);
      positionPanel(rect);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !active) return;
    if (selected) clearSelection();
    else deactivate();
  }, true);

  function activate() {
    if (!host.isConnected) document.documentElement.appendChild(host);
    active = true;
  }

  function deactivate() {
    active = false;
    clearSelection();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type === "lci:toggle") {
      if (active) deactivate();
      else activate();
      sendResponse({ active });
      return true;
    }
    if (request?.type === "lci:getState") {
      sendResponse({ active });
      return true;
    }
  });

  window.__liveCssInspector = true;
})();
