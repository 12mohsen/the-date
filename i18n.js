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
    errUserNotFound:    "اسم المستخدم غير مسجّل. سجّل حساباً أولاً.",
    errWrongPassword:   "كلمة المرور غير صحيحة.",
    errNeedHint:        "الرجاء إضافة تلميح لكلمة المرور.",
    errUsernameTaken:   "اسم المستخدم مستخدم مسبقاً. اختر اسماً آخر.",
    errUsernameTakenInApp: "اسم المستخدم موجود مسبقاً (مسجّل في أحد التطبيقات)",
    errSignupFailed:    "حدث خطأ أثناء إنشاء الحساب: ",
    hintPrefix:         "💡 التلميح: ",
    noHintSet:          "لم يتم تسجيل تلميح لهذا الحساب.",

    // نسيت كلمة المرور
    forgotPasswordLink:   "🔑 نسيت كلمة المرور؟",
    forgotTitle:          "إعادة تعيين كلمة المرور",
    forgotSubtitle:       "اكشف التلميح ثم أدخله للتحقق من هويتك",
    forgotShowHintBtn:    "عرض التلميح",
    forgotHintVerifyLabel:"أدخل التلميح للتحقق",
    forgotNewPwLabel:     "كلمة المرور الجديدة",
    forgotSubmitBtn:      "إعادة التعيين",
    backToLoginBtn:       "← العودة للدخول",
    forgotSuccess:        "✅ تم تغيير كلمة المرور بنجاح. يمكنك الدخول الآن.",
    forgotUserNotFound:   "هذا المستخدم غير موجود في هذا التطبيق.",
    forgotHintMismatch:   "التلميح الذي أدخلته غير صحيح.",
    forgotEnterUsername:  "الرجاء إدخال اسم المستخدم أولاً.",
    forgotEnterAll:       "الرجاء ملء جميع الحقول.",

    // تغيير كلمة المرور
    changePwBtn:          "🔑 تغيير كلمة المرور",
    changePwModalTitle:   "تغيير كلمة المرور",
    changePwOldLabel:     "كلمة المرور الحالية",
    changePwNewLabel:     "كلمة المرور الجديدة",
    changePwConfirmLabel: "تأكيد كلمة المرور الجديدة",
    changePwSubmitBtn:    "تغيير",
    changePwCancelBtn:    "إلغاء",
    changePwSuccess:      "✅ تم تغيير كلمة المرور بنجاح.",
    changePwWrongOld:     "كلمة المرور الحالية غير صحيحة.",
    changePwMismatch:     "كلمتا المرور الجديدتان غير متطابقتين.",
    changePwEmpty:        "الرجاء ملء جميع الحقول.",

    // Header / user bar
    changePwProcessing:   "جارٍ التغيير...",
    welcome:            "مرحباً،",
    logoutBtn:          "تسجيل الخروج",
    logoutConfirm:      "هل تريد تسجيل الخروج؟ يمكنك الدخول مجدداً في أي وقت.",
    logoutTitle:        "تأكيد تسجيل الخروج",
    logoutSubtitle:     "سيتم إنهاء الجلسة الحالية",
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
    searchPlaceholder:  "🔍 بحث في المدد المحفوظة...",
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
    copyBtn:            "📋 نسخ",
    notifBtnOn:         "🔔 التذكيرات: تشغيل",
    notifBtnOff:        "🔕 التذكيرات: إيقاف",
    notifPermDenied:    "⚠️ الإشعارات محجوبة — افتح إعدادات المتصفح للسماح بها",
    notifReminderTitle: "عداد الأيام — تذكير",
    notifBodyDays:      "تبقى {n} يوم على: {name}",
    notifBodyToday:     "اليوم هو: {name}",
    ndBarLabel:         "⚠️ مواعيد قريبة:",
    copiedBtn:          "✅ تم النسخ",
    rememberMe:         "تذكر اسم المستخدم وكلمة المرور",
    deleteConfirm:      "هل أنت متأكد من حذف هذه المدة المحفوظة؟\nستُحفظ في سلة المحذوفات لمدة 30 يوماً ويمكنك استعادتها خلال هذه المدة.",
    deleteCardTitle:    "حذف البطاقة",
    cancelBtn:          "إلغاء",
    hiddenLabel:        "مخفي",
    notePrompt:         "اكتب الملاحظة للمدة الحالية:",
    noteTitle:          "إضافة ملاحظة",
    notePlaceholder:    "مثال: موعد المراجعة، بداية مشروع...",
    noteSaveBtn:        "حفظ",
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

    // Equivalent / total wording (used by main.js)
    equivWord:          "تعادل",
    ofWord:             "من أصل",
    gEraSuffix:         " م",
    yearsLabel:         (y) => (y === 1 ? "سنة" : y === 2 ? "سنتين" : y <= 10 ? `${y} سنوات` : `${y} سنة`),

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
    trashSelectAll:     "تحديد الكل",
    trashDeleteAllBtn:  "🗑 حذف الكل نهائياً",
    trashDeleteSelected:(n) => `🗑 حذف المحدد (${n}) نهائياً`,
    trashDeleteAllConfirm: "هل أنت متأكد من حذف جميع العناصر في السلة نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.",
    trashDeleteSelectedConfirm: (n) => `هل أنت متأكد من حذف ${n} عنصر محدد نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`,
    trashDeleting:      "جارٍ الحذف...",
    closeAria:          "إغلاق",

    // المشاركة
    shareBtn:           "🔗 مشاركة",
    shareModalTitle:    "🔗 مشاركة التطبيق",
    shareIntro:         "جرّب تطبيق",
    shareWebLabel:      "رابط الموقع:",
    shareApkLabel:      "رابط تحميل APK:",
    shareEmail:         "البريد الإلكتروني",
    shareSms:           "رسالة نصية",
    shareCopy:          "نسخ الروابط",
    shareCopied:        "✅ تم نسخ الروابط",
    shareCopyFailed:    "تعذّر النسخ، انسخ الروابط يدوياً",

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
    errUsernameTakenInApp: "Username already exists (registered in one of the apps)",
    errSignupFailed:    "Error creating account: ",
    hintPrefix:         "💡 Hint: ",
    noHintSet:          "No hint was saved for this account.",

    forgotPasswordLink:   "🔑 Forgot password?",
    forgotTitle:          "Reset Password",
    forgotSubtitle:       "Reveal your hint, then enter it to verify your identity",
    forgotShowHintBtn:    "Show hint",
    forgotHintVerifyLabel:"Enter your hint to verify",
    forgotNewPwLabel:     "New password",
    forgotSubmitBtn:      "Reset password",
    backToLoginBtn:       "← Back to sign in",
    forgotSuccess:        "✅ Password changed successfully. You can now sign in.",
    forgotUserNotFound:   "This user does not exist in this app.",
    forgotHintMismatch:   "The hint you entered is incorrect.",
    forgotEnterUsername:  "Please enter your username first.",
    forgotEnterAll:       "Please fill in all fields.",

    changePwBtn:          "🔑 Change Password",
    changePwModalTitle:   "Change Password",
    changePwOldLabel:     "Current password",
    changePwNewLabel:     "New password",
    changePwConfirmLabel: "Confirm new password",
    changePwSubmitBtn:    "Change",
    changePwCancelBtn:    "Cancel",
    changePwSuccess:      "✅ Password changed successfully.",
    changePwWrongOld:     "Current password is incorrect.",
    changePwMismatch:     "New passwords do not match.",
    changePwEmpty:        "Please fill in all fields.",

    changePwProcessing:   "Changing...",
    welcome:            "Hello,",
    logoutBtn:          "Log out",
    logoutConfirm:      "Do you want to log out? You can sign in again anytime.",
    logoutTitle:        "Confirm Logout",
    logoutSubtitle:     "Your current session will end",
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
    searchPlaceholder:  "🔍 Search saved entries...",
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
    copyBtn:            "📋 Copy",
    notifBtnOn:         "🔔 Reminders: ON",
    notifBtnOff:        "🔕 Reminders: OFF",
    notifPermDenied:    "⚠️ Notifications blocked — check browser settings",
    notifReminderTitle: "Days Counter — Reminder",
    notifBodyDays:      "{n} days left for: {name}",
    notifBodyToday:     "Due today: {name}",
    ndBarLabel:         "⚠️ Upcoming deadlines:",
    copiedBtn:          "✅ Copied",
    rememberMe:         "Remember username & password",
    deleteConfirm:      "Are you sure you want to delete this entry?\nIt will be kept in the trash for 30 days and can be restored during that period.",
    deleteCardTitle:    "Delete Card",
    cancelBtn:          "Cancel",
    hiddenLabel:        "Hidden",
    notePrompt:         "Enter a note for this entry:",
    noteTitle:          "Add Note",
    notePlaceholder:    "e.g. checkup date, project start...",
    noteSaveBtn:        "Save",
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

    // Equivalent / total wording (used by main.js)
    equivWord:          "Equivalent to",
    ofWord:             "out of",
    gEraSuffix:         "",
    yearsLabel:         (y) => (y === 1 ? "1 year" : `${y} years`),

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
    trashSelectAll:     "Select All",
    trashDeleteAllBtn:  "🗑 Delete All Permanently",
    trashDeleteSelected:(n) => `🗑 Delete Selected (${n}) Permanently`,
    trashDeleteAllConfirm: "Are you sure you want to permanently delete all items in the trash?\nThis cannot be undone.",
    trashDeleteSelectedConfirm: (n) => `Are you sure you want to permanently delete ${n} selected item(s)?\nThis cannot be undone.`,
    trashDeleting:      "Deleting...",
    closeAria:          "Close",

    // Share
    shareBtn:           "🔗 Share",
    shareModalTitle:    "🔗 Share the app",
    shareIntro:         "Try the app",
    shareWebLabel:      "Website link:",
    shareApkLabel:      "APK download link:",
    shareEmail:         "Email",
    shareSms:           "SMS",
    shareCopy:          "Copy links",
    shareCopied:        "✅ Links copied",
    shareCopyFailed:    "Copy failed, please copy manually",

    copyright:          "© mohsen",

    langToggle:         "ID",
    langToggleTitle:    "Beralih ke Bahasa Indonesia",
    themeToggleAria:    "Toggle color theme",
  },

  id: {
    pageTitle: "Penghitung Hari",

    authTitleLogin:     "Masuk",
    authTitleSignup:    "Buat Akun Baru",
    authSubtitleLogin:  "Masukkan nama pengguna dan kata sandi untuk melanjutkan",
    authSubtitleSignup: "Buat akun baru dengan petunjuk kata sandi",
    usernameLabel:      "Nama pengguna",
    passwordLabel:      "Kata sandi",
    hintLabel:          "Petunjuk kata sandi (ditampilkan jika lupa)",
    loginBtn:           "Masuk",
    signupBtn:          "Buat Akun",
    processingBtn:      "Memproses...",
    remindBtn:          "\ud83d\udd11 Pengingat: tampilkan petunjuk",
    noAccount:          "Belum punya akun?",
    haveAccount:        "Sudah punya akun?",
    goToSignup:         "Buat akun baru",
    goToLogin:          "Masuk",
    errEnterBoth:       "Silakan masukkan nama pengguna dan kata sandi.",
    errUserNotFound:    "Pengguna ini tidak ada. Anda dapat membuat akun baru.",
    errWrongPassword:   "Kata sandi salah.",
    errNeedHint:        "Silakan tambahkan petunjuk kata sandi.",
    errUsernameTaken:   "Nama pengguna sudah digunakan. Pilih yang lain.",
    errUsernameTakenInApp: "Nama pengguna sudah ada (terdaftar di salah satu aplikasi)",
    errSignupFailed:    "Terjadi kesalahan saat membuat akun: ",
    hintPrefix:         "\ud83d\udca1 Petunjuk: ",
    noHintSet:          "Tidak ada petunjuk yang disimpan untuk akun ini.",

    forgotPasswordLink:   "\ud83d\udd11 Lupa kata sandi?",
    forgotTitle:          "Atur Ulang Kata Sandi",
    forgotSubtitle:       "Tampilkan petunjuk Anda, lalu masukkan untuk memverifikasi identitas",
    forgotShowHintBtn:    "Tampilkan petunjuk",
    forgotHintVerifyLabel:"Masukkan petunjuk untuk verifikasi",
    forgotNewPwLabel:     "Kata sandi baru",
    forgotSubmitBtn:      "Atur ulang kata sandi",
    backToLoginBtn:       "\u2190 Kembali ke masuk",
    forgotSuccess:        "\u2705 Kata sandi berhasil diubah. Anda sekarang dapat masuk.",
    forgotUserNotFound:   "Pengguna ini tidak ada di aplikasi ini.",
    forgotHintMismatch:   "Petunjuk yang Anda masukkan salah.",
    forgotEnterUsername:  "Silakan masukkan nama pengguna Anda terlebih dahulu.",
    forgotEnterAll:       "Silakan isi semua kolom.",

    changePwBtn:          "\ud83d\udd11 Ubah Kata Sandi",
    changePwModalTitle:   "Ubah Kata Sandi",
    changePwOldLabel:     "Kata sandi saat ini",
    changePwNewLabel:     "Kata sandi baru",
    changePwConfirmLabel: "Konfirmasi kata sandi baru",
    changePwSubmitBtn:    "Ubah",
    changePwCancelBtn:    "Batal",
    changePwSuccess:      "\u2705 Kata sandi berhasil diubah.",
    changePwWrongOld:     "Kata sandi saat ini salah.",
    changePwMismatch:     "Kata sandi baru tidak cocok.",
    changePwEmpty:        "Silakan isi semua kolom.",

    changePwProcessing:   "Mengubah...",
    welcome:            "Halo,",
    logoutBtn:          "Keluar",
    logoutConfirm:      "Apakah Anda ingin keluar? Anda dapat masuk lagi kapan saja.",
    logoutTitle:        "Konfirmasi Keluar",
    logoutSubtitle:     "Sesi Anda saat ini akan berakhir",
    appTitle:           "Penghitung Hari",
    appSubtitle:        "Hitung jumlah hari antara dua tanggal atau sejak / sampai tanggal tertentu",

    selectDate:         "Pilih tanggal",
    modeSince:          "Sejak tanggal",
    modeUntil:          "Sampai tanggal",
    placeholderResult:  "Silakan pilih tanggal untuk melihat hasilnya",
    resultTitle:        "Hasil",
    reminderNote:       "Catatan: perhitungan hanya menggunakan hari penuh (tanpa pecahan jam).",

    savedTitle:         "Entri tersimpan",
    importanceLabel:    "Kepentingan",
    impNormal:          "Biasa",
    impImportant:       "Penting \u2b50",
    impVeryImportant:   "Sangat penting \u2b50\u2b50",
    saveEntryBtn:       "Simpan durasi saat ini",
    trashBtn:           "\ud83d\uddd1 Sampah",
    searchPlaceholder:  "\ud83d\udd0d Cari entri tersimpan...",
    filterByImportance: "Filter berdasarkan kepentingan:",
    filterAll:          "Semua",
    filterNormal:       "Biasa",
    filterImportant:    "Penting",
    filterVeryImportant:"Sangat penting",
    savedCount:         (n) => `Entri tersimpan: ${n}`,
    noSaved:            "Tidak ada entri tersimpan",
    showBtn:            "Tampilkan",
    hideBtn:            "Sembunyikan",
    deleteBtn:          "Hapus",
    copyBtn:            "\ud83d\udccb Salin",
    notifBtnOn:         "\ud83d\udd14 Pengingat: AKTIF",
    notifBtnOff:        "\ud83d\udd15 Pengingat: NONAKTIF",
    notifPermDenied:    "\u26a0\ufe0f Notifikasi diblokir \u2014 periksa pengaturan browser",
    notifReminderTitle: "Penghitung Hari \u2014 Pengingat",
    notifBodyDays:      "{n} hari lagi untuk: {name}",
    notifBodyToday:     "Jatuh tempo hari ini: {name}",
    ndBarLabel:         "\u26a0\ufe0f Tenggat mendatang:",
    copiedBtn:          "\u2705 Disalin",
    rememberMe:         "Ingat nama pengguna & kata sandi",
    deleteConfirm:      "Apakah Anda yakin ingin menghapus entri ini?\nEntri akan disimpan di sampah selama 30 hari dan dapat dipulihkan dalam periode tersebut.",
    deleteCardTitle:    "Hapus Kartu",
    cancelBtn:          "Batal",
    hiddenLabel:        "Tersembunyi",
    notePrompt:         "Masukkan catatan untuk entri ini:",
    noteTitle:          "Tambah Catatan",
    notePlaceholder:    "mis. tanggal pemeriksaan, mulai proyek...",
    noteSaveBtn:        "Simpan",
    calcFirst:          "Hitung durasi terlebih dahulu sebelum menyimpan.",

    verbSince:          "berlalu",
    verbUntil:          "tersisa",
    verbEnded:          "\u2728 Berakhir",
    verbToday:          "\ud83d\udd14 Hari ini",
    endsToday:          "Berakhir hari ini",
    todayWord:          "hari ini",
    dayUnit:            "hari",
    daysPassedSinceEnd: (n) => `${n} hari telah berlalu sejak acara berakhir`,
    equivalentPrefix:   "Setara dengan",
    yearUnit:           "tahun",
    monthUnit:          "bulan",
    and:                "dan",
    joinRemaining:      (days, target, today) => `${days} hari tersisa sampai ${target} (hari ini ${today}).`,
    joinSincePast:      (days, target, today) => `${days} hari telah berlalu sejak ${target} sampai hari ini (${today}).`,
    joinEnded:          (days, target, today) => `\ud83c\udf89 Acara pada ${target} berakhir ${days} hari yang lalu (hari ini ${today}).`,
    joinEndsToday:      (target, today) => `\u23f0 Acara berakhir hari ini: ${target} (hari ini ${today}).`,

    // Equivalent / total wording (used by main.js)
    equivWord:          "Setara dengan",
    ofWord:             "dari",
    gEraSuffix:         "",
    yearsLabel:         (y) => `${y} tahun`,

    trashTitle:         "\ud83d\uddd1 Sampah",
    trashNote:          "Item dihapus permanen 30 hari setelah dihapus.",
    trashLoading:       "Memuat...",
    trashEmpty:         "Sampah kosong",
    trashNoName:        "(tanpa nama)",
    trashDatePrefix:    "Tanggal: ",
    trashSeparator:     " \u2014 ",
    trashPermDelete:    (d, h) => `Dihapus permanen dalam: ${d} hari dan ${h} jam`,
    trashRestoreBtn:    "\u21ba Pulihkan",
    trashRestoring:     "Memulihkan...",
    trashSelectAll:     "Pilih Semua",
    trashDeleteAllBtn:  "\ud83d\uddd1 Hapus Semua Permanen",
    trashDeleteSelected:(n) => `\ud83d\uddd1 Hapus Terpilih (${n}) Permanen`,
    trashDeleteAllConfirm: "Apakah Anda yakin ingin menghapus permanen semua item di sampah?\nTindakan ini tidak dapat dibatalkan.",
    trashDeleteSelectedConfirm: (n) => `Apakah Anda yakin ingin menghapus permanen ${n} item terpilih?\nTindakan ini tidak dapat dibatalkan.`,
    trashDeleting:      "Menghapus...",
    closeAria:          "Tutup",

    // Share
    shareBtn:           "\ud83d\udd17 Bagikan",
    shareModalTitle:    "\ud83d\udd17 Bagikan aplikasi",
    shareIntro:         "Coba aplikasi",
    shareWebLabel:      "Tautan situs web:",
    shareApkLabel:      "Tautan unduh APK:",
    shareEmail:         "Email",
    shareSms:           "SMS",
    shareCopy:          "Salin tautan",
    shareCopied:        "\u2705 Tautan disalin",
    shareCopyFailed:    "Gagal menyalin, silakan salin manual",

    copyright:          "\u00a9 mohsen",

    langToggle:         "\u0639",
    langToggleTitle:    "\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    themeToggleAria:    "Ubah tema warna",
  },
};

// ترتيب تبديل اللغات: عربي ← إنجليزي ← إندونيسي ← عربي
const LANG_CYCLE = ["ar", "en", "id"];

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
    if (LANG_CYCLE.includes(saved)) {
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
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });

  // زرّا تبديل اللغة (الواجهة + شاشة الدخول) يعرضان اللغة التالية في الدورة
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = t("langToggle");
    langBtn.setAttribute("title", t("langToggleTitle"));
  }
  const langBtnAuth = document.getElementById("lang-toggle-auth");
  if (langBtnAuth) {
    langBtnAuth.textContent = t("langToggle");
    langBtnAuth.setAttribute("title", t("langToggleTitle"));
  }
}

// يُستخدم من main.js لتبديل اللغة
function setLanguage(lang) {
  currentLang = LANG_CYCLE.includes(lang) ? lang : "ar";
  persistLanguage(currentLang);
  applyLanguageToDOM();
  // إخطار بقية التطبيق لإعادة الرسم
  if (typeof onLanguageChanged === "function") {
    onLanguageChanged();
  }
}

function toggleLanguage() {
  const idx = LANG_CYCLE.indexOf(currentLang);
  const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
  setLanguage(next);
}
