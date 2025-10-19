// Minimal broker for future expansion (AI/crypto later).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Keep for future: decrypt profile, validations via AI, etc.
  sendResponse({ ok: true });
  return true;
});