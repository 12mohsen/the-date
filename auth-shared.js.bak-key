// ============================================================
//  auth-shared.js — نظام المصادقة الموحد لجميع التطبيقات
//  ★ الإصدار المحمي: لا يلمس جدول users مباشرة إطلاقاً
//    كل شيء يمرّ عبر دوال security definer داخل القاعدة
// ============================================================
//
//  ما تغيّر:
//    • كلمة المرور تُرسل عبر HTTPS وتُجزّأ بـ bcrypt داخل الخادم
//      (الهاشات القديمة SHA-256 تُرقّى تلقائياً عند أول دخول ناجح)
//    • لا يُقرأ pass_hash ولا hint في المتصفح أبداً
//    • كل جلسة لها توكن، وهو ما يُثبت الهوية لعمليات البيانات
//    • قفل مؤقت بعد 10 محاولات فاشلة خلال 15 دقيقة
//
//  واجهة الدوال لم تتغيّر — main.js يعمل كما هو.
// ============================================================

// ──────────────────────────────────────────────
//  1) هوية التطبيق (الثابت) — غيّر هذا السطر فقط لكل تطبيق
//     ★★★ days_counter / expenses / perfumes ★★★
// ──────────────────────────────────────────────
const APP_ORIGIN = "days_counter";

// ──────────────────────────────────────────────
//  2) الاتصال بـ Supabase (مشترك لكل التطبيقات)
//     ملاحظة: هذا المفتاح عام بطبيعته ويظهر لأي زائر — الحماية
//     الحقيقية في القاعدة (RLS + الدوال)، لا في إخفائه.
// ──────────────────────────────────────────────
const SUPABASE_URL      = "https://tvbuvwjkojhqcxhyehfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnV2d2prb2pocWN4aHllaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDE4MTUsImV4cCI6MjA5MjI3NzgxNX0.egwryYwKu_Bicl_koaYXaKGBoxz42c6k4VkMD9aZSWQ";

// ── عميل احتياطي عند تعذّر تحميل مكتبة supabase (بدون إنترنت) ──
//    يُبقي التطبيق يعمل بالبيانات المحلية بدل أن يتوقف بخطأ.
function createOfflineSupabaseStub() {
  const offlineResult = { data: null, error: { message: "offline" } };
  const chain = () =>
    new Proxy(function () {}, {
      get(_target, key) {
        if (key === "then") return (resolve) => Promise.resolve(offlineResult).then(resolve);
        return () => chain();
      },
      apply() { return chain(); },
    });
  console.warn("[Supabase] لم تُحمَّل المكتبة — التطبيق يعمل بالبيانات المحلية فقط.");
  return { from: () => chain(), rpc: () => chain(), auth: {} };
}

const supabaseClient =
  (typeof supabase !== "undefined" && supabase && typeof supabase.createClient === "function")
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createOfflineSupabaseStub();

// ──────────────────────────────────────────────
//  3) المستخدم الحالي + توكن الجلسة
// ──────────────────────────────────────────────
let currentUsername = null;
let currentToken    = null;

const SESSION_TOKEN_KEY = "app_session_token";

function setSessionToken(token) {
  currentToken = token || null;
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else       localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (e) { /* وضع التصفح الخاص */ }
}

function getSessionToken() {
  if (!currentToken) {
    try { currentToken = localStorage.getItem(SESSION_TOKEN_KEY); } catch (e) {}
  }
  return currentToken || "";
}

function setCurrentUsername(username) {
  currentUsername = username;
  if (!username) setSessionToken(null);   // تسجيل خروج ⇒ إسقاط التوكن
}
function getCurrentUsername() { return currentUsername; }

function handleUnauthorized() {
  setSessionToken(null);
  currentUsername = null;
}

function isUnauthorized(error) {
  return !!error && /unauthorized|28000|JWT|permission denied/i.test(error.message || "");
}

// ──────────────────────────────────────────────
//  4) تجزئة SHA-256 — لم تعد تُستخدم في المصادقة،
//     مُبقاة لأي كود قديم قد يستدعيها
// ──────────────────────────────────────────────
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ──────────────────────────────────────────────
//  5) اقتراحات أسماء بديلة عند التكرار
// ──────────────────────────────────────────────
function generateUsernameSuggestions(base) {
  const year = String(new Date().getFullYear());
  const suffixes = [
    String(Math.floor(Math.random() * 900) + 100),
    year,
    "_" + year.slice(-2),
  ];
  return suffixes.map(s => base + s).slice(0, 3);
}

