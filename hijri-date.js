// ============ HijriDate — وحدة التاريخ الهجري (حل جذري) ============
// ملف مستقل. يعتمد على تقويم أم القرى المدمج في المتصفح (islamic-umalqura)
// بدون أي تصحيح ثابت (+1 أو -1) — فهذا كان سبب الخطأ السابق.
//
// الفكرة الجذرية:
// 1) جدول أم القرى في المتصفح دقيق رسميًا، فنستخدمه كما هو.
// 2) في الحالات النادرة التي تختلف فيها الرؤية الشرعية عن الجدول،
//    يضبط المستخدم فرقًا (−2 إلى +2 يوم) يُحفظ في localStorage
//    ويُطبَّق على كل التواريخ حتى يعيده المستخدم للصفر.
// 3) يوم الأسبوع يُؤخذ دائمًا من التاريخ الحقيقي (لا يتأثر بالضبط).
//
// الاستخدام:
//   HijriDate.format(new Date())        → "الأحد، ٢٠ محرم ١٤٤٨ هـ"
//   HijriDate.parts(new Date())         → { day, month, year, monthName, weekday }
//   HijriDate.setAdjustment(1)          → تقديم يوم (يُحفظ تلقائيًا)
//   HijriDate.getAdjustment()           → قيمة الضبط الحالية
// كما يضيف تلقائيًا زرّي (− +) بجانب عنصر #clock-hijri لضبط الفرق.

(function () {
  "use strict";

  var STORAGE_KEY = "hijri-adjustment";
  var MIN_ADJ = -2, MAX_ADJ = 2;
  var DAY_MS = 86400000;

  // ===== الضبط اليدوي (محفوظ) =====
  function getAdjustment() {
    var v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (isNaN(v) || v < MIN_ADJ || v > MAX_ADJ) return 0;
    return v;
  }

  function setAdjustment(n) {
    n = Math.max(MIN_ADJ, Math.min(MAX_ADJ, parseInt(n, 10) || 0));
    localStorage.setItem(STORAGE_KEY, String(n));
    notify();
    return n;
  }

  // ===== إشعار المستمعين عند تغيير الضبط =====
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](getAdjustment()); } catch (e) {}
    }
  }

  // ===== التحويل =====
  function adjustedDate(date) {
    return new Date(date.getTime() + getAdjustment() * DAY_MS);
  }

  function supportsUmalqura() {
    try {
      new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura").format(new Date());
      return true;
    } catch (e) { return false; }
  }
  var CAL = supportsUmalqura() ? "islamic-umalqura" : "islamic";

  // "الأحد، ٢٠ محرم ١٤٤٨ هـ" — يوم الأسبوع من التاريخ الحقيقي،
  // والرقم/الشهر/السنة من التاريخ بعد الضبط.
  function format(date) {
    date = date || new Date();
    try {
      var weekday = new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(date);
      var dmy = new Intl.DateTimeFormat("ar-SA-u-ca-" + CAL, {
        day: "numeric", month: "long", year: "numeric"
      }).format(adjustedDate(date));
      return weekday + "، " + dmy;
    } catch (e) {
      return "غير متاح";
    }
  }

  // أجزاء رقمية للاستخدام البرمجي
  function parts(date) {
    date = date || new Date();
    var adj = adjustedDate(date);
    var fmt = new Intl.DateTimeFormat("en-u-ca-" + CAL, {
      day: "numeric", month: "numeric", year: "numeric"
    });
    var p = {};
    fmt.formatToParts(adj).forEach(function (x) {
      if (x.type === "day") p.day = parseInt(x.value, 10);
      if (x.type === "month") p.month = parseInt(x.value, 10);
      if (x.type === "year") p.year = parseInt(x.value, 10);
    });
    p.monthName = new Intl.DateTimeFormat("ar-SA-u-ca-" + CAL, { month: "long" }).format(adj);
    p.weekday = new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(date);
    return p;
  }

  // ===== واجهة ضبط صغيرة بجانب التاريخ الهجري =====
  // زرا (− +) يظهران عند الضغط على التاريخ الهجري في الساعة.
  function attachAdjuster(el) {
    if (!el || el.dataset.hijriAdjuster) return;
    el.dataset.hijriAdjuster = "1";
    el.style.cursor = "pointer";
    el.title = "اضغط لضبط التاريخ الهجري (±)";

    var box = document.createElement("span");
    box.style.cssText = "display:none;margin-inline-start:6px;white-space:nowrap;";
    function mkBtn(txt, delta) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.style.cssText =
        "margin:0 2px;padding:0 8px;border-radius:8px;border:1px solid currentColor;" +
        "background:transparent;color:inherit;font-size:0.85em;cursor:pointer;line-height:1.5;";
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        setAdjustment(getAdjustment() + delta);
      });
      return b;
    }
    box.appendChild(mkBtn("−", -1));
    box.appendChild(mkBtn("+", +1));
    el.parentNode.insertBefore(box, el.nextSibling);

    el.addEventListener("click", function () {
      box.style.display = box.style.display === "none" ? "inline" : "none";
    });
  }

  // محاولة الربط التلقائي بعنصر الساعة (الذي ينشئه clock.js)
  function autoAttach() {
    var el = document.getElementById("clock-hijri");
    if (el) { attachAdjuster(el); return true; }
    return false;
  }
  if (!autoAttach()) {
    var tries = 0;
    var timer = setInterval(function () {
      if (autoAttach() || ++tries > 20) clearInterval(timer);
    }, 500);
  }

  // ===== الواجهة العامة =====
  window.HijriDate = {
    format: format,
    parts: parts,
    getAdjustment: getAdjustment,
    setAdjustment: setAdjustment,
    onChange: onChange,
    attachAdjuster: attachAdjuster
  };
})();
