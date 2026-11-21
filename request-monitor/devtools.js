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

    let host = "";
    let path = "/";
    let protocol = "";
    try {
      const url = new URL(harRequest.url);
      host = url.hostname;
      path = url.pathname + url.search;
      protocol = url.protocol;
    } catch (_) {}

    chrome.runtime.sendMessage({
      type: "rm:devtoolsRequest",
      tabId: chrome.devtools.inspectedWindow.tabId,
      request: {
        requestId: `har:${request.startedDateTime}:${harRequest.url}`,
        method: harRequest.method,
        url: harRequest.url,
        host,
        path,
        protocol,
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
        error: harResponse.status >= 400 ? `HTTP ${harResponse.status}` : "",
        har: {
          startedDateTime: request.startedDateTime,
          time: request.time,
          timings: request.timings,
          serverIPAddress: request.serverIPAddress,
          connection: request.connection,
          resourceType: request._resourceType || request.type || "other",
          requestHeaderSize: harRequest.headersSize,
          responseHeaderSize: harResponse.headersSize,
          requestCompression: harRequest.headersCompression,
          responseCompression: harResponse.headersCompression,
          redirectURL: harResponse.redirectURL,
          mimeType: harResponse.content?.mimeType || "",
          cookies: {
            request: harRequest.cookies || [],
            response: harResponse.cookies || []
          }
        }
      }
    });
  });
});
