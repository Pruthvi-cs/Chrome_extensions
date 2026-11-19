# YouTube Ad Blocker

This Manifest V3 extension removes common YouTube ad elements, skips video ads
when a skip control is available, and blocks common advertising requests.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this `youtube-ad-blocker` folder.

Use the extension popup to enable or disable blocking. YouTube changes its
player frequently, so selectors and request rules may need maintenance.

The extension folder is monitored by the local auto-committer watcher.

Stop the watcher with `Ctrl+C` when local monitoring is no longer needed.

Reload the unpacked extension from `chrome://extensions` after source changes.

The popup setting is stored locally in Chrome.
