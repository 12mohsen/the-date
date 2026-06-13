// ============================================================
//  biometric.js — تسجيل الدخول بالبصمة / Face ID (WebAuthn)
//  النسخة 2 — محسّنة للأجهزة الذكية (Android / iOS)
// ============================================================

(function () {
  "use strict";

  // ──────────────────────────────────────────────
  //  ثوابت التخزين
  // ──────────────────────────────────────────────
  const BIO_USER_KEY       = "dayCounterBioUser";
  const BIO_CRED_KEY       = "dayCounterBioCredId";
  const BIO_REGISTERED_KEY = "dayCounterBioRegistered";

  // ──────────────────────────────────────────────
  //  مساعدات Base64url ↔ ArrayBuffer
  //  (نستخدم Base64url لأنه آمن مع rawId الكبير على الموبايل)
  // ──────────────────────────────────────────────
  function bufToB64url(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    // نبني النص بيت بيت بدلاً من spread لتجنب stack overflow على الموبايل
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  function b64urlToBuf(b64url) {
    // أعد padding
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf.buffer;
  }

  // ──────────────────────────────────────────────
  //  الحصول على rpId الصحيح
  //  — إذا كان الموقع على netlify/github/أي domain: نستخدمه
  //  — إذا كان file:// أو localhost: نستخدم "" (بدون rpId)
  //    لأن WebAuthn يرفض localhost على كثير من الأجهزة
  // ──────────────────────────────────────────────
  function getRpId() {
    const host = location.hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") {
      return null; // لا نُرسل rpId — المتصفح يختاره تلقائياً
    }
    return host;
  }

  // ──────────────────────────────────────────────
  //  التحقق من دعم المتصفح + البيومتري على الجهاز
  // ──────────────────────────────────────────────
  function isBioSupported() {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function" &&
      typeof navigator.credentials.get === "function"
    );
  }

  // فحص أعمق: هل يوجد authenticator منصّة فعلاً؟ (بصمة / وجه)
  async function isPlatformAuthAvailable() {
    try {
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch (e) {}
    return false;
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
  //  تسجيل البصمة (Enroll) — محسّن للموبايل
  // ──────────────────────────────────────────────
  async function enrollBiometric(username) {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // user.id يجب أن يكون ArrayBuffer (ليس نص مباشرة)
    const userIdBytes = new TextEncoder().encode(username);

    const rpId = getRpId();

    const publicKeyOptions = {
      challenge,
      rp: {
        name: "عداد الأيام",
        // لا نُرسل rp.id إذا كنا على localhost/file
        ...(rpId ? { id: rpId } : {}),
      },
      user: {
        id: userIdBytes,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7,   type: "public-key" }, // ES256  — مدعوم على Android/iOS
        { alg: -257, type: "public-key" }, // RS256  — احتياطي
        { alg: -8,   type: "public-key" }, // EdDSA  — احتياطي
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",  // بصمة/وجه داخلي
        userVerification: "required",
        // residentKey: "preferred" أفضل من requireResidentKey على Android الحديث
        residentKey: "preferred",
        requireResidentKey: false,
      },
      timeout: 90000,   // زيادة الوقت للأجهزة البطيئة
      attestation: "none",
    };

    try {
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
      if (!credential) return { ok: false, error: "cancelled" };

      localStorage.setItem(BIO_USER_KEY,       username);
      localStorage.setItem(BIO_CRED_KEY,       bufToB64url(credential.rawId));
      localStorage.setItem(BIO_REGISTERED_KEY, "1");

      return { ok: true };
    } catch (err) {
      console.warn("[Biometric] enroll error:", err.name, err.message);
      if (err.name === "NotAllowedError")   return { ok: false, error: "denied" };
      if (err.name === "NotSupportedError") return { ok: false, error: "unsupported" };
      if (err.name === "InvalidStateError") return { ok: false, error: "already_registered" };
      return { ok: false, error: err.message || err.name };
    }
  }

  // ──────────────────────────────────────────────
  //  التحقق بالبصمة (Verify) — محسّن للموبايل
  // ──────────────────────────────────────────────
  async function verifyBiometric() {
    const credIdB64url = localStorage.getItem(BIO_CRED_KEY);
    if (!credIdB64url) return { ok: false, error: "no_credential" };

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rpId = getRpId();

    const publicKeyOptions = {
      challenge,
      // لا نُرسل rpId إذا كنا على localhost
      ...(rpId ? { rpId } : {}),
      allowCredentials: [{
        id: b64urlToBuf(credIdB64url),
        type: "public-key",
        // ★ لا نُحدد transports — نتركه فارغاً للتوافق مع جميع الأجهزة
      }],
      userVerification: "required",
      timeout: 90000,
    };

    try {
      const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
      if (!assertion) return { ok: false, error: "cancelled" };
      return { ok: true };
    } catch (err) {
      console.warn("[Biometric] verify error:", err.name, err.message);
      if (err.name === "NotAllowedError")  return { ok: false, error: "denied" };
      if (err.name === "InvalidStateError") return { ok: false, error: "no_credential" };
      return { ok: false, error: err.message || err.name };
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
    if (document.getElementById("bio-styles")) return;
    const css = `
      .bio-login-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 13px;
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
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .bio-login-btn:hover,
      .bio-login-btn:active {
        background: var(--color-accent, #6366f1);
        color: #fff;
      }
      .bio-login-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .bio-login-btn .bio-icon {
        font-size: 1.4rem;
        line-height: 1;
      }
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
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .bio-enroll-btn:hover,
      .bio-enroll-btn:active { background: rgba(99,102,241,0.28); }
      .bio-enroll-btn.bio-remove-btn {
        background: rgba(239,68,68,0.12);
        color: #ef4444;
      }
      .bio-enroll-btn.bio-remove-btn:hover,
      .bio-enroll-btn.bio-remove-btn:active { background: rgba(239,68,68,0.22); }
      .bio-msg {
        font-size: 0.82rem;
        text-align: center;
        margin-top: 5px;
        color: var(--color-text-secondary, #9ca3af);
        min-height: 18px;
      }
      .bio-msg.bio-success { color: #22c55e; }
      .bio-msg.bio-error   { color: #ef4444; }
      .bio-divider {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0 0;
        color: var(--color-text-secondary, #9ca3af);
        font-size: 0.82rem;
      }
      .bio-divider::before,
      .bio-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--color-border, rgba(255,255,255,0.12));
      }
    `;
    const el = document.createElement("style");
    el.id = "bio-styles";
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ──────────────────────────────────────────────
  //  بناء عناصر البصمة في شاشة الدخول
  // ──────────────────────────────────────────────
  function buildAuthBioElements() {
    if (document.getElementById("bio-login-section")) return;

    const section = document.createElement("div");
    section.id = "bio-login-section";
    section.style.display = "none";

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

    const loginFields = document.getElementById("auth-login-fields");
    if (loginFields) {
      loginFields.appendChild(section);
    } else {
      const form = document.getElementById("auth-form");
      if (form) form.appendChild(section);
    }

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
        if (typeof startAppForUser === "function") {
          await startAppForUser(bioUser);
        }
      } else if (res.error === "denied") {
        msg.textContent = "❌ تم رفض التحقق أو إلغاؤه.";
        msg.className = "bio-msg bio-error";
      } else if (res.error === "no_credential") {
        msg.textContent = "⚠ انتهت صلاحية البصمة. أعد التفعيل بعد الدخول.";
        msg.className = "bio-msg bio-error";
        removeBioRegistration();
        refreshBioUI();
      } else {
        msg.textContent = "⚠ تعذّر التحقق: " + res.error;
        msg.className = "bio-msg bio-error";
      }
    });
  }

  // ──────────────────────────────────────────────
  //  بناء زر التفعيل/الإلغاء في شريط المستخدم
  // ──────────────────────────────────────────────
  function buildUserBarBioBtn() {
    const userBar = document.getElementById("user-bar");
    if (!userBar || document.getElementById("bio-enroll-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bio-enroll-btn";
    btn.className = "bio-enroll-btn";

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      userBar.insertBefore(btn, logoutBtn);
    } else {
      userBar.appendChild(btn);
    }

    btn.addEventListener("click", async () => {
      if (isBioRegistered()) {
        const ok = confirm("هل تريد إلغاء تسجيل البصمة من هذا الجهاز؟");
        if (!ok) return;
        removeBioRegistration();
        refreshBioUI();
        return;
      }

      const username = (typeof getCurrentUsername === "function")
        ? getCurrentUsername()
        : localStorage.getItem("dayCounterUser") || "";

      if (!username) {
        alert("يجب تسجيل الدخول أولاً.");
        return;
      }

      // فحص أولي هل الجهاز يدعم البيومتري أصلاً
      const hasAuthenticator = await isPlatformAuthAvailable();
      if (!hasAuthenticator) {
        alert("جهازك لا يدعم البصمة أو لم تُفعَّل في إعدادات الجهاز.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "⏳ جارٍ التسجيل...";

      const res = await enrollBiometric(username);
      btn.disabled = false;

      if (res.ok) {
        refreshBioUI();
        btn.textContent = "✅ تم التفعيل!";
        setTimeout(refreshBioUI, 1500);
      } else if (res.error === "denied") {
        alert("تم رفض إذن البصمة.\nتأكد من السماح بالوصول في إعدادات المتصفح أو الجهاز.");
        refreshBioUI();
      } else if (res.error === "unsupported") {
        alert("جهازك لا يدعم المصادقة البيومترية.");
        refreshBioUI();
      } else if (res.error === "already_registered") {
        // سبق تسجيل هذا الجهاز — نعتبره مسجلاً
        localStorage.setItem(BIO_REGISTERED_KEY, "1");
        localStorage.setItem(BIO_USER_KEY, username);
        refreshBioUI();
      } else if (res.error === "cancelled") {
        refreshBioUI();
      } else {
        alert("حدث خطأ أثناء تسجيل البصمة:\n" + res.error);
        refreshBioUI();
      }
    });
  }

  // ──────────────────────────────────────────────
  //  تحديث الواجهة
  // ──────────────────────────────────────────────
  function refreshBioUI() {
    const registered = isBioRegistered();

    const loginSection = document.getElementById("bio-login-section");
    if (loginSection) {
      loginSection.style.display = registered ? "block" : "none";
      const msg = document.getElementById("bio-login-msg");
      if (msg) { msg.textContent = ""; msg.className = "bio-msg"; }
    }

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
  //  التهيئة
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

    // مراقبة تغيّر حالة تسجيل الدخول
    const observer = new MutationObserver(() => {
      const mainApp = document.getElementById("main-app");
      const authScr = document.getElementById("auth-screen");

      if (mainApp && !mainApp.hidden) {
        buildUserBarBioBtn();
        refreshBioUI();
      }
      if (authScr && !authScr.hidden) {
        refreshBioUI();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["hidden"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
