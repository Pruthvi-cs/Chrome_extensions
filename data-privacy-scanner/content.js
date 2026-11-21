(() => {
  const signals = [];
  const storage = {
    localStorageKeys: 0,
    sessionStorageKeys: 0,
    indexedDb: false,
    clipboardReadAttempt: false,
    geolocationAttempt: false,
    cameraAttempt: false,
    microphoneAttempt: false,
    notificationAttempt: false
  };

  try {
    storage.localStorageKeys = localStorage.length;
    if (storage.localStorageKeys > 0) {
      signals.push("Local storage contains persistent identifiers or page data");
    }
  } catch (_) {}

  try {
    storage.sessionStorageKeys = sessionStorage.length;
    if (storage.sessionStorageKeys > 0) {
      signals.push("Session storage contains temporary page data");
    }
  } catch (_) {}

  if ("indexedDB" in window) {
    storage.indexedDb = true;
    signals.push("IndexedDB storage is available");
  }

  const addPermissionSignal = (name, property, target = navigator) => {
    if (!(property in target)) return;
    signals.push(`${name} API is available`);
  };

  addPermissionSignal("Geolocation", "geolocation");
  addPermissionSignal("Clipboard", "clipboard");
  addPermissionSignal("Notifications", "Notification", window);

  if (navigator.mediaDevices) {
    if (typeof navigator.mediaDevices.getUserMedia === "function") {
      signals.push("Camera or microphone access API is available");
      storage.cameraAttempt = true;
      storage.microphoneAttempt = true;
    }
  }

  const send = () => {
    chrome.runtime.sendMessage({
      type: "privacy:pageSignals",
      storage,
      signals
    });
  };

  if (document.readyState === "complete") send();
  else window.addEventListener("load", send, { once: true });
})();
