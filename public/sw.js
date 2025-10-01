// public/sw.js

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    // اگر JSON نبود، بیخیال
  }

  const title = payload.title || 'پیام جدید';
  const url   = payload.url || (payload.data && payload.data.url) || '/';

  const options = {
    body:   payload.body || 'مشاهده کنید',
    icon:   payload.icon || '/pwa-192x192.png',
    badge:  payload.badge || '/pwa-192x192.png',
    vibrate: payload.vibrate || [100, 50, 100],
    // همیشه یک آبجکت نگه می‌داریم تا در notificationclick به شکل ثابت بخونیم
    data:   { url },
    actions: payload.actions || [{ action: 'open', title: 'باز کردن' }],
    // اختیاری: tag/renotify برای جلوگیری از اسپم چند نوتیف مشابه
    tag: payload.tag || undefined,
    renotify: Boolean(payload.renotify) || false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';

  // اگر اکشن مشخص شده:
  if (event.action === 'open') {
    event.waitUntil(openOrFocus(url));
    return;
  }

  // کلیک ساده روی نوتیف
  event.waitUntil(openOrFocus(url));
});

async function openOrFocus(url) {
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    if (client.url === url && 'focus' in client) return client.focus();
  }
  if (clients.openWindow) return clients.openWindow(url);
}

// اختیاری: اگر کلید VAPID عوض شد، مرورگر بعضی وقت‌ها این ایونت رو می‌فرسته
self.addEventListener('pushsubscriptionchange', async (event) => {
  try {
    const reg = await self.registration;
    const newSub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: /* TODO: کلید پابلیک base64 به Uint8Array */ null });
    // اینجا می‌تونی newSub رو با fetch به بک‌اند POST کنی تا endpoint جدید ذخیره بشه
  } catch (_) {}
});
