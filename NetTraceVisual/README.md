# NetTrace Visual

A keyless Manifest V3 Chrome side-panel extension for showing the active page's ordered traceroute IP path.

## Load

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `NetTraceVisual` folder.

## Use

1. Open a normal website.
2. Click the NetTrace Visual toolbar action to open the side panel.
3. Click **Trace Route**.
4. View the ordered public IP hops.

The extension uses Globalping by default. A custom traceroute backend can be configured on the extension Options page. No API key is required.
