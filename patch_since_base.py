import re

# ══════════════════════════════════════════════════════════
#  PATCH 1: main.js
# ══════════════════════════════════════════════════════════
path_main = "/sessions/inspiring-optimistic-clarke/mnt/outputs/main.js"
with open(path_main, "r", encoding="utf-8") as f:
    src = f.read()

# ──────────────────────────────────────────────────────────
# 1a. عند الحفظ: تضمين sinceBaseRaw في detailsText + حقل خاص
# ──────────────────────────────────────────────────────────
old_save_details = "    detailsText: resultDetails.innerHTML || \"\","
new_save_details = """\
    detailsText: (resultDetails.innerHTML || "") + (mode === "until" && lastSinceBaseRaw ? `<!--since_base:${lastSinceBaseRaw}-->` : ""),
    sinceBaseRaw: (mode === "until" && lastSinceBaseRaw) ? lastSinceBaseRaw : "","""

assert old_save_details in src, "❌ لم أجد detailsText في saveEntryBtn"
src = src.replace(old_save_details, new_save_details, 1)
print("✅ 1a. تم تضمين sinceBaseRaw في entry عند الحفظ")

# ──────────────────────────────────────────────────────────
# 1b. _totalForEquiv: أولوية sinceBaseRaw على entry.id
# ──────────────────────────────────────────────────────────
old_total = """\
      let _totalForEquiv = abs;
      if (entry.modeAtSave === "until" && targetForCalc > today) {
        const _entryTs = typeof entry.id === "number" ? entry.id : NaN;
        if (!isNaN(_entryTs) && _entryTs > 1577836800000 && _entryTs < 2524608000000) {
          const _saveDay = new Date(_entryTs);
          _saveDay.setHours(0, 0, 0, 0);
          const _tot = diffInDays(_saveDay, targetForCalc);
          if (_tot > 0) _totalForEquiv = _tot;
        }
      }"""

new_total = """\
      let _totalForEquiv = abs;
      if (entry.modeAtSave === "until" && targetForCalc > today) {
        let _gotTotal = false;
        // أولاً: sinceBaseRaw (تاريخ الأساس الأصلي "منذ")
        if (entry.sinceBaseRaw) {
          const _sb = new Date(entry.sinceBaseRaw + "T00:00:00");
          if (!isNaN(_sb.getTime())) {
            const _tot = Math.abs(diffInDays(_sb, targetForCalc));
            if (_tot > 0) { _totalForEquiv = _tot; _gotTotal = true; }
          }
        }
        // ثانياً: fallback إلى تاريخ الحفظ من entry.id
        if (!_gotTotal) {
          const _entryTs = typeof entry.id === "number" ? entry.id : NaN;
          if (!isNaN(_entryTs) && _entryTs > 1577836800000 && _entryTs < 2524608000000) {
            const _saveDay = new Date(_entryTs);
            _saveDay.setHours(0, 0, 0, 0);
            const _tot = diffInDays(_saveDay, targetForCalc);
            if (_tot > 0) _totalForEquiv = _tot;
          }
        }
      }"""

assert old_total in src, "❌ لم أجد _totalForEquiv"
src = src.replace(old_total, new_total, 1)
print("✅ 1b. تم تحديث _totalForEquiv ليفضّل sinceBaseRaw")

# ──────────────────────────────────────────────────────────
# 1c. dynamicSummaryLine: للمدة "حتى" المستقبلية نستخدم sinceBaseRaw
#     كتاريخ البداية الذهبي مع عرض المتبقي/الإجمالي بدقة
# ──────────────────────────────────────────────────────────
old_summary = """\
      const _isFutureTarget = targetForCalc > today;
      if (entry.modeAtSave === "since" || (entry.modeAtSave === "until" && _isFutureTarget)) {
        const _fromDate = entry.modeAtSave === "since" ? targetForCalc : today;
        const _toDate   = entry.modeAtSave === "since" ? today         : targetForCalc;
        const _days     = diffInDays(_fromDate, _toDate);
        const _equivFull = formatEquivDynamic(_days, _totalForEquiv);
        if (_equivFull) {
          const _fromFmt = formatBothCalendars(_fromDate);
          const _toFmt   = formatBothCalendars(_toDate);
          // _equivFull تبدأ بـ "تعادل ... من أصل 9 أشهر" مباشرة
          dynamicSummaryLine = `<span class="details-gold">منذ ${_fromFmt} حتى ${_toFmt}</span> <span class="details-equivalent">${_equivFull}</span>`;
        }
      }"""

