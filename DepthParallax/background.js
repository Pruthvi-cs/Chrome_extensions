chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "dp:classify") return;

  (async () => {
    const settings = await chrome.storage.sync.get(["dpEndpoint", "dpApiKey", "dpModel"]);
    if (!settings.dpApiKey) throw new Error("Add an API key in extension options.");

    const response = await fetch(settings.dpEndpoint || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.dpApiKey}`
      },
      body: JSON.stringify({
        model: settings.dpModel || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Classify each supplied DOM element for subtle 3D depth parallax. Return only JSON as {\"tiers\":{\"ID\":\"foreground|midground|background\"}}. Use foreground for prominent large hero media/headings, midground for normal cards and content, and background for large decorative backgrounds. Never include fixed or sticky elements."
          },
          { role: "user", content: JSON.stringify(message.summary) }
        ]
      })
    });

    if (!response.ok) throw new Error(`AI request failed (${response.status})`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ||
      data?.output_text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("The AI returned no classification.");

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const result = JSON.parse(cleaned);
    sendResponse({ ok: true, tiers: result.tiers || {} });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
