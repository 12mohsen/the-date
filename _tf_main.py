# -*- coding: utf-8 -*-
p='main.js'
s=open(p,encoding='utf-8').read()
def rep(old,new):
    global s
    assert s.count(old)==1, f"count={s.count(old)} for: {old[:50]!r}"
    s=s.replace(old,new)

# A) date locale
rep('  const locale = (typeof getLanguage === "function" && getLanguage() === "en") ? "en-GB" : "ar-EG";',
'''  const _lang = (typeof getLanguage === "function") ? getLanguage() : "ar";
  const locale = _lang === "en" ? "en-GB" : _lang === "id" ? "id-ID" : "ar-EG";''')

# B) era suffix
rep('''  const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
  const gSuffix = isEn ? "" : " م";''',
'  const gSuffix = t("gEraSuffix");')

# C) formatEquivDynamic year label
rep('''    if (n === 0) return `0 ${t("dayUnit")}`;
    const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
    if (n >= 365) {
      const years     = Math.floor(n / 365);
      let rest        = n % 365;
      const remMonths = Math.floor(rest / 30);
      const remDays   = rest % 30;
      // صياغة السنوات
      let yearLabel;
      if (isEn) {
        yearLabel = years === 1 ? "1 year" : `${years} years`;
      } else {
        if (years === 1)      yearLabel = "سنة";
        else if (years === 2) yearLabel = "سنتين";
        else if (years <= 10) yearLabel = `${years} سنوات`;
        else                  yearLabel = `${years} سنة`;
      }
      const parts = [yearLabel];''',
'''    if (n === 0) return `0 ${t("dayUnit")}`;
    if (n >= 365) {
      const years     = Math.floor(n / 365);
      let rest        = n % 365;
      const remMonths = Math.floor(rest / 30);
      const remDays   = rest % 30;
      // صياغة السنوات
      const yearLabel = t("yearsLabel", years);
      const parts = [yearLabel];''')

# D) equivWord/ofWord
rep('''  if (rem === 0 && tot === 0) return "";
  const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
  const equivWord = isEn ? "Equivalent to" : "تعادل";
  const ofWord    = isEn ? "out of"        : "من أصل";''',
'''  if (rem === 0 && tot === 0) return "";
  const equivWord = t("equivWord");
  const ofWord    = t("ofWord");''')

# E) formatDurationLabelDays
rep('''  const n = Math.abs(Math.round(d || 0));
  const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
  if (n === 0) return `0 ${t("dayUnit")}`;
  const parts = [];
  let rest = n;
  if (n >= 365) {
    const years = Math.floor(n / 365);
    rest = n % 365;
    let yearLabel;
    if (isEn) yearLabel = years === 1 ? "1 year" : `${years} years`;
    else if (years === 1) yearLabel = "سنة";
    else if (years === 2) yearLabel = "سنتين";
    else if (years <= 10) yearLabel = `${years} سنوات`;
    else yearLabel = `${years} سنة`;
    parts.push(yearLabel);
  }''',
'''  const n = Math.abs(Math.round(d || 0));
  if (n === 0) return `0 ${t("dayUnit")}`;
  const parts = [];
  let rest = n;
  if (n >= 365) {
    const years = Math.floor(n / 365);
    rest = n % 365;
    parts.push(t("yearsLabel", years));
  }''')

# F) line 617 ofWord
rep('      const _ofWord = (typeof getLanguage === "function" && getLanguage() === "en") ? "out of" : "من أصل";',
'      const _ofWord = t("ofWord");')

# G) datepicker arrays + helpers + fmtDisplay
rep('''  const WDAYS_AR  = ["أح","اث","ثل","أر","خم","جم","سب"];
  const WDAYS_EN  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function isEn() { return typeof getLanguage==="function" && getLanguage()==="en"; }

  function fmtDisplay(d) {
    if (!d) return isEn() ? "Select a date" : "اختر تاريخاً";
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yy = d.getFullYear();
    return isEn() ? `${yy}/${mm}/${dd}` : `${dd}/${mm}/${yy}`;
  }''',
'''  const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun",
                     "Jul","Agu","Sep","Okt","Nov","Des"];
  const WDAYS_AR  = ["أح","اث","ثل","أر","خم","جم","سب"];
  const WDAYS_EN  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const WDAYS_ID  = ["Mg","Sn","Sl","Rb","Km","Jm","Sb"];

  function curLang() { return typeof getLanguage==="function" ? getLanguage() : "ar"; }
  function isEn() { return curLang()==="en"; }
  function isAr() { return curLang()==="ar"; }

  function fmtDisplay(d) {
    if (!d) return (typeof t === "function") ? t("selectDate") : "اختر تاريخاً";
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yy = d.getFullYear();
    // العربية: يوم/شهر/سنة — غيرها (إنجليزي/إندونيسي): سنة/شهر/يوم
    return isAr() ? `${dd}/${mm}/${yy}` : `${yy}/${mm}/${dd}`;
  }''')

# H) render month/wday selection
rep('''  function render() {
    const months = isEn() ? MONTHS_EN : MONTHS_AR;
    const wdays  = isEn() ? WDAYS_EN  : WDAYS_AR;''',
'''  function render() {
    const _l = curLang();
    const months = _l === "ar" ? MONTHS_AR : _l === "id" ? MONTHS_ID : MONTHS_EN;
    const wdays  = _l === "ar" ? WDAYS_AR  : _l === "id" ? WDAYS_ID  : WDAYS_EN;''')

open(p,'w',encoding='utf-8').write(s)
print("main.js all steps done")
