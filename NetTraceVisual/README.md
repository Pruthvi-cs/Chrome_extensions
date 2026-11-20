# NetTrace Visual

A Manifest V3 Chrome side-panel extension for inspecting the active page's destination IP, redirect chain, third-party domains, Globalping traceroute hops, hop geolocation, and route diagnosis.

## Load

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `NetTraceVisual` folder.

## Use

1. Open a normal website.
2. Click the NetTrace Visual toolbar action to open the side panel.
3. Click **Trace Route**.
4. Click **Diagnose Route** after public hops appear.

The extension uses Globalping by default. A custom traceroute backend can be configured on the extension Options page. AI diagnosis also requires an OpenAI-compatible endpoint and API key.
