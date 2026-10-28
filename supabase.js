// ============================================================
//  supabase.js — عمليات قاعدة البيانات الخاصة بتطبيق days_counter
// ============================================================
//
//  ★ الإصدار المحمي: لا وصول مباشر إلى جدول days_counter
//    كل عملية تمرّ عبر دالة security definer تستخرج صاحب البيانات
//    من توكن الجلسة ولا تثق بأي اسم مستخدم يرسله المتصفح.
//
//  ★ يعتمد على auth-shared.js:
//       supabaseClient     → العميل
//       getSessionToken()  → توكن الجلسة
//       handleUnauthorized / isUnauthorized
//
//  ★ واجهة الدوال لم تتغيّر — main.js يعمل كما هو.
// ============================================================

// ──────────────────────────────────────────────
//  أداة موحّدة لاستدعاء الدوال ومعالجة انتهاء الجلسة
// ──────────────────────────────────────────────
async function dcCall(fnName, args, label) {
  const token = getSessionToken();
  if (!token) return { data: null, error: { message: "unauthorized" } };

  const { data, error } = await supabaseClient.rpc(fnName, Object.assign({ p_token: token }, args || {}));

  if (error) {
    console.error(`Supabase ${label || fnName} error:`, error.message);
    if (isUnauthorized(error)) handleUnauthorized();
  }
  return { data, error };
}

// ──────────────────────────────────────────────
//  تحويل صف من القاعدة إلى كائن التطبيق
// ──────────────────────────────────────────────
function dcMapRow(row, includeOrder) {
  const _rawDet    = row.details_text || "";
  const _sbMatch   = _rawDet.match(/<!--since_base:([0-9-]+)-->/);
  const _sinceBase = _sbMatch ? _sbMatch[1] : "";
  const _yearly    = /<!--yearly:1-->/.test(_rawDet);
  const _cleanDet  = _rawDet
    .replace(/<!--since_base:[0-9-]+-->/, "")
    .replace(/<!--yearly:1-->/, "")
    .trim();

  const out = {
    id:             Number(row.entry_id) || row.entry_id,
    note:           row.event_name || row.note || "",
    importance:     row.importance || "normal",
    targetDateRaw:  row.target_date || row.target_date_raw || "",
    modeAtSave:     row.mode_at_save || "since",
    hidden:         row.hidden || false,
    mainText:       row.main_text || "",
    equivalentText: row.equivalent_text || "",
    detailsText:    _cleanDet,
    sinceBaseRaw:   _sinceBase,
    yearly:         _yearly,
  };

  if (includeOrder) {
    out.sortOrder         = (typeof row.sort_order === "number") ? row.sort_order : null;
    out.remainingDays     = null;
    out.remainingIsFuture = false;
    out.targetDate        = "";
  } else {
    out.deletedAt = row.deleted_at;
  }
  return out;
}

// ──────────────────────────────────────────────
//  حفظ مدة جديدة
// ──────────────────────────────────────────────
async function dbSaveEntry(entry) {
  const payload = {
    entry_id:        String(entry.id),
    event_name:      entry.note || "",
    target_date:     entry.targetDateRaw || "",
    note:            entry.note || "",
    importance:      entry.importance || "normal",
    target_date_raw: entry.targetDateRaw || "",
    mode_at_save:    entry.modeAtSave || "since",
    hidden:          entry.hidden || false,
    main_text:       entry.mainText || "",
    equivalent_text: entry.equivalentText || "",
    details_text:    entry.detailsText || "",
  };
  if (typeof entry.sortOrder === "number") payload.sort_order = entry.sortOrder;

  const { data } = await dcCall("dc_save", { p_entry: payload }, "insert");
  if (data && typeof data.sort_order === "number") entry.sortOrder = data.sort_order;
}

// ──────────────────────────────────────────────
//  حذف مؤجّل (Soft Delete)
// ──────────────────────────────────────────────
async function dbDeleteEntry(entryId) {
  await dcCall("dc_soft_delete", { p_entry_id: String(entryId) }, "soft-delete");
}

// ──────────────────────────────────────────────
//  استعادة مدة من سلة المحذوفات
// ──────────────────────────────────────────────
async function dbRestoreEntry(entryId) {
  await dcCall("dc_restore", { p_entry_id: String(entryId) }, "restore");
}

// ──────────────────────────────────────────────
//  حذف نهائي للمدد التي مضى على حذفها أكثر من 30 يوماً
//  (صار يتم داخل dc_fetch تلقائياً — مُبقاة للتوافق)
// ──────────────────────────────────────────────
async function dbPurgeOldDeleted() { /* يُنفَّذ داخل dc_fetch */ }

// ──────────────────────────────────────────────
//  حذف نهائي فوري لجميع العناصر في سلة المحذوفات
// ──────────────────────────────────────────────
async function dbPermanentDeleteAll() {
  await dcCall("dc_permanent_delete_all", {}, "permanent delete all");
}

// ──────────────────────────────────────────────
//  حذف نهائي لعناصر محددة
// ──────────────────────────────────────────────
async function dbPermanentDeleteSelected(entryIds) {
  if (!entryIds || entryIds.length === 0) return;
  await dcCall("dc_permanent_delete_selected", { p_ids: entryIds.map(String) }, "permanent delete selected");
}

// ──────────────────────────────────────────────
//  تحديث بيانات مدة محفوظة
// ──────────────────────────────────────────────
async function dbUpdateEntry(entry) {
  await dcCall("dc_update", {
    p_entry: {
      entry_id:        String(entry.id),
      event_name:      entry.note || "",
      target_date:     entry.targetDateRaw || "",
      note:            entry.note || "",
      importance:      entry.importance || "normal",
      target_date_raw: entry.targetDateRaw || "",
      mode_at_save:    entry.modeAtSave || "since",
      hidden:          entry.hidden || false,
      main_text:       entry.mainText || "",
      equivalent_text: entry.equivalentText || "",
      details_text:    entry.detailsText || "",
    }
  }, "update");
}

// ──────────────────────────────────────────────
//  جلب المدد في سلة المحذوفات
// ──────────────────────────────────────────────
async function dbFetchDeletedEntries() {
  const { data, error } = await dcCall("dc_fetch_deleted", {}, "fetch deleted");
  if (error || !data) return [];
  return data.map((row) => dcMapRow(row, false));
}

// ──────────────────────────────────────────────
//  جلب المدد النشطة للمستخدم الحالي
// ──────────────────────────────────────────────
async function dbFetchEntries() {
  const { data, error } = await dcCall("dc_fetch", {}, "fetch");
  if (error || !data) return null;
  return data.map((row) => dcMapRow(row, true));
}

// ──────────────────────────────────────────────
//  تحديث ترتيب المدد بعد السحب والإفلات
//  ★ استدعاء واحد بدل استدعاء لكل عنصر
// ──────────────────────────────────────────────
async function dbUpdateOrder(entries) {
  if (!entries || entries.length === 0) return;
  entries.forEach((entry, i) => { entry.sortOrder = i; });
  await dcCall("dc_update_order", { p_ids: entries.map(e => String(e.id)) }, "sort_order update");
}
