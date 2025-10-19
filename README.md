# TravelAutoFill-ChromeExtension

A lightweight Chrome extension that automates repetitive form filling for visa and application portals.  
It securely stores a user’s profile (passport, DOB, contact, address) and fills detected fields across any website — with validation, inline autofill dropdowns, and friendly visual feedback.

---

## Features

| Capability | Description |
|-------------|--------------|
|  **Profile Vault** | Save personal details once (name, DOB, passport, contact, address) using the popup UI. |
|  **Smart Field Mapping** | Heuristic + keyword detection (label, placeholder, name/id) to match form fields automatically. |
|  **One-Click Autofill** | Click **“Autofill This Page”** in the popup to fill all recognized fields instantly. |
|  **Inline Autofill Dropdown** | When focusing a field (e.g., Passport Number, Email), a clean dropdown appears suggesting values from the saved profile. |
|  **Field Validation** | Built-in regex checks for date, email, phone, and passport formats. Highlights invalid fields in red. |
|  **Visual Feedback** | Blue outline = valid, red = review. A floating toast confirms success after autofill. |
|  **Live Cache Sync** | Updates instantly if you edit your profile in the popup (no reload needed). |

---

## How It Works

`
Popup (popup.html)
↓   save / autofill trigger
Background Service Worker
↓
Content Scripts (mapper + validators + inline UI)
↓
Web Page Forms (detected inputs)
`

---

## Setup & Run Locally

1. **Download / unzip** the repository.  

2. **Open Chrome → Extensions**  
chrome://extensions

- Enable **Developer mode**
- Click **Load unpacked**
- Select the folder that contains `manifest.json`

3. **Pin the extension**  
Click the puzzle icon → pin **Wiza AutoFill**

4. **Save a profile**
- Click the extension icon  
- Fill details → **Save Profile**

5. **Test it**
- Open `/demo/testA.html` (included in repo)  
- Click the extension → **Autofill This Page**  
- Watch fields fill with blue/red outlines and a toast summary  
- Focus individual inputs (e.g., Passport No.) to try inline suggestions

---

## Project Structure

wiza-autofill-ext/
├─ manifest.json              # Chrome extension manifest (MV3)
├─ assets/                    # Icon
├─ popup/                     # Popup UI (save + autofill buttons)
├─ content/                   # Content script: mapping + filling + validation
├─ lib/                       # Shared helpers (mapper, validators, inline UI)
├─ background/                # Service worker
└─ demo/                      # One local test form (testA.html)

---

## Limitations

- Only English labels supported in current mapper.
- Some date formats may differ per site.
- SPA forms (React/Vue) re-mapping stub is present but not active.
- Data currently unencrypted (local only).

---

## License

MIT License © 2025 Shashank Modi
*For evaluation use only — not published on Chrome Web Store.*

---

## Contact / Credits

Developed by **Shashank Modi**  
B.Tech CSE, VIT Vellore  
