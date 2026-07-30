/* =======================================================
   Service Worker for Todo WebPush Notifications (RTL)
   ======================================================= */

// 🌟 تزریق خودکار لیست فایل‌های بیلد شده توسط Vite
// مقدار این متغیر در زمان بیلد توسط پلاگین VitePWA پر می‌شود
const precachedAssets = self.__WB_MANIFEST || [];

// استفاده از BUILD_HASH تزریقی از Vite برای جلوگیری از تداخل کش
const BUILD_HASH = self.BUILD_HASH || Date.now().toString();
const CACHE_PREFIX = 'todo-app-assets-v';
const CACHE_STATIC_ASSETS = CACHE_PREFIX + BUILD_HASH;

// فایل‌های پایه که همیشه باید در کش باشند
const customUrlsToCache = [
  '/',
  '/admin.html',
  '/manifest.webmanifest',
  '/admin-manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-180x180.png',
  '/admin-pwa-192x192.png',
  '/admin-pwa-512x512.png',
];

/**
 * ساخت لیست نهایی آدرس‌ها برای precache
 */
function collectPrecacheUrls() {
    const urls = new Set(customUrlsToCache);

    for (const asset of precachedAssets) {
        const rawUrl = typeof asset === 'string' ? asset : asset && asset.url;
        if (!rawUrl) continue;
        // آدرس‌های manifest نسبی هستند و باید مطلق شوند
        urls.add(new URL(rawUrl, self.registration.scope).pathname);
    }

    return [...urls];
}

/**
 * رویداد Install: ذخیره فایل‌ها در کش
 * نکته: عمداً skipWaiting صدا زده نمی‌شود تا صفحه‌ی باز با نسخه‌ی قدیمی نشکند.
 * فعال‌سازی با تأیید کاربر (پیام SKIP_WAITING) انجام می‌شود.
 */
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        console.log('Installing new SW version:', BUILD_HASH);
        const cache = await caches.open(CACHE_STATIC_ASSETS);

        await Promise.all(collectPrecacheUrls().map(async (url) => {
            try {
                // cache: 'reload' یعنی حتماً از شبکه بخوان، نه از HTTP cache مرورگر
                const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
                if (response && response.ok) {
                    await cache.put(url, response);
                }
            } catch (error) {
                console.warn('Precache skipped:', url, error);
            }
        }));
    })());
});

/**
 * رویداد Activate: حذف کش‌های قدیمی و گرفتن کنترل صفحه‌ها
 */
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();

        await Promise.all(cacheNames.map((cacheName) => {
            // اگر نام کش با پیشوند ما شروع می‌شود اما با ورژن فعلی متفاوت است، حذفش کن
            if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_STATIC_ASSETS) {
                console.log('Deleting outdated cache:', cacheName);
                return caches.delete(cacheName);
            }
            return null;
        }));

        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || request.url.includes('/api/') || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate' || url.pathname.endsWith('.webmanifest')) {
        // هر اپ باید به سند ورودی خودش برگردد تا manifest اشتباه سرو نشود
        const isAdminPath = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
        event.respondWith(networkFirst(request, isAdminPath ? '/admin.html' : '/'));
        return;
    }

    event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallbackUrl = null) {
    const cache = await caches.open(CACHE_STATIC_ASSETS);

    try {
        const response = await fetch(request, { cache: 'no-store' });

        if (response && response.ok) {
            await cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        if (fallbackUrl) {
            const fallbackResponse = (await cache.match(fallbackUrl)) || (await cache.match('/index.html'));
            if (fallbackResponse) {
                return fallbackResponse;
            }
        }

        throw error;
    }
}

async function cacheFirst(request) {
    // فقط کش نسخه‌ی جاری خوانده می‌شود تا فایل نسخه‌های قبلی برگردانده نشود
    const cache = await caches.open(CACHE_STATIC_ASSETS);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);

    if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {});
    }

    return response;
}

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
 * و HARD_RESET برای پاکسازی کامل بدون حذف PWA از دستگاه
 */
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.action === 'skipWaiting' || data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'GET_VERSION') {
    event.source && event.source.postMessage({ type: 'SW_VERSION', version: BUILD_HASH });
    return;
  }

  if (data.type === 'HARD_RESET') {
    event.waitUntil((async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();

      const openClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of openClients) {
        client.postMessage({ type: 'HARD_RESET_DONE' });
      }
    })());
  }
});
