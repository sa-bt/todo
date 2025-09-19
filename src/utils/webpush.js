import api from '@/plugins/axios'

// درخواست اجازه نوتیفیکیشن
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    return permission // "granted" | "denied" | "default"
  } catch (err) {
    console.error('خطا در گرفتن permission:', err)
    return 'denied'
  }
}

// ثبت subscription در سرور با اعتبارسنجی
export async function registerWebPush() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('ServiceWorker پشتیبانی نمی‌شود.')
      return
    }

    const registration = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_PUSH_PUBLIC_KEY

    if (!vapidKey) {
      console.error('❌ VAPID KEY خالی است، لطفا .env را بررسی کنید')
      return
    }

    // گرفتن subscription از pushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    // ابتدا به JSON تبدیل کن
const subscriptionJson = subscription.toJSON()

// اعتبارسنجی
if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
  console.error('❌ Subscription ناقص است، ارسال نمی‌شود', subscriptionJson)
  return
}

// ارسال به سرور
await api.post('/save-subscription', { subscription: subscriptionJson })
    console.log('🔔 Web Push ثبت شد:', subscription)
  } catch (err) {
    console.error('خطا در registerWebPush:', err)
  }
}

// تبدیل Base64 به Uint8Array برای VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
