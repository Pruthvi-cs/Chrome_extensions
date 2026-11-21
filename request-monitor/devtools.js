let requestPanel = null;

chrome.devtools.panels.create(
  "Request Monitor",
  "",
  "network-panel.html",
  (panel) => {
    requestPanel = panel;
  }
);

chrome.devtools.network.onRequestFinished.addListener((request) => {
  request.getContent((content, encoding) => {
    const harRequest = request.request;
    const harResponse = request.response;
    let requestBody = "";
    let responseBody = "";

    try {
      requestBody = harRequest.postData?.text || "";
    } catch (_) {}

    if (typeof content === "string") {
      responseBody = encoding === "base64"
        ? `[base64 response, ${content.length} encoded characters]`
        : content.slice(0, 10000);
    }

    chrome.runtime.sendMessage({
      type: "rm:devtoolsRequest",
      tabId: chrome.devtools.inspectedWindow.tabId,
      request: {
        requestId: `har:${request.startedDateTime}:${harRequest.url}`,
        method: harRequest.method,
        url: harRequest.url,
        host: new URL(harRequest.url).hostname,
        path: new URL(harRequest.url).pathname,
        protocol: new URL(harRequest.url).protocol,
        type: request._resourceType || request.type || "other",
        initiator: harRequest.headers.find((item) =>
          item.name.toLowerCase() === "origin"
        )?.value || "",
        status: String(harResponse.status),
        statusText: harResponse.statusText,
        fromCache: Boolean(harResponse.fromCache),
        ip: harResponse.remoteIPAddress || "",
        requestHeaders: harRequest.headers,
        responseHeaders: harResponse.headers,
        requestBody,
        responseBody,
        requestBodyBytes: new Blob([requestBody]).size,
        responseBodyBytes: harResponse.content?.size
          ?? harResponse.bodySize
          ?? null,
        transferredBytes: harResponse._transferSize
          ?? harResponse.bodySize
          ?? null,
        startTime: Date.now() - request.time,
        endTime: Date.now(),
        duration: request.time,
        redirectCount: harResponse.redirectURL ? 1 : 0,
        error: harResponse.status >= 400 ? `HTTP ${harResponse.status}` : ""
      }
    });
  });
});
