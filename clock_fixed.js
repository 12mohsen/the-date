// ============ ساعة + التاريخ الهجري والميلادي ============
// ملف مستقل لا يُعدّل أي منطق في التطبيق.
// يُضيف عنصراً صغيراً في رأس الصفحة يعرض الساعة الحيّة
// وتاريخ اليوم بالتقويمين الهجري (أم القرى) والميلادي.

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
    .clock-widget .clock-time {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: inherit;
    }
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
    <div class="clock-time" id="clock-time">--:--:--</div>
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

  function formatHijri(date) {
    // تقويم أم القرى الرسمي يختلف أحياناً يوماً عن خوارزمية المتصفح،
    // لذا نفصل يوم الأسبوع (من التاريخ الحقيقي) عن اليوم/الشهر/السنة
    // (من التاريخ + 1 يوم للحصول على الرقم الصحيح وفق الرؤية الرسمية).
    try {
      const corrected = new Date(date.getTime() + 86400000); // +1 يوم تصحيح أم القرى
      const weekday = new Intl.DateTimeFormat("ar-SA", {
        weekday: "long",
      }).format(date);
      const dayMonthYear = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(corrected);
      return weekday + "، " + dayMonthYear;
    } catch (e) {
      try {
        return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        }).format(date);
      } catch (e2) {
        return "غير متاح";
      }
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
    if (t) t.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    if (h) h.textContent = formatHijri(now);
    if (g) g.textContent = formatGregorian(now);
  }

  // ===== إدراج العنصر في مكان مناسب =====
  function mount() {
    const app = document.getElementById("main-app");
    const header = app ? app.querySelector(".app-header") : null;
    if (header) {
      // ضع الساعة في أعلى رأس التطبيق بعد شريط الأزرار العلوي
      const userBar = header.querySelector("#user-bar");
      if (userBar && userBar.nextSibling) {
        header.insertBefore(widget, userBar.nextSibling);
      } else {
        header.insertBefore(widget, header.firstChild);
      }
    } else {
      // احتياط: إذا لم يوجد header
      document.body.insertBefore(widget, document.body.firstChild);
    }
    update();
    setInterval(update, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
