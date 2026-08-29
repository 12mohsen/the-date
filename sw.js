// ============================================================
//  sw.js — Service Worker لتطبيق «عداد الأيام»
// ============================================================
//  الهدف: تشغيل التطبيق بدون إنترنت + إمكانية التثبيت.
//
//  الاستراتيجية:
//   • ملفات التطبيق (نفس النطاق) → الشبكة أولاً ثم الذاكرة
//     (أحدث نسخة دائماً عند وجود إنترنت، وتعمل كاملة بدونه)
//   • مكتبة supabase من الـ CDN → الذاكرة أولاً ثم الشبكة
//   • طلبات قاعدة البيانات (supabase.co) → لا تُعترض إطلاقاً
//
//  ★ عند تعديل ملفات التطبيق ارفع رقم CACHE_VERSION
//    ليُحذف المخزون القديم تلقائياً عند فتح التطبيق.
// ============================================================

const CACHE_VERSION = "days-counter-v1";
const CDN_CACHE     = "days-counter-cdn-v1";

// ملفات التطبيق الأساسية (App Shell)
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./i18n.js",
  "./confirm-dialog.js",
  "./auth-shared.js",
  "./supabase.js",
  "./main.js",
  "./hijri-date.js",
  "./clock.js",
  "./biometric.js",
  "./pwa.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

// مكتبة supabase الخارجية — نخزّنها أيضاً ليعمل التطبيق بدون إنترنت
const CDN_ASSETS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js",
];

// ──────────────────────────────────────────────
//  التثبيت: تخزين ملفات التطبيق
// ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // مكتبات خارجية (لا تُفشل التثبيت إن تعذّر تحميلها)
      try {
        const cdnCache = await caches.open(CDN_CACHE);
        await Promise.all(
          CDN_ASSETS.map((url) =>
            cdnCache.add(new Request(url, { mode: "cors" })).catch(() =>
              cdnCache.add(new Request(url, { mode: "no-cors" })).catch(() => {})
            )
          )
        );
      } catch (e) { /* تجاهل */ }
      // نخزّن كل ملف على حدة حتى لا يُفشل ملفٌ مفقود العملية كلها
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch((err) => {
            console.warn("[SW] تعذّر تخزين:", url, err && err.message);
          })
        )
      );
      self.skipWaiting();
    })
  );
});

// ──────────────────────────────────────────────
//  التفعيل: حذف النسخ القديمة من المخزون
// ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== CDN_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ──────────────────────────────────────────────
//  الاعتراض
// ──────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // لا نتعامل إلا مع طلبات GET
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // امتدادات المتصفح وغير http(s)
  if (!url.protocol.startsWith("http")) return;

  // ★ طلبات قاعدة البيانات والمصادقة تمرّ مباشرة بلا تخزين
  if (url.hostname.endsWith("supabase.co")) return;

  const sameOrigin = url.origin === self.location.origin;

  // مكتبات الـ CDN: الذاكرة أولاً (نادراً ما تتغير)
  if (!sameOrigin) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => {
            // نخزّن حتى الردود المبهمة (opaque) — تكفي لإعادة تشغيل السكربت
            const copy = res.clone();
            caches.open(CDN_CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => hit);
      })
    );
    return;
  }

  // ملفات التطبيق: الشبكة أولاً ثم الذاكرة
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // تنقّل بدون إنترنت وبدون نسخة مخزّنة → نعيد الصفحة الرئيسية
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return Response.error();
      })
  );
});

// تحديث فوري عند طلب الصفحة
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
