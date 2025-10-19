const $ = id => document.getElementById(id);

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
  if (profile) fillForm(profile);
}

$("saveBtn").addEventListener("click", async () => {
  const profile = readForm();
  await chrome.storage.local.set({ profile });
  $("status").textContent = "✅ Profile saved.";
  setTimeout(() => ($("status").textContent = ""), 1500);
});

$("autofillBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  $("status").textContent = "Running autofill…";
  await chrome.tabs.sendMessage(tab.id, { type: "AUTOFILL_NOW" });
});

loadProfile();