new_summary = """\
      const _isFutureTarget = targetForCalc > today;
      if (entry.modeAtSave === "since" || (entry.modeAtSave === "until" && _isFutureTarget)) {
        let _fromDate, _equivRemain, _equivTotal;
        if (entry.modeAtSave === "since") {
          // منذ: من targetDate حتى اليوم — المتبقي = الإجمالي = abs
          _fromDate    = targetForCalc;
          _equivRemain = abs;
          _equivTotal  = abs;
        } else {
          // حتى (مستقبل): نفضّل sinceBaseRaw كنقطة البداية الأصلية
          _equivRemain = abs;  // المتبقي = اليوم → الهدف
          if (entry.sinceBaseRaw) {
            const _sb = new Date(entry.sinceBaseRaw + "T00:00:00");
            if (!isNaN(_sb.getTime())) {
              _fromDate   = _sb;
              _equivTotal = Math.abs(diffInDays(_sb, targetForCalc));
            }
          }
          if (!_fromDate) {
            // fallback: اليوم كنقطة بداية
            _fromDate   = today;
            _equivTotal = _totalForEquiv;
          }
        }
        const _toDate    = entry.modeAtSave === "since" ? today : targetForCalc;
        const _equivFull = formatEquivDynamic(_equivRemain, _equivTotal);
        if (_equivFull) {
          const _fromFmt = formatBothCalendars(_fromDate);
          const _toFmt   = formatBothCalendars(_toDate);
          dynamicSummaryLine = `<span class="details-gold">منذ ${_fromFmt} حتى ${_toFmt}</span> <span class="details-equivalent">${_equivFull}</span>`;
        }
      }"""

assert old_summary in src, "❌ لم أجد كتلة dynamicSummaryLine"
src = src.replace(old_summary, new_summary, 1)
print("✅ 1c. تم تحديث dynamicSummaryLine ليستخدم sinceBaseRaw")

with open(path_main, "w", encoding="utf-8") as f:
    f.write(src)
print("✅ main.js محفوظ")

# ══════════════════════════════════════════════════════════
#  PATCH 2: supabase.js — استخراج sinceBaseRaw عند الجلب
# ══════════════════════════════════════════════════════════
path_supa = "/sessions/inspiring-optimistic-clarke/mnt/outputs/supabase.js"
with open(path_supa, "r", encoding="utf-8") as f:
    ssrc = f.read()

# دالة مساعدة: تحويل صف قاعدة البيانات إلى كائن مدة مع استخراج sinceBaseRaw
# نحتاج إلى تعديل مقطعَي التحويل في dbFetchEntries و dbFetchDeletedEntries

# ── dbFetchEntries ──
old_map_active = """\
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
  }));"""

new_map_active = """\
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
  });"""

assert old_map_active in ssrc, "❌ لم أجد map في dbFetchEntries"
ssrc = ssrc.replace(old_map_active, new_map_active, 1)
print("✅ 2a. dbFetchEntries يستخرج sinceBaseRaw")

# ── dbFetchDeletedEntries ──
old_map_deleted = """\
  return data.map((row) => ({
    id:            Number(row.entry_id) || row.entry_id,
    note:          row.event_name || row.note || "",
    importance:    row.importance || "normal",
    targetDateRaw: row.target_date || row.target_date_raw || "",
    modeAtSave:    row.mode_at_save || "since",
    hidden:        row.hidden || false,
    mainText:      row.main_text || "",
    equivalentText:row.equivalent_text || "",
    detailsText:   row.details_text || "",
    deletedAt:     row.deleted_at,
  }));"""

new_map_deleted = """\
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
  });"""

assert old_map_deleted in ssrc, "❌ لم أجد map في dbFetchDeletedEntries"
ssrc = ssrc.replace(old_map_deleted, new_map_deleted, 1)
print("✅ 2b. dbFetchDeletedEntries يستخرج sinceBaseRaw")

with open(path_supa, "w", encoding="utf-8") as f:
    f.write(ssrc)
print("✅ supabase.js محفوظ")

print("\n🎉 جميع التعديلات اكتملت بنجاح")
