path = "/sessions/inspiring-optimistic-clarke/mnt/outputs/main.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ══════════════════════════════════════════════════════════
# 1. استبدال تعريف formatEquivDynamic بنسخة ترجع HTML
#    • الجزء الأخضر: "تعادل [متبقي]"
#    • الجزء الذهبي: "من أصل [سنتين / سنة / شهور]"
# ══════════════════════════════════════════════════════════
old_func = """\
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

new_func = """\
//  الشهر = 30 يوم تقريباً — يرجع HTML: أخضر للمتبقي، ذهبي للإجمالي
// ─────────────────────────────────────────────────────
function formatEquivDynamic(remainDays, totalDays) {
  // تنسيق المتبقي: شهور وأيام
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
  // تنسيق الإجمالي: سنوات إن كانت كاملة، وإلا شهور وأيام
  function toTotalLabel(d) {
    const n = Math.abs(Math.round(d));
    if (n === 0) return `0 ${t("dayUnit")}`;
    const months  = Math.floor(n / 30);
    const remDays = n % 30;
    const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
    // تحويل للسنوات عند الشهور الكاملة القابلة للقسمة على 12
    if (remDays === 0 && months >= 12 && months % 12 === 0) {
      const years = months / 12;
      if (isEn) return years === 1 ? "1 year" : `${years} years`;
      if (years === 1)  return "سنة";
      if (years === 2)  return "سنتين";
      if (years <= 10)  return `${years} سنوات`;
      return `${years} سنة`;
    }
    return toMonthsDays(n);
  }
  const rem = Math.abs(remainDays || 0);
  const tot = Math.abs(totalDays  || 0);
  if (rem === 0 && tot === 0) return "";
  const isEn = (typeof getLanguage === "function" && getLanguage() === "en");
  const equivWord = isEn ? "Equivalent to" : "تعادل";
  const ofWord    = isEn ? "out of"        : "من أصل";
  return `<span class="details-equivalent">${equivWord} ${toMonthsDays(rem)}</span> <span class="details-gold">${ofWord} ${toTotalLabel(tot)}</span>`;
}"""

assert old_func in src, "❌ لم أجد تعريف formatEquivDynamic"
src = src.replace(old_func, new_func, 1)
print("✅ 1. تم تحديث formatEquivDynamic لإرجاع HTML ذهبي-أخضر")

# ══════════════════════════════════════════════════════════
# 2. resultEquivalent.textContent → innerHTML (عند الكتابة)
# ══════════════════════════════════════════════════════════
src = src.replace(
    "    resultEquivalent.textContent = formatEquivDynamic(abs, abs);",
    "    resultEquivalent.innerHTML = formatEquivDynamic(abs, abs);",
    1
)
print("✅ 2. resultEquivalent.textContent → innerHTML في calculate()")

# ══════════════════════════════════════════════════════════
# 3. قراءة resultEquivalent عند الحفظ → innerHTML
# ══════════════════════════════════════════════════════════
src = src.replace(
    '    equivalentText: resultEquivalent.textContent || "",',
    '    equivalentText: resultEquivalent.innerHTML || "",',
    1
)
src = src.replace(
    "    remainingText: daysHtml || resultEquivalent.textContent,",
    "    remainingText: daysHtml || resultEquivalent.innerHTML,",
    1
)
# saveState أيضاً
src = src.replace(
    "    resultEquivalent: resultEquivalent.textContent,",
    "    resultEquivalent: resultEquivalent.innerHTML,",
    1
)
print("✅ 3. قراءات resultEquivalent.textContent → innerHTML")

# ══════════════════════════════════════════════════════════
# 4. في calculate() between-dates: إزالة span خارجي زائد
#    (formatEquivDynamic يُرجع span بنفسه)
# ══════════════════════════════════════════════════════════
old_between_details = '          details += `<br><span class="details-gold">منذ ${fromText} حتى ${toText}</span> <span class=\\"details-equivalent\\">${eqText}</span>`;'
new_between_details = '          details += `<br><span class="details-gold">منذ ${fromText} حتى ${toText}</span> ${eqText}`;'

if old_between_details in src:
    src = src.replace(old_between_details, new_between_details, 1)
    print("✅ 4. تم إزالة span زائد في calculate() between-dates")
else:
    # جرب بدون escape
    old2 = '          details += `<br><span class="details-gold">منذ ${fromText} حتى ${toText}</span> <span class="details-equivalent">${eqText}</span>`;'
    new2 = '          details += `<br><span class="details-gold">منذ ${fromText} حتى ${toText}</span> ${eqText}`;'
    if old2 in src:
        src = src.replace(old2, new2, 1)
        print("✅ 4. تم إزالة span زائد في calculate() between-dates (v2)")
    else:
        print("⚠️ 4. لم أجد السطر المطلوب، سيتم البحث...")
        import re
        m = re.search(r'details \+= `.+منذ \$\{fromText\}.+details-equivalent.+eqText.+`;', src)
        if m:
            print(f"   وُجد في: {src[:m.start()].count(chr(10))+1}")

# ══════════════════════════════════════════════════════════
# 5. في dynamicSummaryLine: إزالة span خارجي زائد
# ══════════════════════════════════════════════════════════
old_summary_wrap = '          dynamicSummaryLine = `<span class="details-gold">منذ ${_fromFmt} حتى ${_toFmt}</span> <span class="details-equivalent">${_equivFull}</span>`;'
new_summary_wrap = '          dynamicSummaryLine = `<span class="details-gold">منذ ${_fromFmt} حتى ${_toFmt}</span> ${_equivFull}`;'

if old_summary_wrap in src:
    src = src.replace(old_summary_wrap, new_summary_wrap, 1)
    print("✅ 5. تم إزالة span زائد في dynamicSummaryLine")
else:
    print("⚠️ 5. لم أجد السطر - جاري البحث...")
    import re
    lines = src.split('\n')
    for i, line in enumerate(lines):
        if 'dynamicSummaryLine' in line and 'details-equivalent' in line:
            print(f"   السطر {i+1}: {line.strip()}")

# ══════════════════════════════════════════════════════════
# حفظ + تحقق
# ══════════════════════════════════════════════════════════
with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("\n✅ main.js محفوظ")
