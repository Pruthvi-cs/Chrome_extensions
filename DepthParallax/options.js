chrome.storage.sync.get(["dpEndpoint", "dpApiKey", "dpModel"], (settings) => {
  document.getElementById("endpoint").value = settings.dpEndpoint || "https://api.openai.com/v1/chat/completions";
  document.getElementById("apiKey").value = settings.dpApiKey || "";
  document.getElementById("model").value = settings.dpModel || "gpt-4o-mini";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    dpEndpoint: document.getElementById("endpoint").value.trim(),
    dpApiKey: document.getElementById("apiKey").value.trim(),
    dpModel: document.getElementById("model").value.trim()
  }, () => {
    document.getElementById("saved").textContent = "Saved.";
  });
});
