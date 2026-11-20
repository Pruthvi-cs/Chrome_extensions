chrome.storage.sync.get(["nceEndpoint", "nceApiKey", "nceModel"], (settings) => {
  document.getElementById("endpoint").value =
    settings.nceEndpoint || "https://api.openai.com/v1/chat/completions";
  document.getElementById("apiKey").value = settings.nceApiKey || "";
  document.getElementById("model").value = settings.nceModel || "gpt-4o-mini";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    nceEndpoint: document.getElementById("endpoint").value.trim(),
    nceApiKey: document.getElementById("apiKey").value.trim(),
    nceModel: document.getElementById("model").value.trim()
  }, () => {
    document.getElementById("saved").textContent = "Saved.";
  });
});
