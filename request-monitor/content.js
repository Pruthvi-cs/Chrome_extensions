(() => {
  function sendTiming() {
    const timing = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      startTime: Math.round(entry.startTime),
      duration: Math.round(entry.duration),
      transferredSize: entry.transferSize || 0,
      encodedSize: entry.encodedBodySize || 0,
      decodedSize: entry.decodedBodySize || 0
    }));

    chrome.runtime.sendMessage({
      type: "rm:pageTiming",
      timing
    });
  }

  if (document.readyState === "complete") sendTiming();
  else window.addEventListener("load", () => setTimeout(sendTiming, 100), { once: true });

  setInterval(sendTiming, 3000);
})();
