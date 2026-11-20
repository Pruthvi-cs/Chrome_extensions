chrome.storage.sync.get(["lgEndpoint", "lgApiKey", "lgModel"], (settings) => {
  document.getElementById("endpoint").value = settings.lgEndpoint || "https://api.openai.com/v1/chat/completions";
  document.getElementById("apiKey").value = settings.lgApiKey || "";
  document.getElementById("model").value = settings.lgModel || "gpt-4o-mini";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    lgEndpoint: document.getElementById("endpoint").value.trim(),
    lgApiKey: document.getElementById("apiKey").value.trim(),
    lgModel: document.getElementById("model").value.trim()
  }, () => {
    document.getElementById("saved").textContent = "Saved.";
  });
});
