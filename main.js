const singleDateInput = document.getElementById("single-date");
const singleDateWrapper = document.getElementById("single-date-wrapper");
const modeSinceBtn = document.getElementById("mode-since");
const modeUntilBtn = document.getElementById("mode-until");
const resultCard = document.getElementById("result-card");
const resultText = document.getElementById("result-text");
const resultEquivalent = document.getElementById("result-equivalent");
const resultDetails = document.getElementById("result-details");
const resultPlaceholder = document.getElementById("result-placeholder");
const importanceSelect = document.getElementById("importance");
const saveEntryBtn = document.getElementById("save-entry-btn");
const savedList = document.getElementById("saved-list");
const savedCountEl = document.getElementById("saved-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggleBtn = document.getElementById("theme-toggle");
const STORAGE_KEY = "dayCounterState";
const STORAGE_SAVED_KEY = "dayCounterSaved";
const STORAGE_THEME_KEY = "dayCounterTheme";

let savedEntries = [];
let mode = "since"; // since | until
let importanceFilter = "all"; // all | normal | important | very-important
let lastDaysValue = null; // القيمة العددية للأيام في آخر حساب
let lastIsRemaining = false; // هل كانت الحالة "بقي" (موعد قادم)
let lastTargetGregorian = ""; // التاريخ الهدف (ميلادي) لآخر حساب
let lastSinceBaseGregorian = ""; // آخر تاريخ استُخدم في وضع "منذ التاريخ" (ميلادي)
let lastSinceBaseRaw = ""; // آخر تاريخ استُخدم في وضع "منذ التاريخ" (قيمة input yyyy-mm-dd)

function applyTheme(theme) {
  const body = document.body;
  if (theme === "light") {
    body.classList.add("light-theme");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀";
  } else {
    body.classList.remove("light-theme");
    if (themeToggleBtn) themeToggleBtn.textContent = "☾";
  }
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_THEME_KEY);
    const theme = stored === "light" ? "light" : "dark";
    applyTheme(theme);
  } catch (e) {
    applyTheme("dark");
  }
}

function setTodayIfEmpty() {
  if (!singleDateInput) return;
  if (singleDateInput.value) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  singleDateInput.value = `${yyyy}-${mm}-${dd}`;
}

function parseDate(input) {
  const value = input.value;
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
}

function diffInDays(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = date2 - date1;
  return Math.round(diff / msPerDay);
}

function formatGregorian(date) {
  const fmt = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  return fmt.format(date);
}

// تنسيق ميلادي رقمي بسيط بالشكل: 4/12/2025
function formatGregorianNumeric(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatHijri(date) {
  try {
    const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    return fmt.format(date);
  } catch (e) {
    // في حال عدم دعم التقويم الهجري في المتصفح نرجع التاريخ الميلادي فقط
    return formatGregorian(date);
  }
}

function formatBothCalendars(date) {
  const g = formatGregorian(date);
  const h = formatHijri(date);
  // نستخدم span لتمييز التاريخ الميلادي والهجري في التصميم
  if (g === h) {
    return `<span class="date-greg">${g}</span>`;
  }
  // التنسيق الهجري القادم من Intl يتضمن "هـ" بالفعل، لذلك لا نضيفها يدويًا حتى لا تتكرر
  return `<span class="date-greg">${g} م</span> <span class="date-hijri">(${h})</span>`;
}

function formatYearsAndDays(days) {
  const total = Math.abs(days);
  if (total === 0) return "";

  const parts = [];

  if (total >= 365) {
    const years = Math.floor(total / 365);
    let rest = total % 365;

    if (years > 0) {
      parts.push(`${years} سنة`);
    }

    const months = Math.floor(rest / 30);
    rest = rest % 30;

    if (months > 0) {
      parts.push(`${months} شهر`);
    }

    if (rest > 0) {
      parts.push(`${rest} يوم`);
    }
  } else {
    const months = Math.floor(total / 30);
    const rest = total % 30;

    if (months > 0) {
      parts.push(`${months} شهر`);
    }

    if (rest > 0) {
      parts.push(`${rest} يوم`);
    }
  }

  if (!parts.length) return "";
  return `ما يعادل ${parts.join(" و ")}`;
}

function saveState(extra = {}) {
  const state = {
    mode,
    resultVisible: !resultCard.hidden,
    resultText: resultText.innerHTML,
    resultEquivalent: resultEquivalent.textContent,
    resultDetails: resultDetails.innerHTML,
    ...extra,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // تجاهل أي خطأ في التخزين
  }
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);

    // دائمًا نعيد ضبط حقل التاريخ إلى تاريخ اليوم عند فتح التطبيق
    if (singleDateInput) {
      singleDateInput.value = "";
      setTodayIfEmpty();
    }
    mode = state.mode === "until" ? "until" : "since";

    if (mode === "since") {
      modeSinceBtn.classList.add("active");
      modeUntilBtn.classList.remove("active");
    } else {
      modeUntilBtn.classList.add("active");
      modeSinceBtn.classList.remove("active");
    }

    // لا نسترجع نتيجة الحساب تلقائيًا عند فتح التطبيق
    resultText.textContent = "";
    resultEquivalent.textContent = "";
    resultDetails.textContent = "";
    resultCard.hidden = true;
    if (resultPlaceholder) {
      resultPlaceholder.hidden = false;
    }
  } catch (e) {
    // تجاهل أي خطأ في القراءة / التحويل
  }
}

