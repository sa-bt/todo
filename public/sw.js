/* =======================================================
   Service Worker for Todo WebPush Notifications (RTL)
   ======================================================= */

// 🌟 بخش اصلاح شده: استفاده از BUILD_HASH تزریقی از Vite
// اگر BUILD_HASH توسط ابزار بیلد تزریق نشد، از یک مقدار پیش‌فرض استفاده کند.
const BUILD_HASH = self.BUILD_HASH || Date.now(); 

// 💡 نام کش اکنون شامل Hash بیلد است تا Cache Busting خودکار انجام شود.
const CACHE_STATIC_ASSETS = 'todo-app-assets-v' + BUILD_HASH;

// ⚠️ این لیست را بر اساس فایل‌های خروجی بیلد خود تکمیل کنید.
const urlsToCache = [
  '/', 
  '/index.html', 
  // فایل‌های مهم JS/CSS خود را اینجا لیست کنید.
];

// =======================================================

self.addEventListener('install', (event) => {
    // 💡 مهم: skipWaiting در اینجا باعث می‌شود Worker جدید بلافاصله کنترل صفحه را بگیرد.
    self.skipWaiting();
    
    // کش کردن فایل‌های استاتیک اپلیکیشن
    event.waitUntil(
        caches.open(CACHE_STATIC_ASSETS)
            .then((cache) => {
                console.log('Opened cache for static assets:', CACHE_STATIC_ASSETS);
                return cache.addAll(urlsToCache).catch((err) => {
                    console.warn('Failed to cache some assets (this may be normal if assets are hash-named):', err);
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    // 🌟 بخش جدید: حذف کش‌های قدیمی (Cache Busting)
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 💡 حذف تمام کش‌هایی که با نام‌های قدیمی مطابقت دارند (بدون Hash فعلی)
                    if (cacheName.startsWith('todo-app-assets-v') && cacheName !== CACHE_STATIC_ASSETS) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        // 💡 گرفتن کنترل صفحه بلافاصله پس از فعال‌سازی
        .then(() => self.clients.claim()) 
    );
});

/**
 * Fetch event handler - برای برگرداندن محتوا از کش یا شبکه
 */
self.addEventListener('fetch', (event) => {
    // استراتژی Cache First - ابتدا کش، اگر نبود شبکه
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});


/**
 * Push event handler - مدیریت اعلان‌های دریافتی
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Push payload parse error:', e);
  }

  const title = payload.title || 'اعلان جدید';
  const body = payload.body || 'مشاهده کنید';
  const url = payload.url || (payload.data && payload.data.url) || '/';

  // 🔹 اضافه کردن جهت راست‌به‌چپ
  const rtlBody = '\u202B' + body + '\u202C';
  const rtlTitle = '\u202B' + title + '\u202C';

  const options = {
    body: rtlBody,
    // ⚠️ ارجاع به آیکون‌ها حذف شد تا ریسک 404 در Production از بین برود
    vibrate: [100, 50, 100],
    data: { url },
    dir: 'rtl',
    lang: 'fa-IR',
    actions: payload.actions || [{ action: 'open', title: 'باز کردن' }],
    tag: payload.tag || 'todo-webpush',
    renotify: !!payload.renotify,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(rtlTitle, options)
  );
});

/**
 * Click event handler - مدیریت کلیک روی اعلان
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) ||
    '/';

  if (event.action === 'open') {
    event.waitUntil(openOrFocus(url));
    return;
  }

  event.waitUntil(openOrFocus(url));
});

/**
 * Opens existing tab or creates a new one
 */
async function openOrFocus(url) {
  const allClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of allClients) {
    if (client.url.includes(url) && 'focus' in client) { 
      return client.focus();
    }
  }
  if (clients.openWindow) {
    return clients.openWindow(url);
  }
}

/**
 * Optional: handle push subscription refresh
 */
self.addEventListener('pushsubscriptionchange', async (event) => {
  try {
    const reg = await self.registration;
    const newSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null, // ⚠️ باید با VAPID public key جایگزین شود
    });
    // TODO: اینجا newSub رو با fetch به بک‌اند POST کنی
  } catch (e) {
    console.error('Push subscription change error:', e);
  }
});


/**
 * 🌟 بخش جدید: مدیریت پیام skipWaiting 🌟
 * به Worker جدید اجازه می‌دهد تا کنترل صفحه را بلافاصله در دست بگیرد.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('Skipping waiting phase via client message...');
    
    // اجرای متد skipWaiting()
    self.skipWaiting();
    
    // گرفتن کنترل همه تب‌های باز
    self.clients.claim();
  }
});