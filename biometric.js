// ============================================================
//  biometric.js — تسجيل الدخول بالبصمة / Face ID (WebAuthn)
// ============================================================
//  ملف مستقل — يُحمَّل بعد main.js في index.html
//
//  الآلية:
//  • عند أول دخول ناجح بكلمة المرور: يعرض زراً "تفعيل البصمة"
//  • بعد التفعيل: يعرض زر "دخول بالبصمة" في شاشة تسجيل الدخول
//  • يخزن اسم المستخدم المرتبط بالبصمة في localStorage
//  • عند نجاح التحقق بالبصمة: يستدعي startAppForUser مباشرة
//
//  لا يعدّل هذا الملف أي منطق في auth-shared.js أو main.js
// ============================================================

(function () {
  "use strict";

  // ──────────────────────────────────────────────
  //  ثوابت التخزين
  // ──────────────────────────────────────────────
  const BIO_USER_KEY      = "dayCounterBioUser";      // اسم المستخدم المرتبط
  const BIO_CRED_KEY      = "dayCounterBioCredId";    // معرّف الـ credential (base64)
  const BIO_REGISTERED_KEY = "dayCounterBioRegistered"; // "1" عند اكتمال التسجيل

  // ──────────────────────────────────────────────
  //  مساعدات Base64 ↔ ArrayBuffer
  // ──────────────────────────────────────────────
  function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  function b64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }

  // ──────────────────────────────────────────────
  //  التحقق من دعم المتصفح
  // ──────────────────────────────────────────────
  function isBioSupported() {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function" &&
      typeof navigator.credentials.get === "function"
    );
  }

  // ──────────────────────────────────────────────
  //  هل البصمة مُفعَّلة لهذا الجهاز؟
  // ──────────────────────────────────────────────
  function isBioRegistered() {
    return localStorage.getItem(BIO_REGISTERED_KEY) === "1" &&
           !!localStorage.getItem(BIO_USER_KEY) &&
           !!localStorage.getItem(BIO_CRED_KEY);
  }

  // ──────────────────────────────────────────────
  //  تسجيل البصمة (Enroll)
  // ──────────────────────────────────────────────
  async function enrollBiometric(username) {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId    = new TextEncoder().encode(username);

    const publicKeyOptions = {
      challenge,
      rp: {
        name: "عداد الأيام",
        id: location.hostname || "localhost",
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7,   type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // جهاز داخلي (بصمة / وجه)
        userVerification: "required",
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none",
    };

    try {
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
      if (!credential) return { ok: false, error: "cancelled" };

      // تخزين بيانات الـ credential
      localStorage.setItem(BIO_USER_KEY,       username);
      localStorage.setItem(BIO_CRED_KEY,       bufToB64(credential.rawId));
      localStorage.setItem(BIO_REGISTERED_KEY, "1");

      return { ok: true };
    } catch (err) {
      console.warn("[Biometric] enroll error:", err.name, err.message);
      if (err.name === "NotAllowedError")  return { ok: false, error: "denied" };
      if (err.name === "NotSupportedError") return { ok: false, error: "unsupported" };
      return { ok: false, error: err.message };
    }
  }

  // ──────────────────────────────────────────────
  //  التحقق بالبصمة (Verify)
  // ──────────────────────────────────────────────
  async function verifyBiometric() {
    const credIdB64 = localStorage.getItem(BIO_CRED_KEY);
    if (!credIdB64) return { ok: false, error: "no_credential" };

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyOptions = {
      challenge,
      rpId: location.hostname || "localhost",
      allowCredentials: [{
        id: b64ToBuf(credIdB64),
        type: "public-key",
        transports: ["internal"],
      }],
      userVerification: "required",
      timeout: 60000,
    };

    try {
      const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
      if (!assertion) return { ok: false, error: "cancelled" };
      return { ok: true };
    } catch (err) {
      console.warn("[Biometric] verify error:", err.name, err.message);
      if (err.name === "NotAllowedError")  return { ok: false, error: "denied" };
      return { ok: false, error: err.message };
    }
  }

  // ──────────────────────────────────────────────
  //  حذف تسجيل البصمة
  // ──────────────────────────────────────────────
  function removeBioRegistration() {
    localStorage.removeItem(BIO_USER_KEY);
    localStorage.removeItem(BIO_CRED_KEY);
    localStorage.removeItem(BIO_REGISTERED_KEY);
  }

  // ──────────────────────────────────────────────
  //  حقن CSS
  // ──────────────────────────────────────────────
  function injectStyles() {
    const css = `
      /* ── زر البصمة في شاشة الدخول ── */
      .bio-login-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        margin-top: 10px;
        border-radius: 10px;
        border: 2px solid var(--color-accent, #6366f1);
        background: transparent;
        color: var(--color-accent, #6366f1);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        font-family: inherit;
      }
      .bio-login-btn:hover {
        background: var(--color-accent, #6366f1);
        color: #fff;
      }
      .bio-login-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .bio-login-btn .bio-icon {
        font-size: 1.3rem;
        line-height: 1;
      }

      /* ── زر تفعيل / إلغاء البصمة في شريط المستخدم ── */
      .bio-enroll-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 8px;
        border: none;
        background: rgba(99,102,241,0.15);
        color: var(--color-accent, #6366f1);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        font-family: inherit;
      }
      .bio-enroll-btn:hover { background: rgba(99,102,241,0.28); }
      .bio-enroll-btn.bio-remove-btn {
        background: rgba(239,68,68,0.12);
        color: #ef4444;
      }
      .bio-enroll-btn.bio-remove-btn:hover { background: rgba(239,68,68,0.22); }

      /* ── رسالة صغيرة تحت زر البصمة ── */
      .bio-msg {
        font-size: 0.82rem;
        text-align: center;
        margin-top: 4px;
        color: var(--color-text-secondary, #9ca3af);
        min-height: 18px;
      }
      .bio-msg.bio-success { color: #22c55e; }
      .bio-msg.bio-error   { color: #ef4444; }

      /* ── فاصل نصي ── */
      .bio-divider {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 0;
        color: var(--color-text-secondary, #9ca3af);
        font-size: 0.82rem;
      }
      .bio-divider::before,
      .bio-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--color-border, rgba(255,255,255,0.1));
      }
    `;
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ──────────────────────────────────────────────
  //  إضافة عناصر البصمة لشاشة تسجيل الدخول
  // ──────────────────────────────────────────────
  function buildAuthBioElements() {
    const form = document.getElementById("auth-form");
    if (!form || document.getElementById("bio-login-section")) return;

    // قسم البصمة في شاشة الدخول
    const section = document.createElement("div");
    section.id = "bio-login-section";
    section.style.display = "none"; // مخفي حتى يُسجَّل

    const divider = document.createElement("div");
    divider.className = "bio-divider";
    divider.textContent = "أو";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bio-login-btn";
    btn.className = "bio-login-btn";
    btn.innerHTML = `<span class="bio-icon">👆</span><span>دخول بالبصمة / Face ID</span>`;

    const msg = document.createElement("p");
    msg.className = "bio-msg";
    msg.id = "bio-login-msg";

    section.appendChild(divider);
    section.appendChild(btn);
    section.appendChild(msg);

    // أضفه داخل حقول الدخول
    const loginFields = document.getElementById("auth-login-fields");
    if (loginFields) {
      loginFields.appendChild(section);
    } else {
      form.appendChild(section);
    }

    // حدث النقر
    btn.addEventListener("click", async () => {
      const bioUser = localStorage.getItem(BIO_USER_KEY);
      if (!bioUser) return;

      btn.disabled = true;
      msg.textContent = "جارٍ التحقق...";
      msg.className = "bio-msg";

      const res = await verifyBiometric();
      btn.disabled = false;

      if (res.ok) {
        msg.textContent = "✅ تم التحقق!";
        msg.className = "bio-msg bio-success";
        // تسجيل الدخول مباشرة
        if (typeof startAppForUser === "function") {
          await startAppForUser(bioUser);
        }
      } else if (res.error === "denied") {
        msg.textContent = "❌ تم رفض التحقق أو إلغاؤه.";
        msg.className = "bio-msg bio-error";
      } else if (res.error === "no_credential") {
        msg.textContent = "لم يُعثر على بصمة مسجَّلة.";
        msg.className = "bio-msg bio-error";
        removeBioRegistration();
        refreshBioUI();
      } else {
        msg.textContent = "تعذّر التحقق بالبصمة.";
        msg.className = "bio-msg bio-error";
      }
    });
  }

  // ──────────────────────────────────────────────
  //  إضافة زر "تفعيل / إلغاء البصمة" في شريط المستخدم
  // ──────────────────────────────────────────────
  function buildUserBarBioBtn() {
    const userBar = document.getElementById("user-bar");
    if (!userBar || document.getElementById("bio-enroll-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bio-enroll-btn";
    btn.className = "bio-enroll-btn";

    // ضعه قبل زر تسجيل الخروج
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      userBar.insertBefore(btn, logoutBtn);
    } else {
      userBar.appendChild(btn);
    }

    btn.addEventListener("click", async () => {
      if (isBioRegistered()) {
        // إلغاء التسجيل
        const ok = confirm("هل تريد إلغاء تسجيل البصمة لهذا الجهاز؟");
        if (!ok) return;
        removeBioRegistration();
        refreshBioUI();
        return;
      }

      // تسجيل جديد
      const username = (typeof getCurrentUsername === "function")
        ? getCurrentUsername()
        : localStorage.getItem("dayCounterUser") || "";

      if (!username) {
        alert("يجب تسجيل الدخول أولاً.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "⏳ جارٍ التسجيل...";

      const res = await enrollBiometric(username);
      btn.disabled = false;

      if (res.ok) {
        refreshBioUI();
        // تأكيد مرئي
        btn.textContent = "✅ تم التفعيل!";
        setTimeout(refreshBioUI, 1500);
      } else if (res.error === "denied") {
        alert("تم رفض إذن البصمة. تأكد من السماح بالوصول في إعدادات المتصفح.");
      } else if (res.error === "unsupported") {
        alert("جهازك لا يدعم المصادقة البيومترية.");
      } else if (res.error === "cancelled") {
        // لا شيء
      } else {
        alert("حدث خطأ أثناء تسجيل البصمة: " + res.error);
      }
    });
  }

  // ──────────────────────────────────────────────
  //  تحديث حالة جميع عناصر البصمة
  // ──────────────────────────────────────────────
  function refreshBioUI() {
    const registered = isBioRegistered();

    // ── شاشة الدخول ──
    const loginSection = document.getElementById("bio-login-section");
    if (loginSection) {
      loginSection.style.display = registered ? "block" : "none";
      const msg = document.getElementById("bio-login-msg");
      if (msg) { msg.textContent = ""; msg.className = "bio-msg"; }
    }

    // ── شريط المستخدم ──
    const enrollBtn = document.getElementById("bio-enroll-btn");
    if (enrollBtn) {
      if (registered) {
        enrollBtn.textContent = "🗑 إلغاء البصمة";
        enrollBtn.className = "bio-enroll-btn bio-remove-btn";
        enrollBtn.title = "إلغاء تسجيل البصمة من هذا الجهاز";
      } else {
        enrollBtn.textContent = "👆 تفعيل البصمة";
        enrollBtn.className = "bio-enroll-btn";
        enrollBtn.title = "تسجيل بصمة / Face ID للدخول السريع";
      }
    }
  }

  // ──────────────────────────────────────────────
  //  التهيئة الرئيسية
  // ──────────────────────────────────────────────
  function init() {
    if (!isBioSupported()) {
      console.info("[Biometric] WebAuthn غير مدعوم في هذا المتصفح.");
      return;
    }

    injectStyles();
    buildAuthBioElements();
    buildUserBarBioBtn();
    refreshBioUI();

    // ── استمع لنجاح تسجيل الدخول لتحديث الواجهة ──
    // ندير الدخول عبر مراقبة ظهور main-app
    const observer = new MutationObserver(() => {
      const mainApp  = document.getElementById("main-app");
      const authScr  = document.getElementById("auth-screen");
      const isLogged = mainApp && !mainApp.hidden;
      const isAuth   = authScr && !authScr.hidden;

      if (isLogged) {
        buildUserBarBioBtn(); // يبني مرة واحدة فقط بفضل الـ guard
        refreshBioUI();
      }
      if (isAuth) {
        refreshBioUI(); // تحديث زر البصمة عند ظهور شاشة الدخول
      }
    });

    const root = document.getElementById("main-app") || document.body;
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["hidden"] });
  }

  // ── تشغيل بعد تحميل الصفحة ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
