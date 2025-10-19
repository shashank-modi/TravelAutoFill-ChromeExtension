const $ = id => document.getElementById(id);
const views = {
  home: $("homeView"),
  editor: $("editorView")
};
const statusEl = $("status");

function readForm() {
  return {
    fullName: $("fullName").value.trim(),
    dob: $("dob").value.trim(),
    passport: {
      number: $("ppNumber").value.trim(),
      issuingCountry: $("ppCountry").value.trim().toUpperCase(),
      expiry: $("ppExpiry").value.trim()
    },
    nationality: $("nationality").value.trim().toUpperCase(),
    contact: { email: $("email").value.trim(), phone: $("phone").value.trim() },
    address: {
      line1: $("addr1").value.trim(), city: $("city").value.trim(),
      zip: $("zip").value.trim(), country: $("country").value.trim().toUpperCase()
    }
  };
}

function fillForm(profile) {
  $("fullName").value = profile.fullName || "";
  $("dob").value = profile.dob || "";
  $("ppNumber").value = profile.passport?.number || "";
  $("ppCountry").value = profile.passport?.issuingCountry || "";
  $("ppExpiry").value = profile.passport?.expiry || "";
  $("nationality").value = profile.nationality || "";
  $("email").value = profile.contact?.email || "";
  $("phone").value = profile.contact?.phone || "";
  $("addr1").value = profile.address?.line1 || "";
  $("city").value = profile.address?.city || "";
  $("zip").value = profile.address?.zip || "";
  $("country").value = profile.address?.country || "";
}

async function loadProfile() {
  const { profile } = await chrome.storage.local.get("profile");
  fillForm(profile || {});
  return profile || null;
}

function setStatus(msg, persist = false) {
  statusEl.textContent = msg || "";
  if (msg && !persist) {
    setTimeout(() => {
      if (statusEl.textContent === msg) statusEl.textContent = "";
    }, 2200);
  }
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("active", key === name);
  });
}

$("saveBtn").addEventListener("click", async () => {
  const profile = readForm();
  await chrome.storage.local.set({ profile });
  setStatus("Profile saved");
  showView("home");
});

$("autofillBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab detected.");
    return;
  }
  setStatus("Running autofill…", true);
  try {
    const stats = await chrome.tabs.sendMessage(tab.id, { type: "AUTOFILL_NOW" });
    if (stats && typeof stats.filled === "number") {
      setStatus(`Filled ${stats.filled}/${stats.total} · review ${stats.invalid}`);
    } else {
      setStatus("Autofill trigger sent.");
    }
  } catch (err) {
    console.error("Autofill failed:", err);
    setStatus("This page cannot be autofilled right now.");
  }
});

$("editBtn").addEventListener("click", async () => {
  await loadProfile();
  showView("editor");
  setStatus("");
});

$("backBtn").addEventListener("click", () => {
  showView("home");
});

loadProfile();