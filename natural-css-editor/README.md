# Natural CSS Editor

A Manifest V3 Chrome extension that lets you hover over elements, click to freeze a selection, and edit the selected element using natural-language instructions.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder.

## Configure the LLM

Open the extension's **Options** page and enter:

- an OpenAI-compatible chat completions endpoint;
- an API key;
- a model name.

The key is stored with `chrome.storage.sync`. Requests are sent from the MV3 service worker.

## Use

1. Open a normal web page.
2. Click the extension icon and choose **Activate editor**.
3. Hover over an element and click it.
4. Enter instructions such as `make this a 3-column grid with rounded corners`.
5. Use **Undo**, **Keep**, or **Copy CSS** on the floating bar.
