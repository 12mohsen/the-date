// ============================================================
//  biometric.js — دخول سريع: بصمة الإصبع (WebAuthn) + رمز PIN
//  يعمل داخل WebView (appcreator24) وعلى المتصفحات العادية
//
//  الآلية:
//  • بعد الدخول بكلمة المرور: زر "تفعيل الدخول السريع"
//  • المستخدم يختار PIN من 6 أرقام
//  • عند فتح التطبيق مجدداً: يظهر لوحة PIN مباشرة
//  • PIN مشفَّر بـ SHA-256 مع salt عشوائي في localStorage
// ============================================================

(function () {
  "use strict";

  // ── مفاتيح التخزين ──
  const PIN_USER_KEY = "dayCounterPinUser";
  const PIN_HASH_KEY = "dayCounterPinHash";
  const PIN_SALT_KEY = "dayCounterPinSalt";
  const PIN_ON_KEY   = "dayCounterPinEnabled";

  // ── تشفير PIN ──
  async function hashPin(pin, salt) {
    const data = new TextEncoder().encode(salt + pin);
    const buf  = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function randomSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // ── حالة ──
  function isPinEnabled() {
    return localStorage.getItem(PIN_ON_KEY) === "1" &&
           !!localStorage.getItem(PIN_USER_KEY) &&
           !!localStorage.getItem(PIN_HASH_KEY);
  }

  function removePin() {
    [PIN_USER_KEY, PIN_HASH_KEY, PIN_SALT_KEY, PIN_ON_KEY].forEach(k => localStorage.removeItem(k));
  }

  // ════════════════════════════════════════════
  //  بصمة الإصبع (WebAuthn / Passkey محلي)
  //
  //  ملاحظة أمنية: البصمة قفل محلي على هذا الجهاز فقط —
  //  تفتح الجلسة المحفوظة ولا تُنشئ جلسة جديدة من الخادم،
  //  تماماً كما يفعل رمز الـ PIN. إثبات الهوية للخادم يبقى
  //  توكن الجلسة، ولهذا نتحقق من صلاحيته بعد كل فتح ناجح.
  // ════════════════════════════════════════════
  const DEV_TOKEN_KEY = "dayCounterDeviceToken";   // مشترك بين البصمة والرمز السريع

  function getDeviceToken() { return localStorage.getItem(DEV_TOKEN_KEY) || ""; }

  // يُنشئ رمز جهاز إن لم يوجد (يتطلب جلسة صالحة الآن)
  async function ensureDeviceToken() {
    if (getDeviceToken()) return { ok: true };
    if (typeof dbDeviceCreate !== "function") return { ok: false, error: "no_fn" };
    const res = await dbDeviceCreate();
    if (res.ok && res.device) {
      localStorage.setItem(DEV_TOKEN_KEY, res.device);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }

  // يُلغى رمز الجهاز فقط إذا لم يبقَ أي دخول سريع مفعَّل
  async function maybeRevokeDevice() {
    if (isPinEnabled() || isFpEnabled()) return;
    const dev = getDeviceToken();
    localStorage.removeItem(DEV_TOKEN_KEY);
    if (typeof dbDeviceRevoke === "function") await dbDeviceRevoke(dev);
  }

  const FP_CRED_KEY = "dayCounterFpCredId";
  const FP_USER_KEY = "dayCounterFpUser";
  const FP_ON_KEY   = "dayCounterFpEnabled";

  let fpAvailable = false;   // يُضبط عند التهيئة

  function b64urlEncode(buf) {
    const bytes = new Uint8Array(buf);
    let str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function b64urlDecode(str) {
    const pad = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function isFpEnabled() {
    return localStorage.getItem(FP_ON_KEY) === "1" &&
           !!localStorage.getItem(FP_CRED_KEY) &&
           !!localStorage.getItem(FP_USER_KEY);
  }

  function removeFp() {
    [FP_CRED_KEY, FP_USER_KEY, FP_ON_KEY].forEach(k => localStorage.removeItem(k));
  }

  // هل يدعم هذا الجهاز بصمة مدمجة؟
  async function checkFpSupport() {
    try {
      if (!window.isSecureContext) return false;           // يتطلب HTTPS
      if (!window.PublicKeyCredential) return false;
      if (!location.hostname) return false;                // لا يعمل من ملف محلي
      if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      return false;
    }
  }

  // تسجيل البصمة لهذا المستخدم على هذا الجهاز
  async function registerFingerprint(username) {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId    = crypto.getRandomValues(new Uint8Array(16));

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "عداد الأيام", id: location.hostname },
          user: { id: userId, name: username, displayName: username },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      });

      if (!cred) return { ok: false, cancelled: true };

      localStorage.setItem(FP_CRED_KEY, b64urlEncode(cred.rawId));
      localStorage.setItem(FP_USER_KEY, username);
      localStorage.setItem(FP_ON_KEY, "1");
      return { ok: true };
    } catch (e) {
      if (e && (e.name === "NotAllowedError" || e.name === "AbortError")) {
        return { ok: false, cancelled: true };
      }
      console.warn("[FP] تعذّر التسجيل:", e && e.name, e && e.message);
      return { ok: false, error: (e && e.name) || "error" };
    }
  }

  // التحقق بالبصمة
  async function verifyFingerprint() {
    if (!isFpEnabled()) return { ok: false, error: "not_enabled" };
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credId    = b64urlDecode(localStorage.getItem(FP_CRED_KEY));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: "public-key", id: credId }],
          userVerification: "required",
          timeout: 60000,
          rpId: location.hostname,
        },
      });

      if (!assertion) return { ok: false, cancelled: true };
      return { ok: true, username: localStorage.getItem(FP_USER_KEY) };
    } catch (e) {
      if (e && (e.name === "NotAllowedError" || e.name === "AbortError")) {
        return { ok: false, cancelled: true };
      }
      console.warn("[FP] تعذّر التحقق:", e && e.name, e && e.message);
      return { ok: false, error: (e && e.name) || "error" };
    }
  }

  // ── دخول التطبيق بعد فتح محلي ناجح (بصمة أو PIN) ──
  async function enterAppAfterUnlock(username) {
    // 1) رمز الجهاز يُنشئ جلسة جديدة — يعمل حتى بعد تسجيل الخروج
    const dev = getDeviceToken();
    if (dev && typeof dbDeviceLogin === "function") {
      const res = await dbDeviceLogin(dev);
      if (res.ok) {
        if (typeof startAppForUser === "function") await startAppForUser(res.username || username);
        return true;
      }
      if (res.error === "invalid_device") {
        // أُلغي الرمز من الخادم (تغيير كلمة مرور أو انتهاء صلاحية)
        localStorage.removeItem(DEV_TOKEN_KEY);
      }
    }

    // 2) احتياطي: جلسة ما زالت صالحة على هذا الجهاز
    const sess = (typeof dbGetUser === "function") ? await dbGetUser(username) : null;
    if (sess) {
      if (typeof startAppForUser === "function") await startAppForUser(username);
      return true;
    }

    alert("انتهت صلاحية الدخول السريع. سجّل الدخول بكلمة المرور مرة واحدة لإعادة تفعيله.");
    refreshBioUI();
    return false;
  }

  // ════════════════════════════════════════════
  //  CSS
  // ════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById("bio-styles")) return;
    const css = `
      /* ── لوحة PIN المنبثقة ── */
      .pin-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.7);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .pin-box {
        background: var(--color-card, #1e1e2e);
        border: 1px solid var(--color-border, rgba(255,255,255,0.12));
        border-radius: 20px;
        padding: 28px 24px 20px;
        width: min(340px, 92vw);
        display: flex; flex-direction: column; align-items: center; gap: 16px;
        font-family: inherit;
        box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      }
      .pin-title {
        font-size: 1.1rem; font-weight: 700;
        color: var(--color-text, #fff);
        margin: 0;
      }
      .pin-subtitle {
        font-size: 0.82rem; color: var(--color-text-secondary, #9ca3af);
        margin: -8px 0 0; text-align: center;
      }
      /* نقاط العرض */
      .pin-dots {
        display: flex; gap: 12px; margin: 4px 0;
      }
      .pin-dot {
        width: 14px; height: 14px; border-radius: 50%;
        border: 2px solid var(--color-accent, #6366f1);
        background: transparent;
        transition: background 0.15s;
      }
      .pin-dot.filled {
        background: var(--color-accent, #6366f1);
      }
      /* شبكة الأرقام */
      .pin-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 10px; width: 100%;
      }
      .pin-key {
        height: 58px; border-radius: 12px; border: none;
        background: var(--color-surface, rgba(255,255,255,0.07));
        color: var(--color-text, #fff);
        font-size: 1.4rem; font-weight: 600;
        cursor: pointer; touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.12s, transform 0.08s;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit;
      }
      .pin-key:active { background: var(--color-accent, #6366f1); transform: scale(0.93); }
      .pin-key.pin-del { font-size: 1.1rem; }
      .pin-key.pin-enter {
        background: var(--color-accent, #6366f1); color: #fff;
        font-size: 0.9rem;
      }
      .pin-key.pin-enter:active { filter: brightness(0.85); }
      .pin-key:disabled { opacity: 0.4; }
      /* رسالة ── */
      .pin-msg {
        font-size: 0.82rem; min-height: 18px; text-align: center;
        color: #ef4444;
      }
      /* زر الدخول بالحساب ──  */
      .pin-alt-btn {
        background: none; border: none; color: var(--color-accent, #6366f1);
        font-size: 0.82rem; cursor: pointer; text-decoration: underline;
        font-family: inherit; padding: 0;
        -webkit-tap-highlight-color: transparent;
      }

      /* ── زر في شاشة الدخول ── */
      .bio-login-btn {
        display: flex; align-items: center; justify-content: center;
        gap: 8px; width: 100%; padding: 13px; margin-top: 10px;
        border-radius: 10px; border: 2px solid var(--color-accent, #6366f1);
        background: transparent; color: var(--color-accent, #6366f1);
        font-size: 1rem; font-weight: 600; cursor: pointer;
        transition: background 0.2s, color 0.2s; font-family: inherit;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation;
      }
      .bio-login-btn:hover, .bio-login-btn:active {
        background: var(--color-accent, #6366f1); color: #fff;
      }
      .bio-login-btn:disabled { opacity: 0.5; }
      .bio-login-btn .bio-icon { font-size: 1.3rem; }
      .bio-login-btn.bio-fp-btn {
        background: rgba(34,197,94,0.14);
        border-color: rgba(34,197,94,0.45);
        color: #22c55e;
        margin-bottom: 8px;
      }
      .bio-login-btn.bio-fp-btn:hover,
      .bio-login-btn.bio-fp-btn:active { background: rgba(34,197,94,0.24); }

      /* ── زر تفعيل/إلغاء في شريط المستخدم ── */
      .bio-enroll-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 12px; border-radius: 8px; border: none;
        background: rgba(99,102,241,0.15); color: var(--color-accent, #6366f1);
        font-size: 0.82rem; font-weight: 600; cursor: pointer;
        transition: background 0.2s; font-family: inherit;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation;
      }
      .bio-enroll-btn:hover, .bio-enroll-btn:active { background: rgba(99,102,241,0.28); }
      .bio-enroll-btn.bio-remove-btn { background: rgba(239,68,68,0.12); color: #ef4444; }
      .bio-enroll-btn.bio-remove-btn:hover,
      .bio-enroll-btn.bio-remove-btn:active { background: rgba(239,68,68,0.22); }

      .bio-divider {
        display: flex; align-items: center; gap: 8px;
        margin: 12px 0 0; color: var(--color-text-secondary, #9ca3af); font-size: 0.82rem;
      }
      .bio-divider::before, .bio-divider::after {
        content:""; flex:1; height:1px;
        background: var(--color-border, rgba(255,255,255,0.12));
      }

      /* اهتزاز عند الخطأ */
      @keyframes pin-shake {
        0%,100%{transform:translateX(0)}
        20%,60%{transform:translateX(-8px)}
        40%,80%{transform:translateX(8px)}
      }
      .pin-shake { animation: pin-shake 0.35s ease; }
    `;
    const el = document.createElement("style");
    el.id = "bio-styles";
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ════════════════════════════════════════════
  //  لوحة PIN المنبثقة (للتسجيل أو للتحقق)
  //  mode: "register" | "verify"
  //  resolve يستقبل: { ok, pin? }
  // ════════════════════════════════════════════
  function showPinPad(mode, subtitle) {
    return new Promise(resolve => {
      // إزالة أي لوحة سابقة
      document.getElementById("pin-overlay-el")?.remove();

      const pinLen = 6;
      let entered  = "";

      const overlay = document.createElement("div");
      overlay.className = "pin-overlay";
      overlay.id = "pin-overlay-el";

      overlay.innerHTML = `
        <div class="pin-box">
          <p class="pin-title">${mode === "register" ? "🔐 اختر رمز الدخول السريع" : "👆 الدخول السريع"}</p>
          <p class="pin-subtitle">${subtitle || (mode === "register" ? "أدخل 6 أرقام كرمز دخول سريع" : "أدخل رمز الـ 6 أرقام")}</p>
          <div class="pin-dots" id="pin-dots">
            ${Array(pinLen).fill('<div class="pin-dot"></div>').join("")}
          </div>
          <div class="pin-grid" id="pin-grid">
            ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pin-key" data-n="${n}">${n}</button>`).join("")}
            <button class="pin-key pin-del" id="pin-del-btn">⌫</button>
            <button class="pin-key" data-n="0">0</button>
            <button class="pin-key pin-enter" id="pin-enter-btn" disabled>✓</button>
          </div>
          <p class="pin-msg" id="pin-msg"></p>
          <button class="pin-alt-btn" id="pin-alt-btn">
            ${mode === "register" ? "إلغاء" : "دخول بكلمة المرور"}
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      const dots     = overlay.querySelectorAll(".pin-dot");
      const enterBtn = overlay.querySelector("#pin-enter-btn");
      const delBtn   = overlay.querySelector("#pin-del-btn");
      const msgEl    = overlay.querySelector("#pin-msg");
      const altBtn   = overlay.querySelector("#pin-alt-btn");

      function updateDots() {
        dots.forEach((d, i) => d.classList.toggle("filled", i < entered.length));
        enterBtn.disabled = entered.length < pinLen;
      }

      function shake() {
        const box = overlay.querySelector(".pin-box");
        box.classList.remove("pin-shake");
        void box.offsetWidth;
        box.classList.add("pin-shake");
      }

      overlay.querySelectorAll(".pin-key[data-n]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (entered.length >= pinLen) return;
          entered += btn.dataset.n;
          updateDots();
          if (entered.length === pinLen) enterBtn.disabled = false;
        });
      });

      delBtn.addEventListener("click", () => {
        entered = entered.slice(0, -1);
        msgEl.textContent = "";
        updateDots();
      });

      altBtn.addEventListener("click", () => {
        overlay.remove();
        resolve({ ok: false, cancelled: true });
      });

      enterBtn.addEventListener("click", () => {
        if (entered.length < pinLen) return;
        overlay.remove();
        resolve({ ok: true, pin: entered });
      });

      // إغلاق بالنقر خارج الصندوق
      overlay.addEventListener("click", e => {
        if (e.target === overlay) {
          overlay.remove();
          resolve({ ok: false, cancelled: true });
        }
      });
    });
  }

  // ════════════════════════════════════════════
  //  تسجيل PIN جديد (خطوتان للتأكيد)
  // ════════════════════════════════════════════
  async function registerPin(username) {
    // الخطوة 1
    const r1 = await showPinPad("register", "أدخل رمز الدخول السريع (6 أرقام)");
    if (!r1.ok) return { ok: false };

    // الخطوة 2: تأكيد
    const r2 = await showPinPad("register", "أعد إدخال الرمز للتأكيد");
    if (!r2.ok) return { ok: false };

    if (r1.pin !== r2.pin) {
      // عرض خطأ
      await showErrorDialog("الرمزان غير متطابقين. حاول مجدداً.");
      return { ok: false, mismatch: true };
    }

    // تخزين مشفّر
    const salt = randomSalt();
    const hash = await hashPin(r1.pin, salt);
    localStorage.setItem(PIN_USER_KEY, username);
    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_HASH_KEY, hash);
    localStorage.setItem(PIN_ON_KEY,   "1");
    return { ok: true };
  }

  // ════════════════════════════════════════════
  //  التحقق من PIN
  // ════════════════════════════════════════════
  async function verifyPin() {
    const user = localStorage.getItem(PIN_USER_KEY);
    const salt = localStorage.getItem(PIN_SALT_KEY);
    const stored = localStorage.getItem(PIN_HASH_KEY);
    if (!user || !salt || !stored) return { ok: false, error: "no_pin" };

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const r = await showPinPad("verify",
        attempts === 0
          ? `مرحباً ${user} 👋`
          : `رمز خاطئ — تبقّى ${maxAttempts - attempts} محاولة`
      );
      if (!r.ok) return { ok: false, error: "cancelled" };

      const hash = await hashPin(r.pin, salt);
      if (hash === stored) return { ok: true, username: user };

      attempts++;
      if (attempts >= maxAttempts) {
        removePin();
        return { ok: false, error: "locked" };
      }
    }
    return { ok: false, error: "locked" };
  }

  // رسالة خطأ بسيطة
  function showErrorDialog(msg) {
    return new Promise(resolve => {
      alert(msg);
      resolve();
    });
  }

  // ════════════════════════════════════════════
  //  بناء زر الدخول السريع في شاشة المصادقة
  // ════════════════════════════════════════════
  function buildAuthBioElements() {
    if (document.getElementById("bio-login-section")) return;

    const section = document.createElement("div");
    section.id = "bio-login-section";
    section.style.display = "none";

    const divider = document.createElement("div");
    divider.className = "bio-divider";
    divider.textContent = "أو";

    // ── زر البصمة ──
    const fpBtn = document.createElement("button");
    fpBtn.type = "button";
    fpBtn.id = "bio-fp-login-btn";
    fpBtn.className = "bio-login-btn bio-fp-btn";
    fpBtn.innerHTML = `<span class="bio-icon">🫆</span><span>الدخول ببصمة الإصبع</span>`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bio-login-btn";
    btn.className = "bio-login-btn";
    btn.innerHTML = `<span class="bio-icon">🔐</span><span>الدخول السريع (رمز الـ 6 أرقام)</span>`;

    section.appendChild(divider);
    section.appendChild(fpBtn);
    section.appendChild(btn);

    fpBtn.addEventListener("click", async () => {
      fpBtn.disabled = true;
      const res = await verifyFingerprint();
      fpBtn.disabled = false;

      if (res.ok) {
        await enterAppAfterUnlock(res.username);
      } else if (res.error && !res.cancelled) {
        alert("تعذّر قراءة البصمة. استخدم كلمة المرور أو الرمز السريع.");
      }
      // cancelled → لا شيء
    });

    const loginFields = document.getElementById("auth-login-fields");
    if (loginFields) loginFields.appendChild(section);

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const res = await verifyPin();
      btn.disabled = false;

      if (res.ok) {
        await enterAppAfterUnlock(res.username);
      } else if (res.error === "locked") {
        alert("تم تجاوز عدد المحاولات. أعد التفعيل بعد تسجيل الدخول بكلمة المرور.");
        refreshBioUI();
      }
      // cancelled → لا شيء
    });
  }

  // ════════════════════════════════════════════
  //  زر التفعيل/الإلغاء في شريط المستخدم
  // ════════════════════════════════════════════
  function buildUserBarBioBtn() {
    const userBar = document.getElementById("user-bar");
    if (!userBar || document.getElementById("bio-enroll-btn")) return;

    // ── زر تفعيل/إلغاء البصمة ──
    const fpBtn = document.createElement("button");
    fpBtn.type = "button";
    fpBtn.id = "bio-fp-enroll-btn";
    fpBtn.className = "bio-enroll-btn";
    fpBtn.style.display = fpAvailable ? "" : "none";

    const logoutRef = document.getElementById("logout-btn");
    if (logoutRef) userBar.insertBefore(fpBtn, logoutRef);
    else userBar.appendChild(fpBtn);

    fpBtn.addEventListener("click", async () => {
      if (isFpEnabled()) {
        if (!confirm("هل تريد إلغاء الدخول بالبصمة على هذا الجهاز؟")) return;
        removeFp();
        await maybeRevokeDevice();
        refreshBioUI();
        return;
      }

      const username = (typeof getCurrentUsername === "function")
        ? getCurrentUsername()
        : localStorage.getItem("dayCounterUser") || "";
      if (!username) { alert("يجب تسجيل الدخول أولاً."); return; }

      fpBtn.disabled = true;
      fpBtn.textContent = "⏳ ضع إصبعك...";
      const res = await registerFingerprint(username);

      if (res.ok) {
        const dev = await ensureDeviceToken();
        if (!dev.ok) {
          removeFp();
          fpBtn.disabled = false;
          refreshBioUI();
          alert("تعذّر ربط الجهاز بالخادم. تأكد من الاتصال بالإنترنت وأعد المحاولة.");
          return;
        }
      }
      fpBtn.disabled = false;

      if (res.ok) {
        fpBtn.textContent = "✅ تم التفعيل!";
        setTimeout(refreshBioUI, 1500);
      } else if (res.cancelled) {
        refreshBioUI();
      } else {
        refreshBioUI();
        alert("تعذّر تفعيل البصمة على هذا الجهاز. تأكد أن قفل الشاشة بالبصمة مفعَّل في إعدادات جهازك.");
      }
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bio-enroll-btn";
    btn.className = "bio-enroll-btn";

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) userBar.insertBefore(btn, logoutBtn);
    else userBar.appendChild(btn);

    btn.addEventListener("click", async () => {
      if (isPinEnabled()) {
        const ok = confirm("هل تريد إلغاء الدخول السريع؟");
        if (!ok) return;
        removePin();
        await maybeRevokeDevice();
        refreshBioUI();
        return;
      }

      const username = (typeof getCurrentUsername === "function")
        ? getCurrentUsername()
        : localStorage.getItem("dayCounterUser") || "";

      if (!username) { alert("يجب تسجيل الدخول أولاً."); return; }

      btn.disabled = true;
      btn.textContent = "⏳ جارٍ التفعيل...";

      const res = await registerPin(username);

      if (res.ok) {
        const dev = await ensureDeviceToken();
        if (!dev.ok) {
          removePin();
          btn.disabled = false;
          refreshBioUI();
          alert("تعذّر ربط الجهاز بالخادم. تأكد من الاتصال بالإنترنت وأعد المحاولة.");
          return;
        }
      }
      btn.disabled = false;

      if (res.ok) {
        refreshBioUI();
        btn.textContent = "✅ تم التفعيل!";
        setTimeout(refreshBioUI, 1500);
      } else if (res.mismatch) {
        refreshBioUI();
      } else {
        refreshBioUI(); // ألغى
      }
    });
  }

  // ════════════════════════════════════════════
  //  تحديث الواجهة
  // ════════════════════════════════════════════
  let refreshing = false;
  function refreshBioUI() {
    if (refreshing) return;
    refreshing = true;
    try { refreshBioUICore(); } finally { refreshing = false; }
  }

  function refreshBioUICore() {
    const enabled   = isPinEnabled();
    const fpEnabled = isFpEnabled();

    const loginSection = document.getElementById("bio-login-section");
    if (loginSection) loginSection.style.display = (enabled || fpEnabled) ? "block" : "none";

    const pinLoginBtn = document.getElementById("bio-login-btn");
    if (pinLoginBtn) pinLoginBtn.style.display = enabled ? "" : "none";

    const fpLoginBtn = document.getElementById("bio-fp-login-btn");
    if (fpLoginBtn) fpLoginBtn.style.display = fpEnabled ? "" : "none";

    const fpEnrollBtn = document.getElementById("bio-fp-enroll-btn");
    if (fpEnrollBtn) {
      fpEnrollBtn.style.display = fpAvailable ? "" : "none";
      if (fpEnabled) {
        fpEnrollBtn.textContent = "🗑 إلغاء البصمة";
        fpEnrollBtn.className = "bio-enroll-btn bio-remove-btn";
      } else {
        fpEnrollBtn.textContent = "🫆 تفعيل بصمة الإصبع";
        fpEnrollBtn.className = "bio-enroll-btn";
      }
    }

    const enrollBtn = document.getElementById("bio-enroll-btn");
    if (enrollBtn) {
      if (enabled) {
        enrollBtn.textContent = "🗑 إلغاء الدخول السريع";
        enrollBtn.className = "bio-enroll-btn bio-remove-btn";
      } else {
        enrollBtn.textContent = "🔐 تفعيل الدخول السريع";
        enrollBtn.className = "bio-enroll-btn";
      }
    }
  }

  // ════════════════════════════════════════════
  //  طلب البصمة تلقائياً عند فتح شاشة الدخول
  //  (مرة واحدة لكل فتح للصفحة)
  // ════════════════════════════════════════════
  let autoPrompted = false;

  async function maybeAutoPrompt() {
    if (autoPrompted || !isFpEnabled()) return;

    const authScr = document.getElementById("auth-screen");
    const mainApp = document.getElementById("main-app");
    if (!authScr || authScr.hidden) return;        // لسنا في شاشة الدخول
    if (mainApp && !mainApp.hidden) return;        // التطبيق مفتوح أصلاً

    autoPrompted = true;
    const fpBtn = document.getElementById("bio-fp-login-btn");
    if (fpBtn) fpBtn.disabled = true;
    const res = await verifyFingerprint();
    if (fpBtn) fpBtn.disabled = false;

    if (res.ok) await enterAppAfterUnlock(res.username);
    // رفض أو إلغاء → يبقى الزر ظاهراً للمحاولة يدوياً
  }

  // ════════════════════════════════════════════
  //  التهيئة
  // ════════════════════════════════════════════
  function init() {
    injectStyles();
    buildAuthBioElements();
    buildUserBarBioBtn();
    refreshBioUI();

    // فحص دعم البصمة ثم إعادة رسم الواجهة
    checkFpSupport().then((ok) => {
      fpAvailable = ok;
      if (!ok && isFpEnabled()) removeFp();   // جهاز لم يعد يدعمها
      refreshBioUI();
      maybeAutoPrompt();
    });

    new MutationObserver(() => {
      const mainApp = document.getElementById("main-app");
      const authScr = document.getElementById("auth-screen");
      if (mainApp && !mainApp.hidden) { buildUserBarBioBtn(); refreshBioUI(); }
      if (authScr && !authScr.hidden) { refreshBioUI(); }
    }).observe(document.body, {
      attributes: true, subtree: true, attributeFilter: ["hidden"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
