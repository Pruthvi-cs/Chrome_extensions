chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "nce:generate") return;

  (async () => {
    const settings = await chrome.storage.sync.get(["nceEndpoint", "nceApiKey", "nceModel"]);
    if (!settings.nceApiKey) throw new Error("Add an API key in extension options.");

    const endpoint = settings.nceEndpoint || "https://api.openai.com/v1/chat/completions";
    const model = settings.nceModel || "gpt-4o-mini";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.nceApiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a CSS editing engine. Return only a JSON object with keys css and html. css is a CSS declarations string (for example 'display:grid;grid-template-columns:repeat(3,1fr);border-radius:12px'). html is either an updated innerHTML fragment or an empty string to keep existing HTML. Do not include markdown or explanations."
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction: message.instruction,
              outerHTML: message.outerHTML,
              computedStyles: message.computedStyles
            })
          }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${detail.slice(0, 500)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ||
      data?.output_text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("The LLM returned no editable content.");

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    sendResponse({ ok: true, result: JSON.parse(cleaned) });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
