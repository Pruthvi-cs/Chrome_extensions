chrome.storage.sync.get(["traceEndpoint"], (settings) => {
  document.getElementById("traceEndpoint").value = settings.traceEndpoint || "";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    traceEndpoint: document.getElementById("traceEndpoint").value.trim()
  }, () => {
    document.getElementById("saved").textContent = "Saved.";
  });
});
