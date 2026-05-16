import re

path = "/sessions/inspiring-optimistic-clarke/mnt/outputs/main.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ─────────────────────────────────────────────────────────────────
# 1. استبدال تعريف formatEquivOf9Months بـ formatEquivDynamic
# ─────────────────────────────────────────────────────────────────
old_func = """\
//  الشهر = 30 يوم تقريباً — النص الأخضر في كل مكان
// ─────────────────────────────────────────────────────
function formatEquivOf9Months(days) {
  const total = Math.abs(days);
  if (total === 0) return "";

  const months      = Math.floor(total / 30);
  const remainDays  = total % 30;

  const parts = [];
  if (months     > 0) parts.push(`${months} ${t("monthUnit")}`);
  if (remainDays > 0) parts.push(`${remainDays} ${t("dayUnit")}`);

  if (!parts.length) return "";

  const joined = parts.join(` ${t("and")} `);
  const isEn   = (typeof getLanguage === "function" && getLanguage() === "en");
  return isEn
    ? `Equivalent to ${joined} out of 9 months`
    : `تعادل ${joined} من أصل 9 أشهر`;
}"""

new_func = """\
//  الشهر = 30 يوم تقريباً — النص الأخضر في كل مكان (ديناميكي)
// ─────────────────────────────────────────────────────
function formatEquivDynamic(remainDays, totalDays) {
  function toMonthsDays(d) {
    const n = Math.abs(Math.round(d));
    if (n === 0) return `0 ${t("dayUnit")}`;
    const months = Math.floor(n / 30);
    const days   = n % 30;
    const parts  = [];
    if (months > 0) parts.push(`${months} ${t("monthUnit")}`);
    if (days   > 0) parts.push(`${days} ${t("dayUnit")}`);
    return parts.join(` ${t("and")} `);
  }
  const rem = Math.abs(remainDays || 0);
  const tot = Math.abs(totalDays  || 0);
  if (rem === 0 && tot === 0) return "";
  const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
  return isEn
    ? `Equivalent to ${toMonthsDays(rem)} out of ${toMonthsDays(tot)}`
    : `تعادل ${toMonthsDays(rem)} من أصل ${toMonthsDays(tot)}`;
}"""

assert old_func in src, "❌ لم أجد تعريف formatEquivOf9Months"
src = src.replace(old_func, new_func, 1)
print("✅ تم استبدال تعريف الدالة")

# ─────────────────────────────────────────────────────────────────
# 2. في renderSavedEntries: إضافة _totalForEquiv وتحديث الاستدعاءات
# ─────────────────────────────────────────────────────────────────

# 2a. إضافة حساب _totalForEquiv قبل if (!dynamicEquivLine)
old_before_equiv = """\
      if (!dynamicEquivLine) {
        dynamicEquivLine = formatEquivOf9Months(days);
      }"""

new_before_equiv = """\
      // ─── إجمالي المدة الديناميكية ───
      // منذ → إجمالي = مدة منقضية = abs (دائماً تساوي المتبقية)
      // حتى (مستقبل) → إجمالي = من تاريخ الحفظ حتى الهدف
      let _totalForEquiv = abs;
      if (entry.modeAtSave === "until" && targetForCalc > today) {
        const _entryTs = typeof entry.id === "number" ? entry.id : NaN;
        if (!isNaN(_entryTs) && _entryTs > 1577836800000 && _entryTs < 2524608000000) {
          const _saveDay = new Date(_entryTs);
          _saveDay.setHours(0, 0, 0, 0);
          const _tot = diffInDays(_saveDay, targetForCalc);
          if (_tot > 0) _totalForEquiv = _tot;
        }
      }

      if (!dynamicEquivLine) {
        dynamicEquivLine = formatEquivDynamic(abs, _totalForEquiv);
      }"""

assert old_before_equiv in src, "❌ لم أجد if (!dynamicEquivLine) في renderSavedEntries"
src = src.replace(old_before_equiv, new_before_equiv, 1)
print("✅ تم إضافة _totalForEquiv وتحديث dynamicEquivLine")

