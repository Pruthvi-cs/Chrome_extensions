# Universal Ad Blocker

A Manifest V3 Chrome extension that blocks common advertising networks and removes ad elements from webpages.

## Features

- Declarative network blocking for common ad and tracking domains.
- Visible ad removal for YouTube, Spotify, and generic web ad containers.
- Per-tab blocked-ad counter in the popup.
- Global enable and disable control.
- Uses Chrome local storage for the protection setting.

## Installation

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `universal-ad-blocker` folder.

## Usage

Open any regular webpage and click the extension icon to view the blocked-ad count and toggle protection.

## Permissions

- `storage`: saves the enabled setting.
- `tabs`: identifies the active tab.
- `declarativeNetRequest`: enables and disables network blocking rules.
- `<all_urls>`: allows page and network integration.

## Limitations

Ad formats change frequently. Declarative rules and content-script selectors may require updates to cover new ad providers.
