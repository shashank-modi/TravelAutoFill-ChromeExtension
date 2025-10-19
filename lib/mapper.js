(() => {
  const KW = {
    fullName: ["full name","name (as in passport)","applicant name","your name","name"],
    givenName: ["given name","first name","forename","givenname"],
    surname: ["surname","last name","family name","lastname","surname/family name"],
    dob: ["date of birth","dob","birth date","birthdate"],
    passportNumber: ["passport","passport no","passport number","pp no","ppno","travel document","document number","mrz"],
    expiry: ["expiry","expires","expiration","valid until","exp date"],
    email: ["email","e-mail","mail id"],
    phone: ["phone","mobile","telephone","contact number"],
    nationality: ["nationality","citizenship"],
    country: ["country","country/region"],
    city: ["city","town"],
    zip: ["zip","postal","postcode","pin"],
    address1: ["address","address line 1","street","addr1"]
  };

  function norm(t){ return (t||"").toLowerCase().replace(/\s+/g," ").trim(); }

  function labelFor(el){
    // 1) <label for=id>
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lab) return lab.innerText;
    }
    // 2) aria-label / placeholder
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    if (el.placeholder) return el.placeholder;
    // 3) nearest text before
    const wrapper = el.closest("div, td, tr, label") || el.parentElement;
    if (wrapper) {
      const texts = [...wrapper.querySelectorAll("label, span, p, div")]
        .slice(0,6).map(n => n.innerText).join(" ");
      if (texts) return texts;
    }
    return "";
  }

  function hasAny(s, arr){ s = norm(s); return arr.some(k => s.includes(k)); }

  function mapKey(el){
    const type = (el.getAttribute("type")||"").toLowerCase();
    const name = norm(el.getAttribute("name"));
    const id   = norm(el.getAttribute("id"));
    const ac   = norm(el.getAttribute("autocomplete"));
    const lab  = norm(labelFor(el));

    // Deterministic hints
    if (type === "email" || ac.includes("email")) return "contact.email";
    if (type === "tel"   || ac.includes("tel"))   return "contact.phone";
    if (type === "date"  || ac.includes("bday"))  return "dob";
    if (/postal|zip|postcode/.test(ac))           return "address.zip";
    if (/country/.test(ac))                       return "address.country";
    if (/given-name/.test(ac))                    return "givenName";
    if (/family-name/.test(ac))                   return "surname";

    const hay = [lab, name, id].join(" ");

    if (hasAny(hay, KW.passportNumber)) return "passport.number";
    if (hasAny(hay, KW.expiry))         return "passport.expiry";
    if (hasAny(hay, KW.dob))            return "dob";
    if (hasAny(hay, KW.email))          return "contact.email";
    if (hasAny(hay, KW.phone))          return "contact.phone";
    if (hasAny(hay, KW.nationality))    return "nationality";
    if (hasAny(hay, KW.zip))            return "address.zip";
    if (hasAny(hay, KW.city))           return "address.city";
    if (hasAny(hay, KW.country))        return "address.country";
    if (hasAny(hay, KW.address1))       return "address.line1";

    if (hasAny(hay, KW.givenName))      return "givenName";
    if (hasAny(hay, KW.surname))        return "surname";
    if (hasAny(hay, KW.fullName))       return "fullName";

    return null;
  }

  function collectFields(doc = document){
    const fields = Array.from(doc.querySelectorAll('input,select,textarea'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    return fields.map(el => ({ el, key: mapKey(el) })).filter(x => x.key);
  }
  globalThis.WizaMapper = { collectFields, mapKey };
})();