function saveSavedEntries() {
  try {
    localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedEntries));
  } catch (e) {
    // تجاهل أي خطأ في التخزين
  }
}

function loadSavedEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_KEY);
    if (!raw) {
      savedEntries = [];
      return;
    }
    savedEntries = JSON.parse(raw) || [];
  } catch (e) {
    savedEntries = [];
  }
}

function renderSavedEntries() {
  if (!savedList) return;

  savedList.innerHTML = "";

  const visibleEntries = savedEntries.filter((entry) => {
    if (importanceFilter === "all") return true;
    return entry.importance === importanceFilter;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let migratedAny = false;

  visibleEntries.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = "saved-item";

    // تلوين الحد الجانبي حسب الأهمية
    if (entry.importance === "very-important") {
      item.classList.add("very-important-border");
    } else if (entry.importance === "important") {
      item.classList.add("important-border");
    } else {
      item.classList.add("normal-border");
    }

    // إعادة حساب المدة ديناميكيًا (مر/بقي وعدد الأيام) إن توفّر تاريخ هدف خام
    let dynamicMainLine = "";
    let dynamicEquivLine = "";
    let blinkDays = null;
    let blinkIsFuture = false;

    // نحاول أولاً الحصول على تاريخ هدف خام، وإن لم يكن موجودًا نحاول استنتاجه من targetDate
    let targetForCalc = null;

    if (entry.targetDateRaw) {
      const t = new Date(entry.targetDateRaw + "T00:00:00");
      if (!isNaN(t.getTime())) {
        targetForCalc = t;
      }
    } else if (entry.targetDate) {
      const t = new Date(entry.targetDate);
      if (!isNaN(t.getTime())) {
        // نجحنا في تحويل النص المخزن إلى تاريخ
        targetForCalc = t;

        // ترقية المدة القديمة لتخزين targetDateRaw و modeAtSave
        const yyyy = t.getFullYear();
        const mm = String(t.getMonth() + 1).padStart(2, "0");
        const dd = String(t.getDate()).padStart(2, "0");
        entry.targetDateRaw = `${yyyy}-${mm}-${dd}`;

        if (!entry.modeAtSave) {
          // تخمين منطقي: إذا كان التاريخ في الماضي نعتبرها "منذ"، وإذا في المستقبل نعتبرها "حتى"
          entry.modeAtSave = t <= today ? "since" : "until";
        }

        migratedAny = true;
      }
    }

    // كخيار أخير: إذا لم ننجح في استنتاج التاريخ من النص، لكن لدينا remainingDays فنستنتج تاريخ الهدف من اليوم الحالي
    if (!targetForCalc && typeof entry.remainingDays === "number") {
      const msPerDay = 24 * 60 * 60 * 1000;
      const base = new Date(today.getTime());
      let inferred;

      if (entry.remainingIsFuture) {
        inferred = new Date(base.getTime() + entry.remainingDays * msPerDay);
      } else {
        inferred = new Date(base.getTime() - entry.remainingDays * msPerDay);
      }

      if (!isNaN(inferred.getTime())) {
        targetForCalc = inferred;

        const yyyy = inferred.getFullYear();
        const mm = String(inferred.getMonth() + 1).padStart(2, "0");
        const dd = String(inferred.getDate()).padStart(2, "0");
        entry.targetDateRaw = `${yyyy}-${mm}-${dd}`;

        if (!entry.targetDate) {
          entry.targetDate = formatGregorian(inferred);
        }

        if (!entry.modeAtSave) {
          entry.modeAtSave = entry.remainingIsFuture ? "until" : "since";
        }

        migratedAny = true;
      }
    }

    if (targetForCalc) {
      let days;
      if (entry.modeAtSave === "since") {
        days = diffInDays(targetForCalc, today);
      } else {
        days = diffInDays(today, targetForCalc);
      }

      const abs = Math.abs(days);

      // اختيار الكلمة حسب الوضع الذي حُفظت به المدة، وليس حسب إشارة days
      let verb = "";
      if (entry.modeAtSave === "since") {
        verb = "مضى";
        blinkIsFuture = false;
      } else if (entry.modeAtSave === "until") {
        // للوضع "حتى" نتحقق إذا انتهى الموعد أم لا
        if (targetForCalc < today) {
          dynamicMainLine = `<span class="result-verb-red" style="color: #22c55e;">✨ انتهى</span>`;
          dynamicEquivLine = `مرّ ${abs} يوم منذ انتهاء الموعد`;
        } else if (targetForCalc === today) {
          dynamicMainLine = `<span class="result-verb-red" style="color: #f59e0b;">🔔 اليوم</span>`;
          dynamicEquivLine = "ينتهي اليوم";
        } else {
          verb = "متبقي";
          blinkIsFuture = targetForCalc > today;
        }
      }

      if (!dynamicMainLine) {
        if (abs === 0) {
          dynamicMainLine = `<span class="result-verb-red">${verb}</span> اليوم`;
        } else if (verb) {
          dynamicMainLine = `<span class="result-verb-red">${verb}</span> ${abs} يوم`;
        } else {
          dynamicMainLine = `${abs} يوم`;
        }
      }

      if (!dynamicEquivLine) {
        dynamicEquivLine = formatYearsAndDays(days);
      }
      blinkDays = abs;
    }

    // إذا تعذر الحساب الديناميكي نستخدم القيم المخزنة القديمة
    if (!dynamicMainLine && (entry.mainText || entry.remainingText)) {
      dynamicMainLine = entry.mainText || entry.remainingText || "";
    }
    if (!dynamicEquivLine && entry.equivalentText) {
      dynamicEquivLine = entry.equivalentText;
    }

    // في حال كانت المدة موعدًا قادمًا وبقي أقل من 5 أيام، نميزها بكلاس الوميض
    let finalBlinkDays = blinkDays;
    let finalBlinkIsFuture = blinkIsFuture;

    if (finalBlinkDays == null && typeof entry.remainingDays === "number") {
      finalBlinkDays = entry.remainingDays;
      finalBlinkIsFuture = !!entry.remainingIsFuture;
    }

    if (finalBlinkIsFuture && typeof finalBlinkDays === "number") {
      if (finalBlinkDays > 0 && finalBlinkDays < 5) {
        item.classList.add("near-event-row");
      }
    }

    const left = document.createElement("div");
    left.className = "saved-item-main";

    const titleRow = document.createElement("div");
    titleRow.className = "saved-item-meta";

    const title = document.createElement("span");
    title.className = "saved-item-title";
    title.textContent = entry.note || "-";

    const stars = document.createElement("span");
    stars.className = "saved-item-stars";
    if (entry.importance === "very-important") {
      stars.innerHTML = "<span class='star'>★★</span>";
    } else if (entry.importance === "important") {
      stars.innerHTML = "<span class='star'>★</span>";
    }

    titleRow.appendChild(title);
    if (stars.innerHTML) {
      titleRow.appendChild(stars);
    }

    const remainingLine = document.createElement("div");
    remainingLine.className = "saved-item-remaining";
    if (entry.hidden) {
      remainingLine.textContent = "مخفي";
    } else {
      const parts = [];
      if (dynamicMainLine) parts.push(dynamicMainLine);
      if (dynamicEquivLine) parts.push(dynamicEquivLine);

      // إضافة نص التفاصيل الكامل كما ظهر في البطاقة (يشمل جملة تبقى/مرت وسطر منذ ...)
      if (entry.detailsText) {
        parts.push(entry.detailsText);
      }

      remainingLine.innerHTML = parts.join("<br>") || "-";
    }

    left.appendChild(titleRow);
    left.appendChild(remainingLine);

    const right = document.createElement("div");
    right.className = "saved-item-actions";
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn";
    toggleBtn.textContent = entry.hidden ? "إظهار" : "إخفاء";
    toggleBtn.addEventListener("click", () => {
      entry.hidden = !entry.hidden;
      saveSavedEntries();
      renderSavedEntries();
    });

    right.appendChild(toggleBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "toggle-btn";
    deleteBtn.textContent = "حذف";
    deleteBtn.addEventListener("click", () => {
      const ok = confirm("هل أنت متأكد من حذف هذه المدة المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.");
      if (!ok) return;

      savedEntries = savedEntries.filter((e) => e.id !== entry.id);
      saveSavedEntries();
      renderSavedEntries();
    });

    right.appendChild(deleteBtn);

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "toggle-btn";
    moveUpBtn.textContent = "▲";
    const originalIndex = savedEntries.findIndex((e) => e.id === entry.id);

    moveUpBtn.disabled = originalIndex <= 0;
    moveUpBtn.addEventListener("click", () => {
      if (originalIndex <= 0) return;
      const tmp = savedEntries[originalIndex - 1];
      savedEntries[originalIndex - 1] = savedEntries[originalIndex];
      savedEntries[originalIndex] = tmp;
      saveSavedEntries();
      renderSavedEntries();
    });

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "toggle-btn";
    moveDownBtn.textContent = "▼";
    moveDownBtn.disabled = originalIndex === savedEntries.length - 1;
    moveDownBtn.addEventListener("click", () => {
      if (originalIndex === savedEntries.length - 1) return;
      const tmp = savedEntries[originalIndex + 1];
      savedEntries[originalIndex + 1] = savedEntries[originalIndex];
      savedEntries[originalIndex] = tmp;
      saveSavedEntries();
      renderSavedEntries();
    });

    right.appendChild(moveUpBtn);
    right.appendChild(moveDownBtn);

    item.appendChild(left);
    item.appendChild(right);

    savedList.appendChild(item);
  });

  if (savedCountEl) {
    const count = savedEntries.length;
    savedCountEl.textContent = count
      ? `عدد المدد المحفوظة: ${count}`
      : "لا توجد مدد محفوظة";
  }
}

function calculate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = parseDate(singleDateInput);

  if (!target) {
    resultCard.hidden = true;
    if (resultPlaceholder) {
      resultPlaceholder.hidden = false;
    }
    saveState({ resultVisible: false });
    return;
  }

  let days = 0;
  if (mode === "since") {
    // منذ التاريخ حتى اليوم: نحسب فقط إذا كان التاريخ قبل أو يساوي اليوم
    if (target <= today) {
      days = diffInDays(target, today);
      // تخزين هذا التاريخ كأساس لعبارة "منذ ..." لاستخدامه لاحقًا في وضع حتى التاريخ
      lastSinceBaseGregorian = formatGregorian(target) + " م";
      lastSinceBaseRaw = singleDateInput.value || "";
    } else {
      days = 0;
    }
  } else {
    // حتى التاريخ: نحسب دائماً لمعرفة هل انتهى أم لا
    days = diffInDays(today, target);
    // إذا كان التاريخ في الماضي، نعرض رسالة انتهاء رائعة
    if (target < today) {
      const pastDays = Math.abs(days);
      resultText.innerHTML = `<span class="result-verb-red" style="color: #22c55e;">✨ انتهى</span>`;
      resultEquivalent.textContent = `مرّ ${pastDays} يوم منذ انتهاء الموعد`;
      resultDetails.innerHTML = `<span class="details-gold">🎉 انتهى الموعد الذي كان في ${formatBothCalendars(target)} منذ ${pastDays} يوم (من اليوم ${formatBothCalendars(today)}).</span>`;
      
      // تخزين معلومات آخر حساب لاستخدامها عند الحفظ في الجدول
      lastDaysValue = pastDays;
      lastIsRemaining = false;
      lastTargetGregorian = formatGregorian(target);
      
      resultCard.hidden = false;
      if (resultPlaceholder) {
        resultPlaceholder.hidden = true;
      }
      saveState();
      return;
    } else if (target === today) {
      // إذا كان التاريخ هو اليوم نفسه
      resultText.innerHTML = `<span class="result-verb-red" style="color: #f59e0b;">🔔 اليوم</span>`;
      resultEquivalent.textContent = "ينتهي اليوم";
      resultDetails.innerHTML = `<span class="details-gold">⏰ ينتهي الموعد اليوم: ${formatBothCalendars(target)} (اليوم ${formatBothCalendars(today)}).</span>`;
      
      // تخزين معلومات آخر حساب لاستخدامها عند الحفظ في الجدول
      lastDaysValue = 0;
      lastIsRemaining = false;
      lastTargetGregorian = formatGregorian(target);
      
      resultCard.hidden = false;
      if (resultPlaceholder) {
        resultPlaceholder.hidden = true;
      }
      saveState();
      return;
    }
  }

  const abs = Math.abs(days);
  let verb;
  let isRemaining = false;
  const isFutureTarget = target > today;

  // حفظ التاريخ الهدف الميلادي لعرضه في المدد المحفوظة
  lastTargetGregorian = formatGregorian(target);

  if (abs === 0) {
    // إذا كان التاريخ هو اليوم نفسه، نعرض النتيجة حسب الوضع
    if (mode === "since") {
      verb = "مضى";
      isRemaining = false;
      resultText.innerHTML = `<span class="result-verb-red">${verb}</span> اليوم`;
      resultDetails.innerHTML = `مضى اليوم منذ ${formatBothCalendars(target)} حتى اليوم (${formatBothCalendars(today)}).`;
    } else {
      verb = "متبقي";
      isRemaining = false;
      resultText.innerHTML = `<span class="result-verb-red">${verb}</span> اليوم`;
      resultDetails.innerHTML = `<span class="details-gold">تبقى اليوم حتى ${formatBothCalendars(target)} من اليوم (${formatBothCalendars(today)}).</span>`;
    }
    resultEquivalent.textContent = "";
  } else {
    // اختيار الكلمة حسب الوضع الحالي للزر
    if (mode === "since") {
      verb = "مضى";
      isRemaining = false;
    } else {
      verb = "متبقي";
      // نستخدم isFutureTarget لتحديد هل هو موعد قادم لأغراض الوميض
      isRemaining = isFutureTarget;
    }
    resultText.innerHTML = `<span class="result-verb-red">${verb}</span> ${abs} يوم`;
    resultEquivalent.textContent = formatYearsAndDays(days);

    if (mode === "since") {
      // مضت أيام من التاريخ المحدد حتى اليوم
      resultDetails.innerHTML = `مضت ${abs} يوم منذ ${formatBothCalendars(target)} حتى اليوم (${formatBothCalendars(today)}).`;
    } else {
      // تبقّى أيام من اليوم حتى التاريخ المحدد (سطر ذهبي)
      let details = `<span class="details-gold">تبقى ${abs} يوم حتى ${formatBothCalendars(target)} من اليوم (${formatBothCalendars(today)}).</span>`;

      // نضيف سطرًا يلخص الفترة بين تاريخ أساس وتاريخ "حتى" الحالي
      // إذا وُجد lastSinceBaseRaw نستخدمه، وإلا نستخدم تاريخ اليوم كأساس
      const rawDateValue = singleDateInput.value || "";
      if (rawDateValue) {
        let baseRawForSummary = lastSinceBaseRaw;

        if (!baseRawForSummary) {
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");
          baseRawForSummary = `${yyyy}-${mm}-${dd}`;
        }

        const base = new Date(baseRawForSummary + "T00:00:00");
        const untilDate = new Date(rawDateValue + "T00:00:00");
        if (!isNaN(base.getTime()) && !isNaN(untilDate.getTime())) {
          const betweenDays = diffInDays(base, untilDate);
          const absBetween = Math.abs(betweenDays);
          const eqBetween = formatYearsAndDays(betweenDays);

          const fromText = formatGregorian(base) + " م";
          const toText = formatGregorian(untilDate) + " م";

          // إزالة عبارة "ما يعادل" من بداية النص إن وُجدت، لنستخدمها داخل "تعادل" الخضراء
          let eqText = "";
          if (eqBetween) {
            eqText = eqBetween.replace(/^ما يعادل\s*/u, "");
          } else {
            eqText = `${absBetween} يوم`;
          }

          details += `<br><span class="details-gold">منذ ${fromText} حتى ${toText}</span> <span class=\"details-equivalent\">تعادل ${eqText}</span>`;
        }
      }

      resultDetails.innerHTML = details;
    }
  }

  // تخزين معلومات آخر حساب لاستخدامها عند الحفظ في الجدول
  lastDaysValue = abs;
  lastIsRemaining = isRemaining;

  resultCard.hidden = false;
  if (resultPlaceholder) {
    resultPlaceholder.hidden = true;
  }
  saveState();
}

