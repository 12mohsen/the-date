// ============ نظام الترجمة (Arabic / English) ============

const STORAGE_LANG_KEY = "dayCounterLang";

const TRANSLATIONS = {
  ar: {
    // HTML title
    pageTitle: "عداد الأيام",

    // Auth screen
    authTitleLogin:     "تسجيل الدخول",
    authTitleSignup:    "إنشاء حساب جديد",
    authSubtitleLogin:  "أدخل اسم المستخدم وكلمة المرور للمتابعة",
    authSubtitleSignup: "أنشئ حساباً جديداً مع تلميح لكلمة المرور",
    usernameLabel:      "اسم المستخدم",
    passwordLabel:      "كلمة المرور",
    hintLabel:          "تلميح لكلمة المرور (يُعرض عند النسيان)",
    loginBtn:           "دخول",
    signupBtn:          "إنشاء الحساب",
    processingBtn:      "جارٍ المعالجة...",
    remindBtn:          "🔑 تذكير: اعرض التلميح",
    noAccount:          "ليس لديك حساب؟",
    haveAccount:        "لديك حساب بالفعل؟",
    goToSignup:         "إنشاء حساب جديد",
    goToLogin:          "تسجيل الدخول",
    errEnterBoth:       "الرجاء إدخال اسم المستخدم وكلمة المرور.",
    errUserNotFound:    "هذا المستخدم غير موجود. يمكنك إنشاء حساب جديد.",
    errWrongPassword:   "كلمة المرور غير صحيحة.",
    errNeedHint:        "الرجاء إضافة تلميح لكلمة المرور.",
    errUsernameTaken:   "اسم المستخدم مستخدم مسبقاً. اختر اسماً آخر.",
    errSignupFailed:    "حدث خطأ أثناء إنشاء الحساب: ",
    hintPrefix:         "💡 التلميح: ",
    noHintSet:          "لم يتم تسجيل تلميح لهذا الحساب.",

    // Header / user bar
    welcome:            "مرحباً،",
    logoutBtn:          "تسجيل الخروج",
    logoutConfirm:      "هل تريد تسجيل الخروج؟",
    appTitle:           "عداد الأيام",
    appSubtitle:        "احسب عدد الأيام بين تاريخين أو منذ / حتى تاريخ معين",

    // Main card
    selectDate:         "اختر تاريخاً",
    modeSince:          "منذ التاريخ",
    modeUntil:          "حتى التاريخ",
    placeholderResult:  "يرجى اختيار تاريخ لعرض النتيجة",
    resultTitle:        "النتيجة",
    reminderNote:       "تذكير: يتم الحساب بالاعتماد على الأيام الكاملة فقط بدون كسور الساعات.",

    // Saved section
    savedTitle:         "المدد المحفوظة",
    importanceLabel:    "الأهمية",
    impNormal:          "عادي",
    impImportant:       "مهم ⭐",
    impVeryImportant:   "مهم جدًا ⭐⭐",
    saveEntryBtn:       "حفظ المدة الحالية في الجدول",
    trashBtn:           "🗑 سلة المحذوفات",
    filterByImportance: "تصفية حسب الأهمية:",
    filterAll:          "الكل",
    filterNormal:       "عادي",
    filterImportant:    "مهم",
    filterVeryImportant:"مهم جدًا",
    savedCount:         (n) => `عدد المدد المحفوظة: ${n}`,
    noSaved:            "لا توجد مدد محفوظة",
    showBtn:            "إظهار",
    hideBtn:            "إخفاء",
    deleteBtn:          "حذف",
    deleteConfirm:      "هل أنت متأكد من حذف هذه المدة المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.",
    hiddenLabel:        "مخفي",
    notePrompt:         "اكتب الملاحظة للمدة الحالية:",
    calcFirst:          "قم بحساب المدة أولاً قبل الحفظ في الجدول.",

    // Result verbs
    verbSince:          "مضى",
    verbUntil:          "متبقي",
    verbEnded:          "✨ انتهى",
    verbToday:          "🔔 اليوم",
    endsToday:          "ينتهي اليوم",
    todayWord:          "اليوم",
    dayUnit:            "يوم",
    daysPassedSinceEnd: (n) => `مرّ ${n} يوم منذ انتهاء الموعد`,
    equivalentPrefix:   "ما يعادل",
    yearUnit:           "سنة",
    monthUnit:          "شهر",
    and:                "و",
    joinRemaining:      (days, target, today) => `تبقى ${days} يوم حتى ${target} من اليوم (${today}).`,
    joinSincePast:      (days, target, today) => `مضت ${days} يوم منذ ${target} حتى اليوم (${today}).`,
    joinEnded:          (days, target, today) => `🎉 انتهى الموعد الذي كان في ${target} منذ ${days} يوم (من اليوم ${today}).`,
    joinEndsToday:      (target, today) => `⏰ ينتهي الموعد اليوم: ${target} (اليوم ${today}).`,

    // Trash modal
    trashTitle:         "🗑 سلة المحذوفات",
    trashNote:          "يتم الحذف النهائي تلقائياً بعد مرور 30 يوماً من الحذف.",
    trashLoading:       "جارٍ التحميل...",
    trashEmpty:         "سلة المحذوفات فارغة",
    trashNoName:        "(بدون اسم)",
    trashDatePrefix:    "التاريخ: ",
    trashSeparator:     " — ",
    trashPermDelete:    (d, h) => `يُحذف نهائياً خلال: ${d} يوم و ${h} ساعة`,
    trashRestoreBtn:    "↺ استعادة",
    trashRestoring:     "جارٍ الاستعادة...",
    closeAria:          "إغلاق",

    // Footer
    copyright:          "حقوق الملكية mohsen",

    // Language toggle
    langToggle:         "EN",
    langToggleTitle:    "Switch to English",
    themeToggleAria:    "تبديل ألوان الواجهة",
  },

  en: {
    pageTitle: "Days Counter",

    authTitleLogin:     "Sign In",
    authTitleSignup:    "Create New Account",
    authSubtitleLogin:  "Enter your username and password to continue",
    authSubtitleSignup: "Create a new account with a password hint",
    usernameLabel:      "Username",
    passwordLabel:      "Password",
    hintLabel:          "Password hint (shown if forgotten)",
    loginBtn:           "Sign In",
    signupBtn:          "Create Account",
    processingBtn:      "Processing...",
    remindBtn:          "🔑 Remind me: show the hint",
    noAccount:          "Don't have an account?",
    haveAccount:        "Already have an account?",
    goToSignup:         "Create new account",
    goToLogin:          "Sign in",
    errEnterBoth:       "Please enter username and password.",
    errUserNotFound:    "This user doesn't exist. You can create a new account.",
    errWrongPassword:   "Incorrect password.",
    errNeedHint:        "Please add a password hint.",
    errUsernameTaken:   "Username already taken. Choose another.",
    errSignupFailed:    "Error creating account: ",
    hintPrefix:         "💡 Hint: ",
    noHintSet:          "No hint was saved for this account.",

    welcome:            "Hello,",
    logoutBtn:          "Log out",
    logoutConfirm:      "Do you want to log out?",
    appTitle:           "Days Counter",
    appSubtitle:        "Count days between two dates or since / until a specific date",

    selectDate:         "Pick a date",
    modeSince:          "Since date",
    modeUntil:          "Until date",
    placeholderResult:  "Please pick a date to see the result",
    resultTitle:        "Result",
    reminderNote:       "Note: calculation uses whole days only (no fractional hours).",

    savedTitle:         "Saved entries",
    importanceLabel:    "Importance",
    impNormal:          "Normal",
    impImportant:       "Important ⭐",
    impVeryImportant:   "Very important ⭐⭐",
    saveEntryBtn:       "Save current duration",
    trashBtn:           "🗑 Trash",
    filterByImportance: "Filter by importance:",
    filterAll:          "All",
    filterNormal:       "Normal",
    filterImportant:    "Important",
    filterVeryImportant:"Very important",
    savedCount:         (n) => `Saved entries: ${n}`,
    noSaved:            "No saved entries",
    showBtn:            "Show",
    hideBtn:            "Hide",
    deleteBtn:          "Delete",
    deleteConfirm:      "Are you sure you want to delete this entry? This cannot be undone.",
    hiddenLabel:        "Hidden",
    notePrompt:         "Enter a note for this entry:",
    calcFirst:          "Calculate a duration first before saving.",

    verbSince:          "passed",
    verbUntil:          "remaining",
    verbEnded:          "✨ Ended",
    verbToday:          "🔔 Today",
    endsToday:          "Ends today",
    todayWord:          "today",
    dayUnit:            "day(s)",
    daysPassedSinceEnd: (n) => `${n} day(s) have passed since the event ended`,
    equivalentPrefix:   "Equivalent to",
    yearUnit:           "year(s)",
    monthUnit:          "month(s)",
    and:                "and",
    joinRemaining:      (days, target, today) => `${days} day(s) remaining until ${target} (today is ${today}).`,
    joinSincePast:      (days, target, today) => `${days} day(s) have passed since ${target} until today (${today}).`,
    joinEnded:          (days, target, today) => `🎉 The event that was on ${target} ended ${days} day(s) ago (today is ${today}).`,
    joinEndsToday:      (target, today) => `⏰ The event ends today: ${target} (today is ${today}).`,

    trashTitle:         "🗑 Trash",
    trashNote:          "Items are permanently deleted 30 days after removal.",
    trashLoading:       "Loading...",
    trashEmpty:         "Trash is empty",
    trashNoName:        "(no name)",
    trashDatePrefix:    "Date: ",
    trashSeparator:     " — ",
    trashPermDelete:    (d, h) => `Permanently deleted in: ${d} day(s) and ${h} hour(s)`,
    trashRestoreBtn:    "↺ Restore",
    trashRestoring:     "Restoring...",
    closeAria:          "Close",

    copyright:          "© mohsen",

    langToggle:         "ع",
    langToggleTitle:    "التبديل إلى العربية",
    themeToggleAria:    "Toggle color theme",
  },
};

