/* =======================================================
   Service Worker for Todo WebPush Notifications (RTL)
   ======================================================= */

// 🌟 تزریق خودکار لیست فایل‌های بیلد شده توسط Vite
// مقدار این متغیر در زمان بیلد توسط پلاگین VitePWA پر می‌شود
const precachedAssets = self.__WB_MANIFEST || [];

// استفاده از BUILD_HASH تزریقی از Vite برای جلوگیری از تداخل کش
const BUILD_HASH = self.BUILD_HASH || Date.now().toString();
const CACHE_STATIC_ASSETS = 'todo-app-assets-v' + BUILD_HASH;

// فایل‌های پایه که همیشه باید در کش باشند
const customUrlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

/**
 * رویداد Install: ذخیره فایل‌ها در کش
 */
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_STATIC_ASSETS)
            .then((cache) => {
                console.log('Installing new SW version:', BUILD_HASH);

                // کش کردن آدرس‌های دستی
                cache.addAll(customUrlsToCache);

                // کش کردن فایل‌های بیلد شده (index.html, JS, CSS و غیره)
                const urlsFromManifest = precachedAssets.map(asset =>
                    typeof asset === 'string' ? asset : asset.url
                );
                return cache.addAll(urlsFromManifest.filter(url => url));
            }).catch(err => console.warn('Install Cache Warning:', err))
    );
});

/**
 * رویداد Activate: حذف کش‌های قدیمی
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // اگر نام کش با پیشوند ما شروع می‌شود اما با ورژن فعلی متفاوت است، حذفش کن
                    if (cacheName.startsWith('todo-app-assets-v') && cacheName !== CACHE_STATIC_ASSETS) {
                        console.log('Deleting outdated cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * رویداد Fetch: استراتژی Cache-First برای سرعت بیشتر
 */
self.addEventListener('fetch', (event) => {
    // اجازه بده درخواست‌های API مستقیماً به شبکه بروند
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

/**
 * رویداد Push: مدیریت اعلان‌ها با پشتیبانی کامل از RTL و فارسی
 */
/**
 * رویداد Push: مدیریت اعلان‌ها با پشتیبانی کامل از RTL و فارسی
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received!', event)

  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
    console.log('📦 Push payload:', payload)
  } catch (e) {
    console.error('Push payload parse error:', e)
    payload = {
      title: 'اعلان جدید',
      body: event.data ? event.data.text() : '',
      data: {},
    }
  }

  const data = payload.data || {}

  const title = payload.title || 'اعلان جدید'
  const body = payload.body || 'مشاهده کنید'
  const url = payload.url || data.url || '/'
  const icon = payload.icon || '/pwa-192x192.png'
  const badge = payload.badge || '/pwa-180x180.png'
  const tag = payload.tag || data.tag || 'todo-webpush'
  const type = data.type || payload.type || 'generic'

  const rtlTitle = formatNotificationText(title)
  const rtlBody = formatNotificationText(body)

  const normalizedPayload = {
    __kind: 'webpush',
    id: data.notification_id || payload.id || null,
    notification_id: data.notification_id || payload.id || null,
    persisted: data.persisted !== false,
    title,
    body,
    url,
    icon,
    tag,
    type,
    meta: data,
    time: new Date().toISOString(),
  }

  const options = {
    body: rtlBody,
    icon,
    badge,
    vibrate: [100, 50, 100],
    data: {
      url,
      ...data,
      __kind: 'webpush',
      notification_id: normalizedPayload.notification_id,
    },
    dir: 'rtl',
    lang: 'fa-IR',
    actions: payload.actions || [{ action: 'open', title: 'باز کردن' }],
    tag,
    renotify: !!payload.renotify,
    requireInteraction: false,
  }

  event.waitUntil(
    Promise.all([
      notifyOpenClients(normalizedPayload),
      self.registration.showNotification(rtlTitle, options),
    ])
  )
})

async function notifyOpenClients(payload) {
  const allClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  for (const client of allClients) {
    client.postMessage(payload)
  }
}

function formatNotificationText(text = '') {
  if (!text) return ''

  const value = String(text).trim()
  const hasPersian = /[\u0600-\u06FF]/.test(value)

  if (!hasPersian) {
    return `\u2066${value}\u2069`
  }

  return `\u202B${value}\u202C`
}

/**
 * رویداد Notification Click: مدیریت کلیک روی نوتیفیکیشن
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(openOrFocus(url));
});

/**
 * پیدا کردن تب بازِ مرتبط یا باز کردن تب جدید
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
 * مدیریت پیام‌های SKIP_WAITING برای آپدیت فوری سرویس ورکر
 */
self.addEventListener('message', (event) => {
  if (event.data && (event.data.action === 'skipWaiting' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
    self.clients.claim();
  }
});
