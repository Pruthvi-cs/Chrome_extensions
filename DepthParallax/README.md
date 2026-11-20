# DepthParallax

A Manifest V3 Chrome extension that applies subtle AI-classified 3D depth parallax.

## Load

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `DepthParallax` folder.

## Configure

Open the extension options and add an OpenAI-compatible endpoint, API key, and model name.

## Use

1. Open a normal website.
2. Open the DepthParallax popup.
3. Enable parallax.
4. Adjust depth strength and smoothing.

Fixed and sticky elements are excluded, and `prefers-reduced-motion` disables pointer parallax.
