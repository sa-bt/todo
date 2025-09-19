// public/sw.js

self.addEventListener('push', function(event) {
  let data = { title: 'پیام جدید', body: 'مشاهده کنید', url: '/' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      console.error('Error parsing push data', e)
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png', // می‌تونی آیکون پروژه خودت بذاری
    badge: '/pwa-192x192.png',
    data: data.url,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'باز کردن' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const urlToOpen = event.notification.data || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // اگر تب باز بود، روی همون تمرکز کن
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus()
      }
      // وگرنه تب جدید باز کن
      if (clients.openWindow) return clients.openWindow(urlToOpen)
    })
  )
})
