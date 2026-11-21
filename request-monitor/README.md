# Live Request Monitor

Chrome side-panel extension that monitors network requests sent and data received by the active webpage.

## Features

- Live request list with method, status, host, path, type, duration, sent size, and received size.
- Search and resource-type filters.
- Request detail panel.
- Pause/resume capture and clear the request log.
- Tracks redirects, response IP, cache status, and browser/network errors.
- Received sizes use browser `PerformanceResourceTiming` where Chrome exposes them.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this folder.
5. Open a website and click the extension toolbar icon.

Chrome and web pages do not expose all raw request or response bodies through Web Request APIs. This extension reports metadata and browser-visible sizes rather than private form values or body content.
