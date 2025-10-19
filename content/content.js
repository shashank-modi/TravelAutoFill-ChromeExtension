(() => {
  const mapper = self.WizaMapper;
  const validators = self.WizaValidators;
  if (!mapper || !validators) {
    console.error("WizaAutofill: dependencies failed to load.");
    return;
  }

  const { collectFields } = mapper;
  const { isISODate, isEmail, isPhone, isPassport } = validators;

  async function getProfile(){
    const { profile } = await chrome.storage.local.get("profile");
    return profile || null;
  }

  function getValueByKey(profile, key){
    // Supports nested keys like "passport.number" or "contact.email"
    return key.split(".").reduce((o,k)=> (o && o[k] !== undefined) ? o[k] : undefined, profile);
  }

  function setValue(el, value){
    if (value == null) return false;
    if (el.tagName === "SELECT") {
      el.value = value;
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function validate(key, value){
    if (!value) return true;
    switch (key) {
      case "dob":                return isISODate(value);
      case "passport.number":    return isPassport(value);
      case "passport.expiry":    return isISODate(value) && new Date(value) > new Date();
      case "contact.email":      return isEmail(value);
      case "contact.phone":      return isPhone(value);
      default: return true;
    }
  }

  function mark(el, ok){
    el.style.outline = ok ? "2px solid #36c" : "2px solid #d33";
    if (!ok) el.title = "Please review this value.";
  }

  async function runAutofill(){
    const profile = await getProfile();
    if (!profile) {
      alert("No profile saved yet. Open the extension popup and save your profile first.");
      return { filled: 0, total: 0, invalid: 0 };
    }

    // If fullName is present but the form needs given/surname and you didn't store split names:
    const givenName = profile.givenName || profile.fullName?.split(" ")?.[0] || "";
    const surname   = profile.surname   || profile.fullName?.split(" ")?.slice(1).join(" ") || "";

    const fields = collectFields(document);
    let filled = 0, total = fields.length, invalid = 0;

    for (const { el, key } of fields) {
      let value = getValueByKey(profile, key);
      if (value == null) {
        if (key === "givenName") value = givenName;
        else if (key === "surname") value = surname;
      }
      const did = setValue(el, value);
      if (did) {
        filled++;
        const ok = validate(key, value);
        if (!ok) invalid++;
        mark(el, ok);
      }
    }
    return { filled, total, invalid };
  }

  // Listen for popup trigger
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "AUTOFILL_NOW") {
      runAutofill().then(stats => {
        sendResponse(stats);
        // Optional toast in-page
        try {
          const t = document.createElement("div");
          t.textContent = `Autofill: ${stats.filled}/${stats.total} (review ${stats.invalid})`;
          Object.assign(t.style, {
            position: "fixed", right: "12px", bottom: "12px",
            background: "#111", color: "#fff", padding: "8px 12px",
            borderRadius: "6px", zIndex: 999999
          });
          document.body.appendChild(t);
          setTimeout(()=> t.remove(), 2500);
        } catch {}
      });
      return true;
    }
  });

  // Re-run mapping on SPA route changes (lightweight)
  const mo = new MutationObserver(() => {
    // You can make this smarter later; for MVP we do nothing automatically.
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
