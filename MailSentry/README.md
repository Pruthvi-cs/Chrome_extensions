# MailSentry

A Manifest V3 Chrome extension for parsing pasted email headers and reporting basic email-security signals.

## Features

- Parses From, Reply-To, Return-Path, Message-ID, Date, Subject, and Received headers.
- Displays SPF, DKIM, and DMARC results.
- Provides a security assessment and supporting findings.
- Runs entirely from supplied header text.

## Installation

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `MailSentry` folder.

## Usage

Paste complete email headers into the popup and select **Analyze**.

## Important

The assessment is informational and is based only on the supplied headers. Authentication passes do not prove that an email is safe.
