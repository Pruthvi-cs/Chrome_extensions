(() => {
  if (window.__imageDownloaderLoaded) return;
  window.__imageDownloaderLoaded = true;

  let enabled = true;
  let currentImage = null;
  let hideTimer = 0;

  const host = document.createElement("div");
  host.id = "image-downloader-host";
  host.style.cssText =
    "position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:2147483647!important;pointer-events:none!important;border:0!important;margin:0!important;padding:0!important;";

  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .download-button {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255,255,255,.38);
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(20,24,31,.88);
      color: white;
      box-shadow: 0 8px 24px rgba(0,0,0,.24);
      backdrop-filter: blur(14px) saturate(150%);
      -webkit-backdrop-filter: blur(14px) saturate(150%);
      font: 700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      line-height: 1;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
      transform: translateY(4px) scale(.96);
      transition: opacity .16s ease, transform .16s ease, background .16s ease;
    }
    .download-button.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .download-button:hover {
      background: rgba(37,99,235,.94);
    }
    .download-button:active {
      transform: scale(.94);
    }
    .icon {
      width: 14px;
      height: 14px;
      display: inline-block;
      border: 1.5px solid currentColor;
      border-top: 0;
      border-radius: 0 0 3px 3px;
      position: relative;
      margin-top: 2px;
    }
    .icon::before {
      content: "";
      position: absolute;
      left: 5px;
      top: -6px;
      width: 1.5px;
      height: 8px;
      background: currentColor;
    }
    .icon::after {
      content: "";
      position: absolute;
      left: 2.5px;
      top: 0;
      width: 6px;
      height: 6px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg);
    }
  `;
  shadow.appendChild(style);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "download-button";
  button.innerHTML = '<span class="icon" aria-hidden="true"></span><span>Download</span>';
  shadow.appendChild(button);

  function getImageUrl(image) {
    if (image.dataset?.src && /^https?:/i.test(image.dataset.src)) {
      return image.dataset.src;
    }
    if (image.src && !/^blob:/i.test(image.src)) {
      return image.src;
    }
    if (image.currentSrc && !/^blob:/i.test(image.currentSrc)) {
      return image.currentSrc;
    }
    return image.dataset?.src || image.src || "";
  }

  function getFileName(url) {
    try {
      if (url.startsWith("data:")) {
        const mime = url.slice(5).split(";")[0];
        const extension = mime.includes("png") ? "png"
          : mime.includes("jpeg") ? "jpg"
          : mime.includes("gif") ? "gif"
          : mime.includes("webp") ? "webp"
          : mime.includes("svg") ? "svg"
          : "image";
        return `image.${extension}`;
      }

      const parsed = new URL(url, location.href);
      let name = decodeURIComponent(parsed.pathname.split("/").pop() || "");
      name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 180);
      if (!name || name === "_") name = "image";
      if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += ".jpg";
      return name;
    } catch {
      return "image";
    }
  }

  function positionButton(image) {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    let left = rect.right - 104;
    let top = rect.top + 8;
    left = Math.max(8, Math.min(left, innerWidth - 112));
    top = Math.max(8, Math.min(top, innerHeight - 44));

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  }

  function showButton(image) {
    if (!enabled) return;
    clearTimeout(hideTimer);
    currentImage = image;
    positionButton(image);
    if (!host.isConnected) document.documentElement.appendChild(host);
    button.classList.add("visible");
  }

  function hideButtonSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      button.classList.remove("visible");
      currentImage = null;
    }, 120);
  }

  document.addEventListener("mouseover", (event) => {
    if (!enabled) return;
    const image = event.target instanceof Element
      ? event.target.closest("img")
      : null;
    if (!image) return;
    showButton(image);
  }, true);

  document.addEventListener("mouseout", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest("img")) return;
    if (event.relatedTarget instanceof Element &&
        event.relatedTarget.closest(".download-button") === button) return;
    hideButtonSoon();
  }, true);

  button.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  button.addEventListener("mouseleave", hideButtonSoon);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentImage) return;

    const url = getImageUrl(currentImage);
    if (!url) return;
    if (!chrome.runtime?.id) {
      button.querySelector("span:last-child").textContent = "Reload page";
      return;
    }

    chrome.runtime.sendMessage({
      type: "imageDownloader:download",
      url,
      filename: getFileName(url)
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("ImageDownloader:", chrome.runtime.lastError.message);
        button.querySelector("span:last-child").textContent = "Download failed";
        setTimeout(() => {
          button.querySelector("span:last-child").textContent = "Download";
        }, 1400);
        return;
      }
      if (!response?.ok) {
        console.warn("ImageDownloader:", response?.error || "Download failed.");
        button.querySelector("span:last-child").textContent = "Download failed";
        setTimeout(() => {
          button.querySelector("span:last-child").textContent = "Download";
        }, 1400);
      }
    });
  });

  window.addEventListener("scroll", () => {
    if (currentImage) positionButton(currentImage);
  }, true);
  window.addEventListener("resize", () => {
    if (currentImage) positionButton(currentImage);
  });

  const listener = (message, sender, sendResponse) => {
    if (message?.type === "imageDownloader:setEnabled") {
      enabled = Boolean(message.enabled);
      if (!enabled) {
        clearTimeout(hideTimer);
        button.classList.remove("visible");
        currentImage = null;
        host.remove();
      }
      sendResponse({ enabled });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  chrome.storage.local.get({ imageDownloaderEnabled: true }, ({ imageDownloaderEnabled }) => {
    enabled = imageDownloaderEnabled;
  });
})();
