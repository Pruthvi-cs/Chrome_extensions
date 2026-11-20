# Mailshield

A Manifest V3 Chrome extension for Gmail threat detection and email forensic information.

## Installation

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `Mailshield` folder.

## Usage

Open Gmail and reload the extension after the setup is complete. The content script can run on Gmail pages.

## Permissions

- `identity`: supports Chrome identity-based integration.
- Gmail metadata and Gmail host access are declared in `manifest.json`.

## Configuration

Gmail API access requires a valid Google Cloud OAuth configuration. Keep OAuth credentials private and restrict them to the appropriate extension application.
