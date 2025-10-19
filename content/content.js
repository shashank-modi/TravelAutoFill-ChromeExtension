(() => {
  const mapper = window.WizaMapper;
  const validators = window.WizaValidators;
  if (!mapper || !validators) {
    console.error("Wiza Autofill: dependencies failed to load.");
    return;
  }

  const { collectFields, mapKey } = mapper;
  const { isISODate, isEmail, isPhone, isPassport } = validators;
  const inlineUI = window.InlineAutofill;

  async function getProfile(){
    const { profile } = await chrome.storage.local.get("profile");
    return profile || null;
  }

  function getValueByKey(profile, key){
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

  const HIGHLIGHT_CLASS_OK = "wiza-autofill-ok";
  const HIGHLIGHT_CLASS_ERR = "wiza-autofill-err";

  function ensureStyles(){
    if (document.getElementById("wiza-autofill-style")) return;
    const css = `
      .wiza-autofill-ok,
      .wiza-autofill-err {
        position: relative;
        transition: box-shadow 0.18s ease, border-color 0.18s ease;
        border-radius: 12px !important;
      }
      .wiza-autofill-ok {
        box-shadow: 0 0 0 3px rgba(80, 125, 255, 0.18);
        border-color: rgba(48, 99, 249, 0.56) !important;
      }
      .wiza-autofill-err {
        box-shadow: 0 0 0 3px rgba(255, 93, 93, 0.22);
        border-color: rgba(220, 70, 70, 0.6) !important;
      }
    `;
    const style = document.createElement("style");
    style.id = "wiza-autofill-style";
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  function mark(el, ok){
    ensureStyles();
    el.classList.remove(ok ? HIGHLIGHT_CLASS_ERR : HIGHLIGHT_CLASS_OK);
    el.classList.add(ok ? HIGHLIGHT_CLASS_OK : HIGHLIGHT_CLASS_ERR);
    if (!ok) el.title = "Please review this value.";
  }

  if (inlineUI) {
    const ELIGIBLE_KEYS = new Set([
      "passport.number","passport.expiry","dob",
      "contact.email","contact.phone",
      "fullName","givenName","surname",
      "address.line1","address.city","address.zip","address.country","nationality"
    ]);

    let cachedProfile = null;
    getProfile().then(p => cachedProfile = p);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.profile) {
        cachedProfile = changes.profile.newValue || null;
      }
    });

    function derivedValueForKey(profile, key){
      if (!profile) return null;
      if (key === "givenName") return profile.givenName || profile.fullName?.split(" ")?.[0] || "";
      if (key === "surname")   return profile.surname   || profile.fullName?.split(" ")?.slice(1).join(" ") || "";
      return getValueByKey(profile, key);
    }

    function handleFocusIn(e){
      const el = e.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return;
      const key = mapKey(el);
      if (!key || !ELIGIBLE_KEYS.has(key)) { inlineUI.hide(); return; }
      const profile = cachedProfile;
      if (!profile) { inlineUI.hide(); return; }

      const value = derivedValueForKey(profile, key);
      if (!value) { inlineUI.hide(); return; }

      const items = [{
        title: "Fill from profile",
        subtitle: value
      }];

      inlineUI.show(el, items, (chosenValue) => {
        const did = setValue(el, chosenValue);
        const ok = validate(key, chosenValue);
        if (did) mark(el, ok);
      });
    }

    document.addEventListener("focusin", handleFocusIn);

    document.addEventListener("focusout", (e) => {
      const anchor = inlineUI.getAnchor ? inlineUI.getAnchor() : null;
      if (!anchor || e.target !== anchor) return;
      setTimeout(() => {
        const current = inlineUI.getAnchor ? inlineUI.getAnchor() : null;
        if (current === anchor) inlineUI.hide();
      }, 180);
    });

  }

  async function runAutofill(){
    const profile = await getProfile();
    if (!profile) {
      alert("No profile saved yet. Open the extension popup and save your profile first.");
      return { filled: 0, total: 0, invalid: 0 };
    }

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

  function showToast(stats){
    try {
      const existing = document.getElementById("wiza-autofill-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.id = "wiza-autofill-toast";
      const success = stats.invalid === 0;
      const title = success ? "Autofill successful" : "Autofill needs review";
      const subtitle = success
        ? `Filled ${stats.filled} of ${stats.total} fields.`
        : `Filled ${stats.filled}/${stats.total}. Review ${stats.invalid} highlighted fields.`;

      toast.innerHTML = `
        <strong>${title}</strong>
        <span>${subtitle}</span>
      `;
      Object.assign(toast.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "12px 16px",
        maxWidth: "280px",
        font: '13px/1.45 "Inter", system-ui, sans-serif',
        background: success
          ? "linear-gradient(140deg, rgba(69,105,255,0.96), rgba(98,132,255,0.92))"
          : "linear-gradient(140deg, rgba(255,110,110,0.94), rgba(255,145,145,0.9))",
        color: "#fff",
        borderRadius: "14px",
        boxShadow: "0 18px 36px rgba(18, 30, 64, 0.22)",
        zIndex: 999999
      });
      document.body.appendChild(toast);
      setTimeout(()=> toast.remove(), 3200);
    } catch (err) {
      console.debug("Wiza Autofill toast failed", err);
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "AUTOFILL_NOW") {
      runAutofill().then(stats => {
        sendResponse(stats);
        showToast(stats);
      });
      return true;
    }
  });

  const mo = new MutationObserver(() => {
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