# 2b. تحديث formatEquivOf9Months(_days) في dynamicSummaryLine
old_summary_equiv = "        const _equivFull = formatEquivOf9Months(_days);"
new_summary_equiv = "        const _equivFull = formatEquivDynamic(_days, _totalForEquiv);"
assert old_summary_equiv in src, "❌ لم أجد formatEquivOf9Months(_days) في dynamicSummaryLine"
src = src.replace(old_summary_equiv, new_summary_equiv, 1)
print("✅ تم تحديث dynamicSummaryLine")

# ─────────────────────────────────────────────────────────────────
# 3. في calculate(): السطر الثاني للنتيجة (since / until بسيط)
# ─────────────────────────────────────────────────────────────────
old_calc_simple = "    resultEquivalent.textContent = formatEquivOf9Months(days);"
new_calc_simple = "    resultEquivalent.textContent = formatEquivDynamic(abs, abs);"
assert old_calc_simple in src, "❌ لم أجد resultEquivalent في calculate()"
src = src.replace(old_calc_simple, new_calc_simple, 1)
print("✅ تم تحديث resultEquivalent في calculate()")

# ─────────────────────────────────────────────────────────────────
# 4. في calculate(): سطر "بين التاريخين" (between-dates)
# ─────────────────────────────────────────────────────────────────
old_between = """\
          const eqBetween = formatEquivOf9Months(betweenDays);

          const fromText = formatGregorian(base) + " م";
          const toText = formatGregorian(untilDate) + " م";

          // eqBetween تبدأ بـ "تعادل ... من أصل 9 أشهر" مباشرة
          const eqText = eqBetween || `تعادل ${absBetween} يوم من أصل 9 أشهر`;"""

new_between = """\
          const eqBetween = formatEquivDynamic(absBetween, absBetween);

          const fromText = formatGregorian(base) + " م";
          const toText = formatGregorian(untilDate) + " م";

          // eqBetween تبدأ بـ "تعادل X من أصل Y" مباشرة
          const eqText = eqBetween || `تعادل ${absBetween} ${t("dayUnit")}`;"""

assert old_between in src, "❌ لم أجد eqBetween في calculate() between"
src = src.replace(old_between, new_between, 1)
print("✅ تم تحديث eqBetween في calculate()")

# ─────────────────────────────────────────────────────────────────
# 5. في saveEntryBtn: sinceUntilSummary
# ─────────────────────────────────────────────────────────────────
old_save = """\
      const eqBetween = formatEquivOf9Months(daysBetween);

      const fromText = formatGregorian(base) + " م";
      const toText = formatGregorian(target) + " م";
      // eqBetween تبدأ بـ "تعادل ... من أصل 9 أشهر"
      const eqText = eqBetween || `تعادل ${absBetween} يوم من أصل 9 أشهر`;"""

new_save = """\
      const eqBetween = formatEquivDynamic(absBetween, absBetween);

      const fromText = formatGregorian(base) + " م";
      const toText = formatGregorian(target) + " م";
      // eqBetween تبدأ بـ "تعادل X من أصل Y" مباشرة
      const eqText = eqBetween || `تعادل ${absBetween} ${t("dayUnit")}`;"""

assert old_save in src, "❌ لم أجد eqBetween في saveEntryBtn"
src = src.replace(old_save, new_save, 1)
print("✅ تم تحديث sinceUntilSummary في saveEntryBtn")

# ─────────────────────────────────────────────────────────────────
# تحقق: يجب ألا يبقى أي استدعاء قديم
# ─────────────────────────────────────────────────────────────────
remaining = src.count("formatEquivOf9Months")
if remaining > 0:
    import re
    for m in re.finditer(r"formatEquivOf9Months", src):
        line_no = src[:m.start()].count("\n") + 1
        print(f"⚠️  لا يزال موجوداً في السطر {line_no}")
else:
    print("✅ لا يوجد أي استدعاء قديم متبقٍ")

# ─────────────────────────────────────────────────────────────────
# حفظ الملف
# ─────────────────────────────────────────────────────────────────
with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("✅ تم حفظ main.js بنجاح")