// ──────────────────────────────────────────────
//  6) التحقق من الجلسة — يُستخدم لاستعادة الدخول عند فتح الصفحة
// ──────────────────────────────────────────────
async function dbGetUser(username) {
  const token = getSessionToken();
  if (!token) return null;

  const { data, error } = await supabaseClient.rpc("app_session_user", { p_token: token });
  if (error) {
    console.error("Session check error:", error.message);
    return null;
  }
  if (!data) { handleUnauthorized(); return null; }
  if (username && data !== username) { handleUnauthorized(); return null; }

  return { user_id: data };
}

// ──────────────────────────────────────────────
//  7) إنشاء حساب جديد
// ──────────────────────────────────────────────
async function dbSignup(username, password, hint) {
  const { data, error } = await supabaseClient.rpc("app_signup", {
    p_user:   username,
    p_pass:   password,
    p_hint:   hint || "",
    p_origin: APP_ORIGIN,
  });

  if (error) {
    console.error("Supabase signup error:", error.message);
    return { ok: false, error: error.message };
  }

  if (data && data.taken) {
    return {
      ok: false,
      error: t("errUsernameTakenInApp"),
      suggestions: generateUsernameSuggestions(username),
    };
  }
  if (!data || !data.ok) {
    return { ok: false, error: (data && data.error) || "signup_failed" };
  }

  setSessionToken(data.token);
  return { ok: true };
}

// ──────────────────────────────────────────────
//  8) تسجيل الدخول
// ──────────────────────────────────────────────
async function dbLogin(username, password) {
  const { data, error } = await supabaseClient.rpc("app_login", {
    p_user:   username,
    p_pass:   password,
    p_origin: APP_ORIGIN,
  });

  if (error) {
    console.error("Supabase login error:", error.message);
    return { ok: false, exists: true, error: error.message };
  }
  if (!data) return { ok: false, exists: false };

  if (!data.ok) {
    if (!data.exists) return { ok: false, exists: false };
    if (data.locked)  return { ok: false, exists: true, locked: true, hint: "" };
    // التلميح لم يعد يُكشف عند فشل الدخول — يُطلب صراحة من زر "نسيت كلمة المرور"
    return { ok: false, exists: true, hint: "" };
  }

  setSessionToken(data.token);
  return { ok: true };
}

// ──────────────────────────────────────────────
//  9) جلب التلميح (نسيت كلمة المرور)
// ──────────────────────────────────────────────
async function dbGetHint(username) {
  const { data, error } = await supabaseClient.rpc("app_get_hint", { p_user: username });
  if (error) {
    console.error("Supabase get hint error:", error.message);
    return { exists: false, hint: null };
  }
  return { exists: !!(data && data.exists), hint: (data && data.hint) || "" };
}

// ──────────────────────────────────────────────
//  10) إعادة تعيين كلمة المرور بالتلميح
// ──────────────────────────────────────────────
async function dbResetPasswordWithHint(username, hintInput, newPassword) {
  const { data, error } = await supabaseClient.rpc("app_reset_with_hint", {
    p_user:    username,
    p_hint:    hintInput || "",
    p_newpass: newPassword,
  });

  if (error) return { ok: false, error: error.message };
  if (!data || !data.ok) return { ok: false, error: (data && data.error) || "reset_failed" };

  setSessionToken(null);   // كل الجلسات القديمة أُبطلت في الخادم
  return { ok: true };
}

// ──────────────────────────────────────────────
//  11) تغيير كلمة المرور (المستخدم مسجّل دخوله)
// ──────────────────────────────────────────────
async function dbChangePassword(username, oldPassword, newPassword) {
  const { data, error } = await supabaseClient.rpc("app_change_password", {
    p_token: getSessionToken(),
    p_old:   oldPassword,
    p_new:   newPassword,
  });

  if (error) return { ok: false, error: error.message };
  if (!data || !data.ok) {
    if (data && data.error === "unauthorized") handleUnauthorized();
    return { ok: false, error: (data && data.error) || "change_failed" };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────
//  12) تسجيل خروج صريح — يحذف الجلسة من الخادم
// ──────────────────────────────────────────────
async function dbLogout() {
  const token = getSessionToken();
  if (token) {
    try { await supabaseClient.rpc("app_logout", { p_token: token }); } catch (e) {}
  }
  setSessionToken(null);
  currentUsername = null;
}

// ──────────────────────────────────────────────
//  13) Keep-Alive Ping — لم يعد يلمس جدول البيانات
// ──────────────────────────────────────────────
async function dbKeepAlivePing() {
  try {
    const { error } = await supabaseClient.rpc("app_ping");
    if (error) console.warn("Keep-alive ping error:", error.message);
    else console.log("[KeepAlive] Supabase ping OK @", new Date().toISOString());
  } catch (e) {
    console.warn("Keep-alive ping exception:", e);
  }
}
