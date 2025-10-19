(() => {
  function isISODate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).valueOf());
  }
  function isEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||""); }
  function isPhone(s){ return /^[0-9+()\-.\s]{7,}$/.test(s||""); }
  // Generic passport (varies by country; this is a safe baseline)
  function isPassport(s){ return /^[A-PR-WY][0-9]{7}$/i.test((s||"").trim()); }

  self.WizaValidators = { isISODate, isEmail, isPhone, isPassport };
})();
