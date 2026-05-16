// ============================================================
//  auth-shared.js — نظام المصادقة الموحد لجميع التطبيقات
// ============================================================
//  الأعمدة المعتمدة في جدول users:
//    user_id      (text)  — اسم المستخدم (Primary Key)
//    pass_hash    (text)  — كلمة المرور مشفرة SHA-256
//    hint         (text)  — تلميح لكلمة المرور
//    created_from (text)  — مصدر التسجيل (days_counter / expenses / perfumes)
//    created_at   (timestamptz)
//
//  ★ تسجيل الدخول عام: يبحث بـ user_id + pass_hash فقط
//  ★ إنشاء الحساب: يمنع تكرار user_id عالمياً ويحفظ مصدر التطبيق
//  ★ البيانات: كل تطبيق يفلتر جدوله الخاص بـ user_name/user_id
// ============================================================

// ──────────────────────────────────────────────
//  1) هوية التطبيق (الثابت) — غيّر هذا السطر فقط لكل تطبيق
//     ★★★ days_counter / expenses / perfumes ★★★
// ──────────────────────────────────────────────
const APP_ORIGIN = "days_counter";

// ──────────────────────────────────────────────
//  2) الاتصال بـ Supabase (مشترك لكل التطبيقات)
// ──────────────────────────────────────────────
const SUPABASE_URL      = "https://tvbuvwjkojhqcxhyehfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnV2d2prb2pocWN4aHllaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDE4MTUsImV4cCI6MjA5MjI3NzgxNX0.egwryYwKu_Bicl_koaYXaKGBoxz42c6k4VkMD9aZSWQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ──────────────────────────────────────────────
//  3) المستخدم الحالي
// ──────────────────────────────────────────────
let currentUsername = null;

function setCurrentUsername(username) { currentUsername = username; }
function getCurrentUsername()         { return currentUsername; }

// ──────────────────────────────────────────────
//  4) تشفير كلمة المرور SHA-256
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
//  6) جلب مستخدم من القاعدة (بدون فلتر created_from)
// ──────────────────────────────────────────────
async function dbGetUser(username) {
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("user_id", username)
    .maybeSingle();

  if (error) {
    console.error("Supabase get user error:", error.message);
    return null;
  }
  return data;
}

// ──────────────────────────────────────────────
//  7) إنشاء حساب جديد (Sign Up)
//     - يمنع تكرار user_id عالمياً عبر كل التطبيقات
//     - يحفظ created_from = APP_ORIGIN تلقائياً
//     - رسالة الرفض: "هذا الاسم محجوز في نظام تطبيقات أبو محسن الموحد"
// ──────────────────────────────────────────────
async function dbSignup(username, password, hint) {
  // التحقق من التكرار عالمياً (بدون فلتر created_from)
  const { data: existingRows } = await supabaseClient
    .from("users")
    .select("user_id")
    .eq("user_id", username)
    .limit(1);

  if (existingRows && existingRows.length) {
    const suggestions = generateUsernameSuggestions(username);
    return {
      ok: false,
      error: t("errUsernameTakenInApp"),
      suggestions
    };
  }

  // إنشاء الحساب مع تسجيل مصدر التطبيق تلقائياً
  const passHash = await hashPassword(password);
  const { error } = await supabaseClient
    .from("users")
    .insert([{
      user_id:      username,
      pass_hash:    passHash,
      hint:         hint || "",
      created_from: APP_ORIGIN,   // ← يُرسل تلقائياً عند كل تسجيل
    }]);

  if (error) {
    console.error("Supabase signup error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────
//  8) تسجيل الدخول (Login) — عام بدون فلتر created_from
//     يتيح لأي مستخدم سجّل في تطبيق آخر الدخول هنا بنفس بياناته
// ──────────────────────────────────────────────
async function dbLogin(username, password) {
  const user = await dbGetUser(username);
  if (!user) {
    return { ok: false, exists: false };
  }

  const passHash = await hashPassword(password);
  if (passHash !== user.pass_hash) {
    return { ok: false, exists: true, hint: user.hint || "" };
  }

  return { ok: true };
}

// ──────────────────────────────────────────────
//  9) جلب التلميح (نسيت كلمة المرور)
// ──────────────────────────────────────────────
async function dbGetHint(username) {
  const user = await dbGetUser(username);
  if (!user) return { exists: false, hint: null };
  return { exists: true, hint: user.hint || "" };
}

// ──────────────────────────────────────────────
//  10) إعادة تعيين كلمة المرور بالتلميح
// ──────────────────────────────────────────────
async function dbResetPasswordWithHint(username, hintInput, newPassword) {
  const user = await dbGetUser(username);
  if (!user) return { ok: false, error: "user_not_found" };

  const storedHint  = (user.hint || "").trim().toLowerCase();
  const enteredHint = (hintInput || "").trim().toLowerCase();
  if (!storedHint || storedHint !== enteredHint) {
    return { ok: false, error: "hint_mismatch" };
  }

  const newHash = await hashPassword(newPassword);
  const { error } = await supabaseClient
    .from("users")
    .update({ pass_hash: newHash })
    .eq("user_id", username);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ──────────────────────────────────────────────
//  11) تغيير كلمة المرور (المستخدم مسجل دخوله)
// ──────────────────────────────────────────────
async function dbChangePassword(username, oldPassword, newPassword) {
  const user = await dbGetUser(username);
  if (!user) return { ok: false, error: "user_not_found" };

  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.pass_hash) return { ok: false, error: "wrong_old_password" };

  const newHash = await hashPassword(newPassword);
  const { error } = await supabaseClient
    .from("users")
    .update({ pass_hash: newHash })
    .eq("user_id", username);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ──────────────────────────────────────────────
//  12) Keep-Alive Ping — يُبقي مشروع Supabase نشطاً
//      (يُستدعى عند فتح الصفحة أو من cron-job يومي)
// ──────────────────────────────────────────────
async function dbKeepAlivePing() {
  try {
    const { error } = await supabaseClient
      .from("days_counter")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) {
      console.warn("Keep-alive ping error:", error.message);
    } else {
      console.log("[KeepAlive] Supabase ping OK @", new Date().toISOString());
    }
  } catch (e) {
    console.warn("Keep-alive ping exception:", e);
  }
}
