chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "lg:generate") {
    (async () => {
      const settings = await chrome.storage.sync.get(["lgEndpoint", "lgApiKey", "lgModel"]);
      if (!settings.lgApiKey) throw new Error("Configure an API key in the LiquidGlass options.");

      const response = await fetch(settings.lgEndpoint || "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.lgApiKey}`
        },
        body: JSON.stringify({
          model: settings.lgModel || "gpt-4o-mini",
          temperature: 0.35,
          messages: [
            {
              role: "system",
              content: "Generate a JSON object with one key named css containing a complete CSS override sheet as a string. Use backdrop-filter: blur(18px) saturate(160%), semi-transparent rgba surfaces, 1px solid rgba(255,255,255,0.25) borders, and an ambient blurred mesh background behind body. Adapt colors to the supplied page summary. Do not use markdown or explanations."
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
      if (!text) throw new Error("The AI returned no CSS.");

      const cleaned = text.replace(/^```(?:css|json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let css;
      try {
        css = JSON.parse(cleaned).css;
      } catch {
        css = cleaned;
      }
      if (!css) throw new Error("The AI returned an invalid stylesheet.");
      sendResponse({ ok: true, css });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

});
