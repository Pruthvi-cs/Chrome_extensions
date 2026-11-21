# Website Data Privacy Scanner

Chrome extension that summarizes likely privacy-related activity from the active webpage.

It reports:
- Third-party network domains.
- Known analytics and advertising trackers.
- Page-visible cookie domains.
- Local storage and session storage usage.
- IndexedDB availability.
- Browser APIs for geolocation, clipboard, notifications, camera, or microphone.
- Tracking and analytics URLs seen in requests.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this folder.

## Limitations

This scanner observes visible browser activity. It does not read form values or request bodies, cannot prove server-side use of personal data, and may miss data sent through mechanisms not visible to Chrome APIs.
