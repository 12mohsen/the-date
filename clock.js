// ============ ساعة + التاريخ الهجري والميلادي ============
// ملف مستقل لا يُعدّل أي منطق في التطبيق.
// التاريخ الهجري يأتي من وحدة HijriDate (hijri-date.js) — بدون أي
// تصحيح ثابت (+1). تأكد من تحميل hijri-date.js قبل هذا الملف.

(function () {
  // ===== حقن أنماط CSS =====
  const css = `
    .clock-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin: 0 auto 16px;
      padding: 10px 18px;
      max-width: 420px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(6px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
      direction: ltr;
    }
    .clock-widget .clock-time-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      direction: ltr;
    }
    .clock-widget .clock-time {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: inherit;
    }
    .clock-widget .clock-format-btn {
      padding: 2px 10px;
      border-radius: 10px;
      border: 1px solid currentColor;
      background: transparent;
      color: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      opacity: 0.7;
      line-height: 1.6;
      white-space: nowrap;
    }
    .clock-widget .clock-format-btn:hover { opacity: 1; }
    .clock-widget .clock-dates {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px 14px;
      font-size: 0.9rem;
      opacity: 0.9;
      direction: rtl;
    }
    .clock-widget .clock-date-item {
      white-space: nowrap;
    }
    .clock-widget .clock-date-label {
      font-weight: 700;
      margin-inline-end: 4px;
      opacity: 0.85;
    }
    body.light-theme .clock-widget {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.10);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== إنشاء العنصر =====
  const widget = document.createElement("div");
  widget.className = "clock-widget";
  widget.innerHTML = `
    <div class="clock-time-row">
      <div class="clock-time" id="clock-time">--:--:--</div>
      <button type="button" class="clock-format-btn" id="clock-format-btn" title="التبديل بين نظام 12 و24 ساعة">24س</button>
    </div>
    <div class="clock-dates">
      <span class="clock-date-item">
        <span class="clock-date-label">هجري:</span><span id="clock-hijri">—</span>
      </span>
      <span class="clock-date-item">
        <span class="clock-date-label">ميلادي:</span><span id="clock-greg">—</span>
      </span>
    </div>
  `;

  // ===== تحديث الساعة والتاريخ =====
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  // ===== نظام 12 / 24 ساعة (محفوظ في localStorage) =====
  const FORMAT_KEY = "clock-hour-format"; // "12" أو "24"
  function getHourFormat() {
    return localStorage.getItem(FORMAT_KEY) === "12" ? "12" : "24";
  }
  function toggleHourFormat() {
    localStorage.setItem(FORMAT_KEY, getHourFormat() === "12" ? "24" : "12");
    syncFormatBtn();
    update();
  }
  function syncFormatBtn() {
    const b = widget.querySelector("#clock-format-btn");
    if (b) b.textContent = getHourFormat() === "12" ? "12س" : "24س";
  }
  function formatTime(now) {
    const m = pad(now.getMinutes()), s = pad(now.getSeconds());
    if (getHourFormat() === "24") {
      return pad(now.getHours()) + ":" + m + ":" + s;
    }
    let h = now.getHours();
    const suffix = h < 12 ? "ص" : "م";
    h = h % 12 || 12;
    return h + ":" + m + ":" + s + " " + suffix;
  }

  function formatHijri(date) {
    // المصدر الوحيد للتاريخ الهجري هو وحدة HijriDate
    if (window.HijriDate) return window.HijriDate.format(date);
    // احتياط إن لم يُحمَّل hijri-date.js: أم القرى مباشرة بدون أي تعديل
    try {
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(date);
    } catch (e) {
      return "غير متاح";
    }
  }

  function formatGregorian(date) {
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return date.toLocaleDateString();
    }
  }

  function update() {
    const now = new Date();
    const t = widget.querySelector("#clock-time");
    const h = widget.querySelector("#clock-hijri");
    const g = widget.querySelector("#clock-greg");
    if (t) t.textContent = formatTime(now);
    if (h) h.textContent = formatHijri(now);
    if (g) g.textContent = formatGregorian(now);
  }

  // ===== إدراج العنصر في مكان مناسب =====
  function mount() {
    const app = document.getElementById("main-app");
    const header = app ? app.querySelector(".app-header") : null;
    if (header) {
      const userBar = header.querySelector("#user-bar");
      if (userBar && userBar.nextSibling) {
        header.insertBefore(widget, userBar.nextSibling);
      } else {
        header.insertBefore(widget, header.firstChild);
      }
    } else {
      document.body.insertBefore(widget, document.body.firstChild);
    }
    const fmtBtn = widget.querySelector("#clock-format-btn");
    if (fmtBtn) fmtBtn.addEventListener("click", toggleHourFormat);
    syncFormatBtn();
    update();
    setInterval(update, 1000);
    // تحديث فوري عند تغيير ضبط الهجري
    if (window.HijriDate) window.HijriDate.onChange(update);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
