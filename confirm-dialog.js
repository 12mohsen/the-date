// ============ نافذة تأكيد (حذف / تسجيل خروج) ============
// ملف مستقل يستبدل confirm() الافتراضية بنوافذ أنيقة.
//
// نمطان:
// 1) الافتراضي (بطاقة وسطية): أيقونة دائرية + عنوان + رسالة + أزرار.
// 2) compact (مثل بطاقة "تأكيد حذف السهم"): أيقونة مربعة بجانب العنوان،
//    نص يمين، زر تأكيد أحمر بأيقونة وزر إلغاء داكن.
//
// الاستخدام (ترجع Promise<boolean>):
//   const ok = await showConfirmDialog({
//     title: "تأكيد تسجيل الخروج",
//     subtitle: "سيتم إنهاء الجلسة الحالية",   // اختياري (compact)
//     message: "هل تريد تسجيل الخروج؟",
//     confirmText: "تسجيل الخروج",
//     cancelText: "إلغاء",
//     icon: "logout",      // "trash" (افتراضي) أو "logout"
//     compact: true,       // النمط الثاني
//   });

(function () {
  "use strict";

  // ===== أنماط CSS =====
  const css = `
    .cdlg-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(4, 8, 16, 0.72);
      backdrop-filter: blur(5px);
      direction: rtl;
      animation: cdlg-fade 0.18s ease-out;
    }
    @keyframes cdlg-fade { from { opacity: 0; } to { opacity: 1; } }
    .cdlg-card {
      background: #10182b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 22px;
      padding: 30px 24px 24px;
      max-width: 380px;
      width: calc(100% - 48px);
      text-align: center;
      box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
      font-family: inherit;
      animation: cdlg-pop 0.2s ease-out;
    }
    @keyframes cdlg-pop {
      from { transform: scale(0.92); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }
    .cdlg-icon {
      width: 78px;
      height: 78px;
      margin: 0 auto 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(244, 63, 94, 0.10);
      border: 1.5px solid rgba(244, 63, 94, 0.38);
      flex-shrink: 0;
    }
    .cdlg-icon svg { width: 34px; height: 34px; stroke: #f43f5e; }
    .cdlg-title {
      margin: 0 0 10px;
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 700;
    }
    .cdlg-sub {
      margin: 3px 0 0;
      color: #96a0b5;
      font-size: 0.85rem;
    }
    .cdlg-msg {
      margin: 0 0 24px;
      color: #96a0b5;
      font-size: 1rem;
      line-height: 1.75;
      white-space: pre-line;
    }
    .cdlg-actions { display: flex; gap: 14px; }
    .cdlg-actions button {
      flex: 1;
      padding: 13px 10px;
      border-radius: 14px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: filter 0.15s, background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .cdlg-confirm {
      background: linear-gradient(180deg, #f0475a, #e02c48);
      color: #fff;
      border: none;
      box-shadow: 0 6px 18px rgba(240, 60, 80, 0.35);
    }
    .cdlg-confirm:hover { filter: brightness(1.08); }
    .cdlg-confirm svg { width: 18px; height: 18px; stroke: #fff; }
    .cdlg-cancel {
      background: rgba(255, 255, 255, 0.02);
      color: #dfe5f1;
      border: 2px dashed #3f5583;
    }
    .cdlg-cancel:hover { background: rgba(255, 255, 255, 0.06); }

    /* ===== النمط المدمج (compact) ===== */
    .cdlg-card.cdlg-compact {
      text-align: right;
      padding: 20px 20px 18px;
      border-radius: 18px;
      max-width: 400px;
      background: #0e1526;
    }
    .cdlg-compact .cdlg-head {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .cdlg-compact .cdlg-icon {
      width: 46px;
      height: 46px;
      margin: 0;
      border-radius: 13px;
    }
    .cdlg-compact .cdlg-icon svg { width: 22px; height: 22px; }
    .cdlg-compact .cdlg-title { font-size: 1.15rem; margin: 2px 0 0; }
    .cdlg-compact .cdlg-msg {
      text-align: right;
      font-size: 0.95rem;
      margin: 0 0 18px;
      line-height: 1.8;
    }
    .cdlg-compact .cdlg-actions button {
      padding: 12px 10px;
      border-radius: 13px;
      font-size: 0.98rem;
    }
    .cdlg-compact .cdlg-cancel {
      background: #1a2337;
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .cdlg-compact .cdlg-cancel:hover { background: #222d46; }

    /* ===== حقل الإدخال (نافذة الملاحظة) ===== */
    .cdlg-input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      border-radius: 12px;
      border: 1.5px solid rgba(244, 63, 94, 0.40);
      background: rgba(255, 255, 255, 0.045);
      color: #ffffff;
      font-size: 1rem;
      font-family: inherit;
      text-align: right;
      outline: none;
      margin: 0 0 22px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .cdlg-input:focus {
      border-color: #f43f5e;
      box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
    }
    .cdlg-input::placeholder { color: #64748b; }
    .cdlg-input.cdlg-shake { animation: cdlg-shake 0.3s; border-color: #f43f5e; }
    @keyframes cdlg-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(5px); }
      75% { transform: translateX(-5px); }
    }

    /* الوضع الفاتح */
    body.light-theme .cdlg-card {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 22px 60px rgba(0, 0, 0, 0.2);
    }
    body.light-theme .cdlg-title { color: #1a2233; }
    body.light-theme .cdlg-msg,
    body.light-theme .cdlg-sub   { color: #5b6575; }
    body.light-theme .cdlg-cancel {
      color: #33415c;
      border-color: #94a7cc;
      background: transparent;
    }
    body.light-theme .cdlg-compact .cdlg-cancel {
      background: #eef2f9;
      border: 1px solid #cdd8ea;
    }
    body.light-theme .cdlg-input {
      background: #f7f9fd;
      color: #1a2233;
      border-color: rgba(220, 40, 70, 0.35);
    }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const ICONS = {
    trash: `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18"></path>
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>`,
    logout: `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>`,
    note: `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
      </svg>`,
  };

  window.showConfirmDialog = function (opts) {
    opts = opts || {};
    const compact = !!opts.compact;
    const iconSvg = ICONS[opts.icon] || ICONS.trash;

    return new Promise(function (resolve) {
      const overlay = document.createElement("div");
      overlay.className = "cdlg-overlay";

      const card = document.createElement("div");
      card.className = "cdlg-card" + (compact ? " cdlg-compact" : "");
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");

      const icon = document.createElement("div");
      icon.className = "cdlg-icon";
      icon.innerHTML = iconSvg;

      const title = document.createElement("h3");
      title.className = "cdlg-title";
      title.textContent = opts.title || "تأكيد";

      const msg = document.createElement("p");
      msg.className = "cdlg-msg";
      msg.textContent = opts.message || "هل أنت متأكد؟";

      const actions = document.createElement("div");
      actions.className = "cdlg-actions";

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "cdlg-confirm";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "cdlg-cancel";
      cancelBtn.textContent = opts.cancelText || "إلغاء";

      if (compact) {
        // رأس: أيقونة مربعة + (عنوان وسطر فرعي)
        const head = document.createElement("div");
        head.className = "cdlg-head";
        const headText = document.createElement("div");
        headText.appendChild(title);
        if (opts.subtitle) {
          const sub = document.createElement("p");
          sub.className = "cdlg-sub";
          sub.textContent = opts.subtitle;
          headText.appendChild(sub);
        }
        head.appendChild(icon);
        head.appendChild(headText);
        card.appendChild(head);
        card.appendChild(msg);

        // زر التأكيد بأيقونة — الإلغاء يمين والتأكيد يسار (كما في التصميم)
        const txt = document.createElement("span");
        txt.textContent = opts.confirmText || "تأكيد";
        const ic = document.createElement("span");
        ic.innerHTML = iconSvg;
        ic.style.display = "inline-flex";
        confirmBtn.appendChild(txt);
        confirmBtn.appendChild(ic);
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
      } else {
        // النمط الوسطي: حذف يمين — إلغاء يسار
        confirmBtn.textContent = opts.confirmText || "حذف";
        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(msg);
        actions.appendChild(confirmBtn);
        actions.appendChild(cancelBtn);
      }
      card.appendChild(actions);
      overlay.appendChild(card);

      function close(result) {
        document.removeEventListener("keydown", onKey);
        overlay.remove();
        resolve(result);
      }
      function onKey(e) {
        if (e.key === "Escape") close(false);
        if (e.key === "Enter") close(true);
      }

      confirmBtn.addEventListener("click", function () { close(true); });
      cancelBtn.addEventListener("click", function () { close(false); });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(false);
      });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(overlay);
      cancelBtn.focus();
    });
  };

  // ===== نافذة إدخال نص (بنفس التصميم الوسطي العصري) =====
  // ترجع Promise<string|null>: النص عند التأكيد أو null عند الإلغاء.
  window.showPromptDialog = function (opts) {
    opts = opts || {};
    const iconSvg = ICONS[opts.icon] || ICONS.note;

    return new Promise(function (resolve) {
      const overlay = document.createElement("div");
      overlay.className = "cdlg-overlay";

      const card = document.createElement("div");
      card.className = "cdlg-card";
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");

      const icon = document.createElement("div");
      icon.className = "cdlg-icon";
      icon.innerHTML = iconSvg;

      const title = document.createElement("h3");
      title.className = "cdlg-title";
      title.textContent = opts.title || "إضافة ملاحظة";

      const msg = document.createElement("p");
      msg.className = "cdlg-msg";
      msg.textContent = opts.message || "";
      if (!opts.message) msg.style.display = "none";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "cdlg-input";
      input.placeholder = opts.placeholder || "";
      input.value = opts.value || "";
      input.maxLength = opts.maxLength || 120;

      const actions = document.createElement("div");
      actions.className = "cdlg-actions";

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "cdlg-confirm";
      confirmBtn.textContent = opts.confirmText || "حفظ";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "cdlg-cancel";
      cancelBtn.textContent = opts.cancelText || "إلغاء";

      actions.appendChild(confirmBtn);
      actions.appendChild(cancelBtn);
      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(msg);
      card.appendChild(input);
      card.appendChild(actions);
      overlay.appendChild(card);

      function close(result) {
        document.removeEventListener("keydown", onKey);
        overlay.remove();
        resolve(result);
      }
      function submit() {
        const v = input.value.trim();
        if (!v) {
          // اهتزاز خفيف عند محاولة الحفظ بدون نص
          input.classList.remove("cdlg-shake");
          void input.offsetWidth; // إعادة تشغيل الحركة
          input.classList.add("cdlg-shake");
          input.focus();
          return;
        }
        close(v);
      }
      function onKey(e) {
        if (e.key === "Escape") close(null);
        if (e.key === "Enter") submit();
      }

      confirmBtn.addEventListener("click", submit);
      cancelBtn.addEventListener("click", function () { close(null); });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(null);
      });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(overlay);
      input.focus();
    });
  };
})();
