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
const savedTableBody = document.getElementById("saved-table-body");
const savedCountEl = document.getElementById("saved-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const STORAGE_KEY = "dayCounterState";
const STORAGE_SAVED_KEY = "dayCounterSaved";

let savedEntries = [];
let mode = "since"; // since | until
let importanceFilter = "all"; // all | normal | important | very-important
let lastDaysValue = null; // القيمة العددية للأيام في آخر حساب
let lastIsRemaining = false; // هل كانت الحالة "بقي" (موعد قادم)

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
    singleDate: singleDateInput.value || "",
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

    singleDateInput.value = state.singleDate || "";
    if (!state.singleDate) {
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

    if (state.resultVisible && state.resultText) {
      resultText.innerHTML = state.resultText;
      resultEquivalent.textContent = state.resultEquivalent || "";
      resultDetails.innerHTML = state.resultDetails || "";
      resultCard.hidden = false;
      if (resultPlaceholder) {
        resultPlaceholder.hidden = true;
      }
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
  if (!savedTableBody) return;

  savedTableBody.innerHTML = "";

  const visibleEntries = savedEntries.filter((entry) => {
    if (importanceFilter === "all") return true;
    return entry.importance === importanceFilter;
  });

  visibleEntries.forEach((entry, index) => {
    const tr = document.createElement("tr");

    // في حال كانت المدة موعدًا قادمًا وبقي أقل من 5 أيام، نميز الصف بإطار ذهبي يومض
    if (entry.remainingIsFuture && typeof entry.remainingDays === "number") {
      if (entry.remainingDays > 0 && entry.remainingDays < 5) {
        tr.classList.add("near-event-row");
      }
    }

    const tdRemaining = document.createElement("td");
    const tdValue = document.createElement("td");
    const tdNote = document.createElement("td");

    const tdVeryImportant = document.createElement("td");
    const tdImportant = document.createElement("td");
    const tdNormal = document.createElement("td");
    const tdToggle = document.createElement("td");
    const tdMove = document.createElement("td");
    const tdDelete = document.createElement("td");

    tdVeryImportant.className = "no-star";
    tdImportant.className = "no-star";
    tdNormal.className = "no-star";

    // المدة المتبقية: تُخفى عند hidden
    if (entry.hidden) {
      tdRemaining.textContent = "مخفي";
    } else {
      const mainLine = entry.mainText || entry.remainingText || "";
      const equivLine = entry.equivalentText || "";
      const detailsLine = entry.detailsText || "";

      const parts = [];
      if (mainLine) {
        parts.push(mainLine);
      }
      if (equivLine) {
        parts.push(`<span class="saved-equivalent">${equivLine}</span>`);
      }
      if (detailsLine) {
        parts.push(`<span class="saved-details">${detailsLine}</span>`);
      }

      tdRemaining.innerHTML = parts.join("<br>") || "-";
    }

    // الأعمدة الأخرى تبقى دائمًا ظاهرة
    tdValue.textContent = entry.value ?? "1";
    tdNote.textContent = entry.note || "-";

    if (entry.importance === "very-important") {
      tdVeryImportant.innerHTML = '<span class="star">★★</span>';
    } else if (entry.importance === "important") {
      tdImportant.innerHTML = '<span class="star">★</span>';
    } else {
      tdNormal.textContent = "لا يوجد نجمة";
    }

    tr.appendChild(tdRemaining);
    tr.appendChild(tdValue);
    tr.appendChild(tdNote);
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn";
    toggleBtn.textContent = entry.hidden ? "إظهار" : "إخفاء";
    toggleBtn.addEventListener("click", () => {
      entry.hidden = !entry.hidden;
      saveSavedEntries();
      renderSavedEntries();
    });

    tdToggle.appendChild(toggleBtn);

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

    tdDelete.appendChild(deleteBtn);

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

    tdMove.appendChild(moveUpBtn);
    tdMove.appendChild(moveDownBtn);

    tr.appendChild(tdVeryImportant);
    tr.appendChild(tdImportant);
    tr.appendChild(tdNormal);
    tr.appendChild(tdToggle);
    tr.appendChild(tdMove);
    tr.appendChild(tdDelete);

    savedTableBody.appendChild(tr);
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

  let days;
  if (mode === "since") {
    // منذ التاريخ حتى اليوم
    days = diffInDays(target, today);
  } else {
    // من اليوم حتى التاريخ
    days = diffInDays(today, target);
  }

  const abs = Math.abs(days);
  let verb;
  let isRemaining = false;

  if (abs === 0) {
    resultText.textContent = "0 يوم";
    resultEquivalent.textContent = "";
    resultDetails.textContent = "التاريخ هو اليوم نفسه، الفرق 0 يوم.";
  } else {
    if (days > 0) {
      verb = "مر";
      isRemaining = false;
    } else if (days < 0) {
      verb = "بقي";
      isRemaining = true;
    }
    resultText.innerHTML = `<span class="result-verb-red">${verb}</span> ${abs} يوم`;
    resultEquivalent.textContent = formatYearsAndDays(days);

    if (days > 0) {
      // مرّت أيام من التاريخ المحدد حتى اليوم
      resultDetails.innerHTML = `مرّت ${abs} يوم منذ ${formatBothCalendars(target)} حتى اليوم (${formatBothCalendars(today)}).`;
    } else {
      // تبقّى أيام من اليوم حتى التاريخ المحدد
      resultDetails.innerHTML = `تبقى ${abs} يوم حتى ${formatBothCalendars(target)} من اليوم (${formatBothCalendars(today)}).`;
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
