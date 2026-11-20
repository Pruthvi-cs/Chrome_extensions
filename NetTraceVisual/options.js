chrome.storage.sync.get(["traceEndpoint", "aiEndpoint", "aiApiKey", "aiModel"], (settings) => {
  document.getElementById("traceEndpoint").value = settings.traceEndpoint || "";
  document.getElementById("aiEndpoint").value = settings.aiEndpoint || "https://api.openai.com/v1/chat/completions";
  document.getElementById("apiKey").value = settings.aiApiKey || "";
  document.getElementById("aiModel").value = settings.aiModel || "gpt-4o-mini";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    traceEndpoint: document.getElementById("traceEndpoint").value.trim(),
    aiEndpoint: document.getElementById("aiEndpoint").value.trim(),
    aiApiKey: document.getElementById("apiKey").value.trim(),
    aiModel: document.getElementById("aiModel").value.trim()
  }, () => {
    document.getElementById("saved").textContent = "Saved.";
  });
});
