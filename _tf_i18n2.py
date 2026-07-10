# -*- coding: utf-8 -*-
p='i18n.js'
s=open(p,encoding='utf-8').read()
def rep(old,new):
    global s
    assert s.count(old)==1, f"count={s.count(old)} for: {old[:40]!r}"
    s=s.replace(old,new)

ID_DICT='''    langToggle:         "ID",
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
    remindBtn:          "\\ud83d\\udd11 Pengingat: tampilkan petunjuk",
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
    hintPrefix:         "\\ud83d\\udca1 Petunjuk: ",
    noHintSet:          "Tidak ada petunjuk yang disimpan untuk akun ini.",

    forgotPasswordLink:   "\\ud83d\\udd11 Lupa kata sandi?",
    forgotTitle:          "Atur Ulang Kata Sandi",
    forgotSubtitle:       "Tampilkan petunjuk Anda, lalu masukkan untuk memverifikasi identitas",
    forgotShowHintBtn:    "Tampilkan petunjuk",
    forgotHintVerifyLabel:"Masukkan petunjuk untuk verifikasi",
    forgotNewPwLabel:     "Kata sandi baru",
    forgotSubmitBtn:      "Atur ulang kata sandi",
    backToLoginBtn:       "\\u2190 Kembali ke masuk",
    forgotSuccess:        "\\u2705 Kata sandi berhasil diubah. Anda sekarang dapat masuk.",
    forgotUserNotFound:   "Pengguna ini tidak ada di aplikasi ini.",
    forgotHintMismatch:   "Petunjuk yang Anda masukkan salah.",
    forgotEnterUsername:  "Silakan masukkan nama pengguna Anda terlebih dahulu.",
    forgotEnterAll:       "Silakan isi semua kolom.",

    changePwBtn:          "\\ud83d\\udd11 Ubah Kata Sandi",
    changePwModalTitle:   "Ubah Kata Sandi",
    changePwOldLabel:     "Kata sandi saat ini",
    changePwNewLabel:     "Kata sandi baru",
    changePwConfirmLabel: "Konfirmasi kata sandi baru",
    changePwSubmitBtn:    "Ubah",
    changePwCancelBtn:    "Batal",
    changePwSuccess:      "\\u2705 Kata sandi berhasil diubah.",
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
    impImportant:       "Penting \\u2b50",
    impVeryImportant:   "Sangat penting \\u2b50\\u2b50",
    saveEntryBtn:       "Simpan durasi saat ini",
    trashBtn:           "\\ud83d\\uddd1 Sampah",
    searchPlaceholder:  "\\ud83d\\udd0d Cari entri tersimpan...",
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
    copyBtn:            "\\ud83d\\udccb Salin",
    notifBtnOn:         "\\ud83d\\udd14 Pengingat: AKTIF",
    notifBtnOff:        "\\ud83d\\udd15 Pengingat: NONAKTIF",
    notifPermDenied:    "\\u26a0\\ufe0f Notifikasi diblokir \\u2014 periksa pengaturan browser",
    notifReminderTitle: "Penghitung Hari \\u2014 Pengingat",
    notifBodyDays:      "{n} hari lagi untuk: {name}",
    notifBodyToday:     "Jatuh tempo hari ini: {name}",
    ndBarLabel:         "\\u26a0\\ufe0f Tenggat mendatang:",
    copiedBtn:          "\\u2705 Disalin",
    rememberMe:         "Ingat nama pengguna & kata sandi",
    deleteConfirm:      "Apakah Anda yakin ingin menghapus entri ini?\\nEntri akan disimpan di sampah selama 30 hari dan dapat dipulihkan dalam periode tersebut.",
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
    verbEnded:          "\\u2728 Berakhir",
    verbToday:          "\\ud83d\\udd14 Hari ini",
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
    joinEnded:          (days, target, today) => `\\ud83c\\udf89 Acara pada ${target} berakhir ${days} hari yang lalu (hari ini ${today}).`,
    joinEndsToday:      (target, today) => `\\u23f0 Acara berakhir hari ini: ${target} (hari ini ${today}).`,

    // Equivalent / total wording (used by main.js)
    equivWord:          "Setara dengan",
    ofWord:             "dari",
    gEraSuffix:         "",
    yearsLabel:         (y) => `${y} tahun`,

    trashTitle:         "\\ud83d\\uddd1 Sampah",
    trashNote:          "Item dihapus permanen 30 hari setelah dihapus.",
    trashLoading:       "Memuat...",
    trashEmpty:         "Sampah kosong",
    trashNoName:        "(tanpa nama)",
    trashDatePrefix:    "Tanggal: ",
    trashSeparator:     " \\u2014 ",
    trashPermDelete:    (d, h) => `Dihapus permanen dalam: ${d} hari dan ${h} jam`,
    trashRestoreBtn:    "\\u21ba Pulihkan",
    trashRestoring:     "Memulihkan...",
    trashSelectAll:     "Pilih Semua",
    trashDeleteAllBtn:  "\\ud83d\\uddd1 Hapus Semua Permanen",
    trashDeleteSelected:(n) => `\\ud83d\\uddd1 Hapus Terpilih (${n}) Permanen`,
    trashDeleteAllConfirm: "Apakah Anda yakin ingin menghapus permanen semua item di sampah?\\nTindakan ini tidak dapat dibatalkan.",
    trashDeleteSelectedConfirm: (n) => `Apakah Anda yakin ingin menghapus permanen ${n} item terpilih?\\nTindakan ini tidak dapat dibatalkan.`,
    trashDeleting:      "Menghapus...",
    closeAria:          "Tutup",

    // Share
    shareBtn:           "\\ud83d\\udd17 Bagikan",
    shareModalTitle:    "\\ud83d\\udd17 Bagikan aplikasi",
    shareIntro:         "Coba aplikasi",
    shareWebLabel:      "Tautan situs web:",
    shareApkLabel:      "Tautan unduh APK:",
    shareEmail:         "Email",
    shareSms:           "SMS",
    shareCopy:          "Salin tautan",
    shareCopied:        "\\u2705 Tautan disalin",
    shareCopyFailed:    "Gagal menyalin, silakan salin manual",

    copyright:          "\\u00a9 mohsen",

    langToggle:         "\\u0639",
    langToggleTitle:    "\\u0627\\u0644\\u062a\\u0628\\u062f\\u064a\\u0644 \\u0625\\u0644\\u0649 \\u0627\\u0644\\u0639\\u0631\\u0628\\u064a\\u0629",
    themeToggleAria:    "Ubah tema warna",
  },
};'''

