let tab;

const toggle = document.getElementById("toggle");
const toggleText = document.getElementById("toggleText");
const strengthInput = document.getElementById("strength");
const smoothnessInput = document.getElementById("smoothness");
const strengthValue = document.getElementById("strengthValue");
const smoothnessValue = document.getElementById("smoothnessValue");
const status = document.getElementById("status");

async function ensureContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch {
    throw new Error("This page cannot be enhanced.");
  }
}

function updateLabels() {
  strengthValue.textContent = `${strengthInput.value}px`;
  smoothnessValue.textContent = `${smoothnessInput.value}%`;
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("http")) {
    status.textContent = "Open a normal website first.";
    toggle.disabled = true;
    return;
  }

  const settings = await chrome.storage.sync.get(["dpStrength", "dpSmoothness", "dpEnabled"]);
  strengthInput.value = settings.dpStrength ?? 12;
  smoothnessInput.value = settings.dpSmoothness ?? 18;
  updateLabels();

  const enabled = Boolean(settings.dpEnabled);
  toggle.classList.toggle("on", enabled);
  toggleText.textTextContent = enabled ? "Disable parallax" : "Enable parallax";

  try {
    await ensureContent(tab.id);
  } catch (error) {
    status.textContent = error.message;
  }
}

toggle.addEventListener("click", async () => {
  if (!tab?.id) return;
  try {
    await ensureContent(tab.id);
    const stored = await chrome.storage.sync.get(["dpEnabled"]);
    const enabled = !Boolean(stored.dpEnabled);
    await chrome.storage.sync.set({ dpEnabled: enabled });

    await chrome.tabs.sendMessage(tab.id, {
      type: "dp:toggle",
      enabled,
      strength: Number(strengthInput.value),
      smoothness: Number(smoothnessInput.value)
    });

    toggle.classList.toggle("on", enabled);
    toggleText.textContent = enabled ? "Disable parallax" : "Enable parallax";
    status.textContent = enabled ? "Scanning visible depth..." : "";
  } catch (error) {
    status.textContent = error.message || "Unable to update parallax.";
  }
});

async function saveSettings() {
  updateLabels();
  await chrome.storage.sync.set({
    dpStrength: Number(strengthInput.value),
    dpSmoothness: Number(smoothnessInput.value)
  });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "dp:settings",
    strength: Number(strengthInput.value),
    smoothness: Number(smoothnessInput.value)
  }).catch(() => {});
}

strengthInput.addEventListener("input", saveSettings);
smoothnessInput.addEventListener("input", saveSettings);
init();
