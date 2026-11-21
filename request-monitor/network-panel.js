function refresh() {
  chrome.runtime.sendMessage({
    type: "rm:getReport",
    tabId: chrome.devtools.inspectedWindow.tabId
  }, (report) => {
    if (chrome.runtime.lastError || !report) return;
    const list = document.getElementById("list");
    list.replaceChildren();

    if (!report.requests.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Reload or navigate in the inspected page.";
      list.appendChild(empty);
      return;
    }

    for (const request of [...report.requests].reverse()) {
      const row = document.createElement("button");
      row.className = "row";
      row.title = request.requestBody
        ? `Request body: ${request.requestBody.slice(0, 1000)}`
        : request.url;

      const method = document.createElement("span");
      method.textContent = request.method;
      const status = document.createElement("span");
      status.textContent = request.status;
      const url = document.createElement("span");
      url.className = "url";
      url.textContent = request.url;
      const type = document.createElement("span");
      type.textContent = request.type;
      const time = document.createElement("span");
      time.textContent = Number.isFinite(request.duration)
        ? `${Math.round(request.duration)} ms`
        : "—";

      row.append(method, status, url, type, time);
      list.appendChild(row);
    }
  });
}

document.getElementById("refresh").addEventListener("click", refresh);
refresh();
setInterval(refresh, 1000);