# 3) en langToggle -> ID + add id dict
rep(
'''    langToggle:         "ع",
    langToggleTitle:    "التبديل إلى العربية",
    themeToggleAria:    "Toggle color theme",
  },
};''', ID_DICT)

# 4) LANG_CYCLE
rep('let currentLang = "ar";',
'''// ترتيب تبديل اللغات: عربي ← إنجليزي ← إندونيسي ← عربي
const LANG_CYCLE = ["ar", "en", "id"];

let currentLang = "ar";''')

# 5) loadLanguage
rep('''    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "ar" || saved === "en") {
      currentLang = saved;
    }''',
'''    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (LANG_CYCLE.includes(saved)) {
      currentLang = saved;
    }''')

# 6) applyLanguageToDOM auth button
rep('''  // زر تبديل اللغة يعرض الرمز المعاكس
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = t("langToggle");
    langBtn.setAttribute("title", t("langToggleTitle"));
  }
}''',
'''  // زرّا تبديل اللغة (الواجهة + شاشة الدخول) يعرضان اللغة التالية في الدورة
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
}''')

# 7) setLanguage + toggleLanguage
rep('''function setLanguage(lang) {
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
}''',
'''function setLanguage(lang) {
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
}''')

open(p,'w',encoding='utf-8').write(s)
print("i18n all steps done")
