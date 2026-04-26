const SUPABASE_URL = "https://tvbuvwjkojhqcxhyehfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnV2d2prb2pocWN4aHllaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDE4MTUsImV4cCI6MjA5MjI3NzgxNX0.egwryYwKu_Bicl_koaYXaKGBoxz42c6k4VkMD9aZSWQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// معرّف تطبيق المصدر — يُرسَل مع كل مستخدم جديد لتمييز مصدره
const APP_ORIGIN = "days_counter";

// توليد اقتراحات أسماء بديلة قريبة
function generateUsernameSuggestions(base) {
  const year = String(new Date().getFullYear());
  const suffixes = [
    String(Math.floor(Math.random() * 900) + 100),
    year,
    "_" + year.slice(-2),
  ];
  return suffixes.map(s => base + s).slice(0, 3);
}

// ============ Keep-Alive Ping ============
// استعلام بسيط يُنفَّذ عند فتح الصفحة لإبقاء مشروع Supabase نشطاً
// (مفيد عند استخدام خدمة cron-job يومية لزيارة الصفحة)
async function dbKeepAlivePing() {
  try {
    const { error } = await supabaseClient
      .from("days_counter")
      .select("entry_id", { head: true, count: "exact" })
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

// ============ نظام المستخدمين ============

// المستخدم الحالي (يُضبط من main.js بعد تسجيل الدخول)
let currentUsername = null;

function setCurrentUsername(username) {
  currentUsername = username;
}

function getCurrentUsername() {
  return currentUsername;
}

// تجزئة كلمة المرور SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// جلب مستخدم من القاعدة (مع التحقق من app_origin)
async function dbGetUser(username, checkAppOrigin = false) {
  let query = supabaseClient
    .from("users")
    .select("*")
    .eq("username", username);

  if (checkAppOrigin) {
    query = query.eq("app_origin", APP_ORIGIN);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Supabase get user error:", error.message);
    return null;
  }
  return data;
}

// إنشاء مستخدم جديد
async function dbSignup(username, password, hint) {
  // التحقق من وجود الاسم في نفس التطبيق
  const existing = await dbGetUser(username, true);
  if (existing) {
    const suggestions = generateUsernameSuggestions(username);
    return { 
      ok: false, 
      error: t("errUsernameTakenInApp"),
      suggestions 
    };
  }

  const passwordHash = await hashPassword(password);
  const { error } = await supabaseClient
    .from("users")
    .insert([{
      username,
      password_hash: passwordHash,
      hint: hint || "",
      app_origin: APP_ORIGIN,
    }]);

  if (error) {
    console.error("Supabase signup error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// جلب التلميح فقط (لشاشة نسيت كلمة المرور)
async function dbGetHint(username) {
  const user = await dbGetUser(username, true);
  if (!user) return { exists: false, hint: null };
  return { exists: true, hint: user.hint || "" };
}

// إعادة تعيين كلمة المرور بالتحقق من التلميح
async function dbResetPasswordWithHint(username, hintInput, newPassword) {
  const user = await dbGetUser(username, true);
  if (!user) return { ok: false, error: "user_not_found" };
  const storedHint = (user.hint || "").trim().toLowerCase();
  const enteredHint = (hintInput || "").trim().toLowerCase();
  if (!storedHint || storedHint !== enteredHint) {
    return { ok: false, error: "hint_mismatch" };
  }
  const newHash = await hashPassword(newPassword);
  const { error } = await supabaseClient
    .from("users")
    .update({ password_hash: newHash })
    .eq("username", username)
    .eq("app_origin", APP_ORIGIN);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// تغيير كلمة المرور (المستخدم مسجّل دخوله)
async function dbChangePassword(username, oldPassword, newPassword) {
  const user = await dbGetUser(username, true);
  if (!user) return { ok: false, error: "user_not_found" };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.password_hash) return { ok: false, error: "wrong_old_password" };
  const newHash = await hashPassword(newPassword);
  const { error } = await supabaseClient
    .from("users")
    .update({ password_hash: newHash })
    .eq("username", username)
    .eq("app_origin", APP_ORIGIN);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// تسجيل الدخول: يرجع { ok, exists, hint }
async function dbLogin(username, password) {
  const user = await dbGetUser(username);
  if (!user) {
    return { ok: false, exists: false };
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.password_hash) {
    return { ok: false, exists: true, hint: user.hint || "" };
  }

  return { ok: true };
}

async function dbSaveEntry(entry) {
  if (!currentUsername) return;

  // تحديد sort_order: نجلب أكبر قيمة حالية للمستخدم ثم نضيف 1 ليكون الجديد في الآخر
  let nextOrder = 0;
  if (typeof entry.sortOrder === "number") {
    nextOrder = entry.sortOrder;
  } else {
    const { data: maxRow } = await supabaseClient
      .from("days_counter")
      .select("sort_order")
      .eq("user_name", currentUsername)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false, nullsFirst: false })
      .limit(1);
    const currentMax = (maxRow && maxRow[0] && typeof maxRow[0].sort_order === "number")
      ? maxRow[0].sort_order : -1;
    nextOrder = currentMax + 1;
    entry.sortOrder = nextOrder;
  }

  const { error } = await supabaseClient
    .from("days_counter")
    .insert([{
      entry_id:        String(entry.id),
      user_name:       currentUsername,
      event_name:      entry.note || "",
      target_date:     entry.targetDateRaw || null,
      note:            entry.note || "",
      importance:      entry.importance || "normal",
      target_date_raw: entry.targetDateRaw || "",
      mode_at_save:    entry.modeAtSave || "since",
      hidden:          entry.hidden || false,
      main_text:       entry.mainText || "",
      equivalent_text: entry.equivalentText || "",
      details_text:    entry.detailsText || "",
      sort_order:      nextOrder,
    }]);

  if (error) {
    console.error("Supabase insert error:", error.message);
  }
}

async function dbDeleteEntry(entryId) {
  if (!currentUsername) return;
  // حذف مؤجّل (Soft Delete): نضع طابع زمني للحذف، والحذف الفعلي يحدث بعد 30 يوماً
  const { error } = await supabaseClient
    .from("days_counter")
    .update({ deleted_at: new Date().toISOString() })
    .eq("entry_id", String(entryId))
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase soft-delete error:", error.message);
  }
}

async function dbRestoreEntry(entryId) {
  if (!currentUsername) return;
  const { error } = await supabaseClient
    .from("days_counter")
    .update({ deleted_at: null })
    .eq("entry_id", String(entryId))
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase restore error:", error.message);
  }
}

async function dbPurgeOldDeleted() {
  if (!currentUsername) return;
  // الحذف الفعلي النهائي لكل ما مضى على حذفه أكثر من 30 يوماً (للمستخدم الحالي)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseClient
    .from("days_counter")
    .delete()
    .lt("deleted_at", cutoff)
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase purge error:", error.message);
  }
}

async function dbPermanentDeleteAll() {
  if (!currentUsername) return;
  // حذف نهائي فوري لجميع العناصر في سلة المحذوفات (بصرف النظر عن العمر)
  const { error } = await supabaseClient
    .from("days_counter")
    .delete()
    .not("deleted_at", "is", null)
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase permanent delete all error:", error.message);
  }
}

