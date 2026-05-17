# ══════════════════════════════════════════════════════════
# 1. i18n.js — إضافة مفتاح copyBtn + copiedBtn
# ══════════════════════════════════════════════════════════
path_i18n = "/sessions/inspiring-optimistic-clarke/mnt/outputs/i18n.js"
with open(path_i18n, "r", encoding="utf-8") as f:
    isrc = f.read()

# العربية
old_ar = '    deleteBtn:          "حذف",'
new_ar = '    deleteBtn:          "حذف",\n    copyBtn:            "📋 نسخ",\n    copiedBtn:          "✅ تم النسخ",'
assert old_ar in isrc, "❌ لم أجد deleteBtn AR"
isrc = isrc.replace(old_ar, new_ar, 1)

# الإنجليزية
old_en = '    deleteBtn:          "Delete",'
new_en = '    deleteBtn:          "Delete",\n    copyBtn:            "📋 Copy",\n    copiedBtn:          "✅ Copied",'
assert old_en in isrc, "❌ لم أجد deleteBtn EN"
isrc = isrc.replace(old_en, new_en, 1)

with open(path_i18n, "w", encoding="utf-8") as f:
    f.write(isrc)
print("✅ 1. i18n.js — تم إضافة copyBtn / copiedBtn")

# ══════════════════════════════════════════════════════════
# 2. main.js — إضافة زر النسخ بعد زر الحذف مباشرة
# ══════════════════════════════════════════════════════════
path_main = "/sessions/inspiring-optimistic-clarke/mnt/outputs/main.js"
with open(path_main, "r", encoding="utf-8") as f:
    src = f.read()

# نضيف الزر بعد: right.appendChild(deleteBtn);
old_after_delete = "    right.appendChild(deleteBtn);\n\n    const moveUpBtn"
new_after_delete = """\
    right.appendChild(deleteBtn);

    // ── زر النسخ ──
    const copyBtn = document.createElement("button");
    copyBtn.className = "toggle-btn";
    copyBtn.textContent = t("copyBtn");
    copyBtn.addEventListener("click", () => {
      // بناء نص النسخ من أجزاء المدة (بدون وسوم HTML)
      function stripHtml(html) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html || "";
        return tmp.textContent.trim();
      }
      const lines = [];
      if (entry.note) lines.push(entry.note);
      if (dynamicMainLine)   lines.push(stripHtml(dynamicMainLine) + " — " + stripHtml(dynamicEquivLine));
      else if (dynamicEquivLine) lines.push(stripHtml(dynamicEquivLine));
      const det = dynamicDetailsLine || entry.detailsText || "";
      if (det) lines.push(stripHtml(det));
      if (dynamicSummaryLine) lines.push(stripHtml(dynamicSummaryLine));
      const textToCopy = lines.join("\\n");
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.textContent = t("copiedBtn");
        setTimeout(() => { copyBtn.textContent = t("copyBtn"); }, 2000);
      }).catch(() => {
        // fallback للمتصفحات القديمة
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        copyBtn.textContent = t("copiedBtn");
        setTimeout(() => { copyBtn.textContent = t("copyBtn"); }, 2000);
      });
    });
    right.appendChild(copyBtn);

    const moveUpBtn"""

assert old_after_delete in src, "❌ لم أجد right.appendChild(deleteBtn)"
src = src.replace(old_after_delete, new_after_delete, 1)
print("✅ 2. main.js — تم إضافة زر النسخ")

with open(path_main, "w", encoding="utf-8") as f:
    f.write(src)
print("✅ main.js محفوظ")