let currentLang = "ar";

function t(key, ...args) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
  const val = dict[key];
  if (typeof val === "function") return val(...args);
  if (typeof val === "string") return val;
  // fallback to Arabic if key missing
  const fb = TRANSLATIONS.ar[key];
  if (typeof fb === "function") return fb(...args);
  return fb || key;
}

function getLanguage() {
  return currentLang;
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "ar" || saved === "en") {
      currentLang = saved;
    }
  } catch (e) {}
  return currentLang;
}

function persistLanguage(lang) {
  try { localStorage.setItem(STORAGE_LANG_KEY, lang); } catch (e) {}
}

// تطبيق اللغة على كل عناصر DOM التي تحمل data-i18n
function applyLanguageToDOM() {
  // الاتجاه ولغة الوثيقة
  document.documentElement.lang = currentLang;
  document.documentElement.dir  = currentLang === "ar" ? "rtl" : "ltr";
  document.title = t("pageTitle");

  // كل عنصر عليه data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  // خصائص إضافية
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    el.setAttribute("aria-label", t(key));
  });

  // زر تبديل اللغة يعرض الرمز المعاكس
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = t("langToggle");
    langBtn.setAttribute("title", t("langToggleTitle"));
  }
}

// يُستخدم من main.js لتبديل اللغة
function setLanguage(lang) {
  currentLang = (lang === "en") ? "en" : "ar";
  persistLanguage(currentLang);
  applyLanguageToDOM();
  // إخطار بقية التطبيق لإعادة الرسم
  if (typeof onLanguageChanged === "function") {
    onLanguageChanged();
  }
}

function toggleLanguage() {
  setLanguage(currentLang === "ar" ? "en" : "ar");
}