async function dbPermanentDeleteSelected(entryIds) {
  if (!currentUsername || !entryIds || entryIds.length === 0) return;
  const { error } = await supabaseClient
    .from("days_counter")
    .delete()
    .in("entry_id", entryIds.map(String))
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase permanent delete selected error:", error.message);
  }
}

async function dbUpdateEntry(entry) {
  if (!currentUsername) return;
  const { error } = await supabaseClient
    .from("days_counter")
    .update({
      event_name:      entry.note || "",
      target_date:     entry.targetDateRaw || null,
      note:            entry.note || "",
      importance:      entry.importance || "normal",
      target_date_raw: entry.targetDateRaw || "",
      mode_at_save:    entry.modeAtSave || "since",
      hidden:          entry.hidden || false,
      main_text:       entry.mainText || "",
      equivalent_text: entry.equivalentText || "",
      details_text:    entry.detailsText || "",
    })
    .eq("entry_id", String(entry.id))
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase update error:", error.message);
  }
}

async function dbFetchDeletedEntries() {
  if (!currentUsername) return [];
  // جلب سجلات المستخدم في سلة المحذوفات
  const { data, error } = await supabaseClient
    .from("days_counter")
    .select("*")
    .eq("user_name", currentUsername)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch deleted error:", error.message);
    return [];
  }

  return data.map((row) => ({
    id:              Number(row.entry_id) || row.entry_id,
    note:            row.event_name || row.note || "",
    importance:      row.importance || "normal",
    targetDateRaw:   row.target_date || row.target_date_raw || "",
    modeAtSave:      row.mode_at_save || "since",
    hidden:          row.hidden || false,
    mainText:        row.main_text || "",
    equivalentText:  row.equivalent_text || "",
    detailsText:     row.details_text || "",
    deletedAt:       row.deleted_at,
  }));
}

async function dbFetchEntries() {
  if (!currentUsername) return null;
  // تنظيف المحذوفات التي مضى عليها أكثر من 30 يوماً (حذف فعلي)
  await dbPurgeOldDeleted();

  // جلب سجلات المستخدم الحالي غير المحذوفة
  const { data, error } = await supabaseClient
    .from("days_counter")
    .select("*")
    .eq("user_name", currentUsername)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return null;
  }

  return data.map((row) => ({
    id:              Number(row.entry_id) || row.entry_id,
    note:            row.event_name || row.note || "",
    importance:      row.importance || "normal",
    targetDateRaw:   row.target_date || row.target_date_raw || "",
    modeAtSave:      row.mode_at_save || "since",
    hidden:          row.hidden || false,
    mainText:        row.main_text || "",
    equivalentText:  row.equivalent_text || "",
    detailsText:     row.details_text || "",
    sortOrder:       (typeof row.sort_order === "number") ? row.sort_order : null,
    remainingDays:   null,
    remainingIsFuture: false,
    targetDate:      "",
  }));
}

async function dbUpdateOrder(entries) {
  if (!currentUsername) return;
  // تحديث كل العناصر بالتوازي لسرعة أكبر
  const updates = entries.map((entry, i) => {
    entry.sortOrder = i;
    return supabaseClient
      .from("days_counter")
      .update({ sort_order: i })
      .eq("entry_id", String(entries[i].id))
      .eq("user_name", currentUsername);
  });
  const results = await Promise.all(updates);
  results.forEach((res, i) => {
    if (res.error) {
      console.error(`Supabase sort_order update error for entry ${entries[i].id}:`, res.error.message);
    }
  });
}
