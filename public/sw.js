/* =======================================================
   Service Worker for Todo WebPush Notifications (RTL)
   ======================================================= */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/**
 * Push event handler
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

  // 🔹 اضافه کردن جهت راست‌به‌چپ در همین‌جا (نه در بک‌اند)
  // U+202B → شروع راست‌به‌چپ  |  U+202C → پایان راست‌به‌چپ
  const rtlBody = '\u202B' + body + '\u202C';
  const rtlTitle = '\u202B' + title + '\u202C';

  const options = {
    body: rtlBody,
    icon: payload.icon || '/icons/notification.png',
    badge: payload.badge || '/icons/notification.png',
    vibrate: [100, 50, 100],
    data: { url },
    dir: 'rtl',
    lang: 'fa-IR',
    actions: payload.actions || [{ action: 'open', title: 'باز کردن' }],
    tag: payload.tag || 'todo-webpush',
    renotify: !!payload.renotify,
    requireInteraction: false
  };

  // نمایش نوتیف
  event.waitUntil(
    self.registration.showNotification(rtlTitle, options)
  );
});

/**
 * Click event handler
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

  // کلیک ساده روی نوتیف
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
    // اگر تب فعلاً بازه، فقط فوکوس کن
    if (client.url === url && 'focus' in client) {
      return client.focus();
    }
  }
  // در غیر این صورت تب جدید باز کن
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
      applicationServerKey: null, // TODO: add VAPID public key if needed
    });
    // اینجا می‌تونی newSub رو با fetch به بک‌اند POST کنی تا endpoint جدید ذخیره بشه
  } catch (e) {
    console.error('Push subscription change error:', e);
  }
});
