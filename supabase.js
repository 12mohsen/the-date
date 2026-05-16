// ============================================================
//  supabase.js — عمليات قاعدة البيانات الخاصة بتطبيق days_counter
// ============================================================
//
//  ★ المصادقة (auth) موجودة في auth-shared.js فقط — لا تكرار هنا
//  ★ هذا الملف يُحمَّل بعد auth-shared.js لذا يعتمد على:
//       supabaseClient  → من auth-shared.js
//       currentUsername → من auth-shared.js
//
// ──────────────────────────────────────────────────────────
//  SQL لإنشاء جدول days_counter في Supabase (للمرجعية):
//
//  CREATE TABLE days_counter (
//    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
//    entry_id         TEXT        NOT NULL,
//    user_name        TEXT        NOT NULL,
//    event_name       TEXT,
//    target_date      DATE,
//    note             TEXT,
//    importance       TEXT        DEFAULT 'normal',
//    target_date_raw  TEXT,
//    mode_at_save     TEXT        DEFAULT 'since',
//    hidden           BOOLEAN     DEFAULT false,
//    main_text        TEXT,
//    equivalent_text  TEXT,
//    details_text     TEXT,
//    sort_order       INTEGER,
//    deleted_at       TIMESTAMPTZ,
//    created_at       TIMESTAMPTZ DEFAULT NOW()
//  );
//
//  ملاحظة: عمود id من نوع uuid مع gen_random_uuid() يضمن
//  سهولة الحذف من لوحة تحكم Supabase (القاعدة رقم 6).
// ============================================================

// ──────────────────────────────────────────────
//  حفظ مدة جديدة في الجدول
// ──────────────────────────────────────────────
async function dbSaveEntry(entry) {
  if (!currentUsername) return;

  // تحديد sort_order: نجلب أكبر قيمة حالية ثم نضيف 1
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

// ──────────────────────────────────────────────
//  حذف مؤجّل (Soft Delete) — تُحفظ في سلة المحذوفات
// ──────────────────────────────────────────────
async function dbDeleteEntry(entryId) {
  if (!currentUsername) return;
  const { error } = await supabaseClient
    .from("days_counter")
    .update({ deleted_at: new Date().toISOString() })
    .eq("entry_id", String(entryId))
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase soft-delete error:", error.message);
  }
}

// ──────────────────────────────────────────────
//  استعادة مدة من سلة المحذوفات
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
//  حذف نهائي للمدد التي مضى على حذفها أكثر من 30 يوماً
// ──────────────────────────────────────────────
async function dbPurgeOldDeleted() {
  if (!currentUsername) return;
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

// ──────────────────────────────────────────────
//  حذف نهائي فوري لجميع العناصر في سلة المحذوفات
// ──────────────────────────────────────────────
async function dbPermanentDeleteAll() {
  if (!currentUsername) return;
  const { error } = await supabaseClient
    .from("days_counter")
    .delete()
    .not("deleted_at", "is", null)
    .eq("user_name", currentUsername);

  if (error) {
    console.error("Supabase permanent delete all error:", error.message);
  }
}

// ──────────────────────────────────────────────
//  حذف نهائي لعناصر محددة (بالـ IDs)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
//  تحديث بيانات مدة محفوظة
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
//  جلب المدد في سلة المحذوفات
// ──────────────────────────────────────────────
async function dbFetchDeletedEntries() {
  if (!currentUsername) return [];
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

  return data.map((row) => {
    const _rawDet   = row.details_text || "";
    const _sbMatch  = _rawDet.match(/<!--since_base:([0-9-]+)-->/);
    const _sinceBase = _sbMatch ? _sbMatch[1] : "";
    const _cleanDet = _rawDet.replace(/<!--since_base:[0-9-]+-->/, "").trim();
    return {
      id:            Number(row.entry_id) || row.entry_id,
      note:          row.event_name || row.note || "",
      importance:    row.importance || "normal",
      targetDateRaw: row.target_date || row.target_date_raw || "",
      modeAtSave:    row.mode_at_save || "since",
      hidden:        row.hidden || false,
      mainText:      row.main_text || "",
      equivalentText:row.equivalent_text || "",
      detailsText:   _cleanDet,
      sinceBaseRaw:  _sinceBase,
      deletedAt:     row.deleted_at,
    };
  });
}

// ──────────────────────────────────────────────
//  جلب المدد النشطة للمستخدم الحالي
// ──────────────────────────────────────────────
async function dbFetchEntries() {
  if (!currentUsername) return null;

  // تنظيف المحذوفات القديمة (أكثر من 30 يوماً) أولاً
  await dbPurgeOldDeleted();

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

  return data.map((row) => {
    const _rawDet   = row.details_text || "";
    const _sbMatch  = _rawDet.match(/<!--since_base:([0-9-]+)-->/);
    const _sinceBase = _sbMatch ? _sbMatch[1] : "";
    const _cleanDet = _rawDet.replace(/<!--since_base:[0-9-]+-->/, "").trim();
    return {
      id:              Number(row.entry_id) || row.entry_id,
      note:            row.event_name || row.note || "",
      importance:      row.importance || "normal",
      targetDateRaw:   row.target_date || row.target_date_raw || "",
      modeAtSave:      row.mode_at_save || "since",
      hidden:          row.hidden || false,
      mainText:        row.main_text || "",
      equivalentText:  row.equivalent_text || "",
      detailsText:     _cleanDet,
      sinceBaseRaw:    _sinceBase,
      sortOrder:       (typeof row.sort_order === "number") ? row.sort_order : null,
      remainingDays:   null,
      remainingIsFuture: false,
      targetDate:      "",
    };
  });
}

// ──────────────────────────────────────────────
//  تحديث ترتيب المدد بعد السحب والإفلات
// ──────────────────────────────────────────────
async function dbUpdateOrder(entries) {
  if (!currentUsername) return;
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
