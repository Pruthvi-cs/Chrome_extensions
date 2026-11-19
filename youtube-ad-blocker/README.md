# YouTube Ad Blocker

A Manifest V3 Chrome extension that blocks common YouTube page ads and attempts
to skip video ads when YouTube exposes a skip control.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `youtube-ad-blocker` folder.

After installing, open the extension popup to enable or disable blocking. The
setting is stored locally in Chrome.

## Development

YouTube changes its player and ad delivery frequently. Update `content.js` and
`rules.json` when selectors or ad request patterns change, then click
**Reload** for the unpacked extension in `chrome://extensions`.

The local watcher monitors `R:\learn\extention`, automatically commits changes,
and pushes those commits to the configured Git remote.
