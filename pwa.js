// ============================================================
//  pwa.js — تثبيت التطبيق (PWA) والعمل بدون إنترنت
// ============================================================
//  • يسجّل sw.js ليعمل التطبيق بدون إنترنت
//  • يعرض زر «⬇ تثبيت التطبيق» في شريط المستخدم عند توفّر التثبيت
//  • على iPhone/iPad (لا يدعم التثبيت التلقائي) يعرض شرح الخطوات
//  • يخفي الزر تلقائياً إذا كان التطبيق مثبَّتاً بالفعل
//
//  ملف مستقل لا يُعدّل أي منطق في التطبيق.
// ============================================================

(function () {
  "use strict";

  let deferredPrompt = null;

  // ── هل التطبيق يعمل مثبَّتاً (نافذة مستقلة)؟ ──
  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://")
    );
  }

  // ── هل الجهاز iPhone / iPad؟ ──
  function isIOS() {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  // ترجمة آمنة: تعمل حتى لو لم يُحمَّل i18n.js
  function tr(key, fallback) {
    if (typeof t === "function") {
      const v = t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  // ════════════════════════════════════════════
  //  1) تسجيل Service Worker
  // ════════════════════════════════════════════
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    // لا يعمل من file:// — يحتاج http أو https
    if (location.protocol !== "http:" && location.protocol !== "https:") return;

    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker جاهز:", reg.scope);
        // تحديث فوري عند وجود نسخة جديدة في الانتظار
        if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              nw.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch((err) => console.warn("[PWA] فشل تسجيل Service Worker:", err && err.message));
  }

  // ════════════════════════════════════════════
  //  2) زر التثبيت في شريط المستخدم
  // ════════════════════════════════════════════
  function getInstallBtn() {
    return document.getElementById("install-app-btn");
  }

  function buildInstallBtn() {
    const userBar = document.getElementById("user-bar");
    if (!userBar || getInstallBtn()) return getInstallBtn();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "install-app-btn";
    btn.className = "change-pw-btn install-app-btn";
    btn.setAttribute("data-i18n", "installBtn");
    btn.textContent = tr("installBtn", "⬇ تثبيت التطبيق");
    btn.hidden = true;

    // نضعه قبل زر المشاركة إن وُجد، وإلا في نهاية الشريط
    const shareBtn = document.getElementById("share-btn");
    if (shareBtn) userBar.insertBefore(btn, shareBtn);
    else userBar.appendChild(btn);

    btn.addEventListener("click", onInstallClick);
    return btn;
  }

  function showInstallBtn() {
    const btn = buildInstallBtn();
    if (btn) btn.hidden = false;
  }

  function hideInstallBtn() {
    const btn = getInstallBtn();
    if (btn) btn.hidden = true;
  }

  // ════════════════════════════════════════════
  //  3) منطق التثبيت
  // ════════════════════════════════════════════
  async function onInstallClick() {
    // أندرويد / ويندوز / كروم: نافذة التثبيت الرسمية
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      prompt.prompt();
      try {
        const choice = await prompt.userChoice;
        if (choice && choice.outcome === "accepted") hideInstallBtn();
        else showInstallBtn(); // رفض التثبيت — نُبقي الزر متاحاً
      } catch (e) {
        showInstallBtn();
      }
      return;
    }

    // iPhone / iPad: شرح الخطوات اليدوية
    const title = tr("installIOSTitle", "تثبيت التطبيق على الشاشة الرئيسية");
    const msg   = tr("installIOSMsg",
      "١) اضغط زر المشاركة ⬆️ في أسفل المتصفح\n٢) اختر «إضافة إلى الشاشة الرئيسية»\n٣) اضغط «إضافة»");
    if (window.showConfirmDialog) {
      await window.showConfirmDialog({
        title,
        message: msg,
        confirmText: tr("installOkBtn", "حسناً"),
        cancelText: tr("cancelBtn", "إلغاء"),
        icon: "note",
        compact: true,
      });
    } else {
      alert(title + "\n\n" + msg);
    }
  }

  // ════════════════════════════════════════════
  //  4) الأحداث
  // ════════════════════════════════════════════
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();          // نمنع الشريط التلقائي ونستخدم زرّنا
    deferredPrompt = e;
    if (!isStandalone()) showInstallBtn();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallBtn();
    console.log("[PWA] تم تثبيت التطبيق");
  });

  // ════════════════════════════════════════════
  //  5) التهيئة
  // ════════════════════════════════════════════
  function init() {
    registerSW();

    if (isStandalone()) return;   // مثبَّت بالفعل — لا حاجة للزر

    // iOS لا يُطلق beforeinstallprompt → نعرض الزر مباشرة
    if (isIOS()) {
      showInstallBtn();
    } else {
      buildInstallBtn();          // يُبنى مخفياً وينتظر beforeinstallprompt
    }

    // شريط المستخدم يُعاد بناؤه في بعض الحالات — نتأكد من بقاء الزر
    new MutationObserver(() => {
      const bar = document.getElementById("user-bar");
      if (bar && !getInstallBtn()) {
        const btn = buildInstallBtn();
        if (btn && (deferredPrompt || isIOS())) btn.hidden = false;
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
