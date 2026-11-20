let tab;
let domain;

const toggle = document.getElementById("toggle");
const toggleText = document.getElementById("toggleText");
const domainLabel = document.getElementById("domain");
const blurInput = document.getElementById("blur");
const opacityInput = document.getElementById("opacity");
const blurValue = document.getElementById("blurValue");
const opacityValue = document.getElementById("opacityValue");
const status = document.getElementById("status");

async function ensureContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch (error) {
    throw new Error("This page cannot be themed.");
  }
}

async function getDomainState() {
  const key = `lgDomain:${domain}:enabled`;
  const stored = await chrome.storage.sync.get([key, "lgBlur", "lgOpacity"]);
  const enabled = Boolean(stored[key]);

  blurInput.value = stored.lgBlur ?? 18;
  opacityInput.value = stored.lgOpacity ?? 18;
  updateLabels();
  toggle.classList.toggle("on", enabled);
  toggleText.textContent = enabled ? "Enabled for this domain" : "Enable for this domain";
  status.textContent = enabled ? "Theme is active." : "";
  return enabled;
}

function updateLabels() {
  blurValue.textContent = `${blurInput.value}px`;
  opacityValue.textContent = `${opacityInput.value}%`;
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("http")) {
    status.textContent = "Open a normal website first.";
    toggle.disabled = true;
    return;
  }

  domain = new URL(tab.url).hostname;
  domainLabel.textContent = domain;
  await getDomainState();
}

toggle.addEventListener("click", async () => {
  if (!tab?.id) return;

  try {
    await ensureContent(tab.id);
    const key = `lgDomain:${domain}:enabled`;
    const stored = await chrome.storage.sync.get([key]);
    const enabled = !Boolean(stored[key]);

    await chrome.storage.sync.set({ [key]: enabled });

    if (enabled) {
      await chrome.tabs.sendMessage(tab.id, {
        type: "lg:enable",
        blur: Number(blurInput.value),
        opacity: Number(opacityInput.value)
      });
      status.textContent = "Theme is generating...";
    } else {
      await chrome.tabs.sendMessage(tab.id, { type: "lg:disable" });
      status.textContent = "Theme disabled.";
    }

    toggle.classList.toggle("on", enabled);
    toggleText.textContent = enabled ? "Enabled for this domain" : "Enable for this domain";
  } catch (error) {
    status.textContent = error.message || "Unable to update theme.";
  }
});

async function saveAndApply() {
  updateLabels();
  await chrome.storage.sync.set({
    lgBlur: Number(blurInput.value),
    lgOpacity: Number(opacityInput.value)
  });
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "lg:settings",
      blur: Number(blurInput.value),
      opacity: Number(opacityInput.value)
    });
  } catch {}
}

blurInput.addEventListener("input", saveAndApply);
opacityInput.addEventListener("input", saveAndApply);

init();