restoreState();
loadSavedEntries();
renderSavedEntries();
loadTheme();

if (modeSinceBtn && modeUntilBtn) {
  modeSinceBtn.addEventListener("click", () => {
    mode = "since";
    modeSinceBtn.classList.add("active");
    modeUntilBtn.classList.remove("active");
    calculate();
  });

  modeUntilBtn.addEventListener("click", () => {
    mode = "until";
    modeUntilBtn.classList.add("active");
    modeSinceBtn.classList.remove("active");
    calculate();
  });
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-theme");
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, next);
    } catch (e) {
      // تجاهل أي خطأ في التخزين
    }
  });
}

if (singleDateInput) {
  singleDateInput.addEventListener("change", calculate);
}

if (singleDateWrapper && singleDateInput) {
  singleDateWrapper.addEventListener("click", (e) => {
    // منع النقرات على عناصر داخلية أخرى من تعطيل السلوك
    if (typeof singleDateInput.showPicker === "function") {
      singleDateInput.showPicker();
    } else {
      singleDateInput.focus();
      singleDateInput.click();
    }
  });
}

if (filterButtons && filterButtons.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-importance") || "all";
      importanceFilter = value;

      // تحديث الزر النشط شكليًا
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderSavedEntries();
    });
  });
}

saveEntryBtn.addEventListener("click", () => {
  if (resultCard.hidden) {
    alert("قم بحساب المدة أولاً قبل الحفظ في الجدول.");
    return;
  }

  const daysHtml = resultText.innerHTML || "";
  const importance = importanceSelect.value;

  const noteRaw = prompt("اكتب الملاحظة للمدة الحالية:", "");
  if (noteRaw === null) {
    return;
  }

  const note = noteRaw.trim();
  if (!note) {
    alert("الرجاء كتابة ملاحظة قبل الحفظ.");
    return;
  }

  // قراءة التاريخ الخام المستخدم في الحساب الحالي لدعم إعادة الحساب لاحقًا
  const rawDateValue = singleDateInput.value || "";

  // في حال كان الوضع الحالي "حتى التاريخ" وهناك تاريخ أساس من آخر حساب "منذ التاريخ"
  // نحسب الفترة بين التاريخين لبناء جملة: منذ [من] حتى [إلى] تعادل ...
  let sinceUntilSummary = "";
  if (mode === "until" && lastSinceBaseRaw && rawDateValue) {
    const base = new Date(lastSinceBaseRaw + "T00:00:00");
    const target = new Date(rawDateValue + "T00:00:00");
    if (!isNaN(base.getTime()) && !isNaN(target.getTime())) {
      const daysBetween = diffInDays(base, target);
      const absBetween = Math.abs(daysBetween);
      const eqBetween = formatYearsAndDays(daysBetween);

      const fromText = formatGregorian(base) + " م";
      const toText = formatGregorian(target) + " م";
      const eqText = eqBetween || `${absBetween} يوم`;

      sinceUntilSummary = `منذ ${fromText} حتى ${toText} تعادل ${eqText}`;
    }
  }

  const entry = {
    id: Date.now(),
    // السطر الأول: "مر / بقي X يوم" مع اللون الأحمر
    mainText: daysHtml,
    // السطر الثاني: "ما يعادل ..."
    equivalentText: resultEquivalent.textContent || "",
    // السطر الثالث: تفاصيل من/إلى
    detailsText: resultDetails.innerHTML || "",
    // حقل قديم للإبقاء على التوافق مع المدد الأقدم
    remainingText: daysHtml || resultEquivalent.textContent,
    remainingDays: lastDaysValue,
    remainingIsFuture: lastIsRemaining,
    targetDate: lastTargetGregorian,
    sinceUntilSummary,
    // قيم جديدة لدعم إعادة الحساب الديناميكي
    targetDateRaw: rawDateValue,
    modeAtSave: mode,
    value: 1,
    importance,
    note,
    hidden: false,
  };

  savedEntries.push(entry);
  saveSavedEntries();
  renderSavedEntries();

  // بعد الحفظ، نخفي النتيجة الحالية لنبدأ بتاريخ جديد
  resultText.textContent = "";
  resultEquivalent.textContent = "";
  resultDetails.textContent = "";
  resultCard.hidden = true;
  if (resultPlaceholder) {
    resultPlaceholder.hidden = false;
  }
  // مسح التاريخ المختار حتى لا يعيد زر الوضع (منذ/حتى) عرض النتيجة القديمة
  if (singleDateInput) {
    singleDateInput.value = "";
    setTodayIfEmpty();
  }

  saveState({
    resultVisible: false,
    resultText: "",
    resultEquivalent: "",
    resultDetails: "",
  });
});
