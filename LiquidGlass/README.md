# LiquidGlass

LiquidGlass is a Manifest V3 Chrome extension that applies an AI-generated iOS-style glassmorphism theme to websites.

## Load

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `LiquidGlass` folder.

## Configure

Open the extension's **Options** page and enter an OpenAI-compatible chat completions endpoint, API key, and model name.

## Use

1. Open a website.
2. Open the LiquidGlass popup.
3. Enable the theme for the current domain.
4. Adjust **Blur Intensity** and **Tint Opacity**.

The generated stylesheet is cached per domain in Chrome sync storage. Disabling the theme removes the generated and control styles from that page.*** End Patch
