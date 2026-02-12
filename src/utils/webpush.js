import api from '@/plugins/axios'

// ✅ درخواست اجازه‌ی نوتیف
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    return permission // "granted" | "denied" | "default"
  } catch (err) {
    console.error('⚠️ خطا در گرفتن permission:', err)
    return 'denied'
  }
}

// ✅ ثبت Web Push - با پذیرش پارامتر registration (اختیاری)
export async function registerWebPush(providedRegistration = null) {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('❌ مرورگر از ServiceWorker پشتیبانی نمی‌کند.')
      return
    }

    // مرحله ۱: اجازه نوتیف
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.warn('🔕 دسترسی به نوتیف داده نشده.')
      return
    }

    // مرحله ۲: آماده‌سازی Service Worker
    // از providedRegistration استفاده کن اگر موجود باشه
    const registration = providedRegistration || await navigator.serviceWorker.ready

    // مرحله ۳: بررسی اینکه آیا کاربر قبلاً subscribe شده یا نه
    const existingSub = await registration.pushManager.getSubscription()
    if (existingSub) {
      console.log('✅ کاربر از قبل Web Push فعال دارد. ارسال مجدد به سرور...')
      const subscriptionJson = existingSub.toJSON()
      await api.post('/save-subscription', { subscription: subscriptionJson })
      return existingSub
    }

    // مرحله ۴: ایجاد subscription جدید
    const vapidKey = import.meta.env.VITE_PUSH_PUBLIC_KEY
    if (!vapidKey) {
      console.error('❌ VITE_PUSH_PUBLIC_KEY خالی است. لطفاً .env را بررسی کنید.')
      return
    }

    console.log('🔑 VAPID Key:', vapidKey.substring(0, 20) + '...')

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    // مرحله ۵: آماده‌سازی و ارسال به سرور
    const subscriptionJson = subscription.toJSON()
    if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
      console.error('❌ Subscription ناقص است، ارسال نمی‌شود:', subscriptionJson)
      return
    }

    await api.post('/save-subscription', { subscription: subscriptionJson })
    console.log('🔔 Web Push در سرور ثبت شد ✅', subscriptionJson)
    return subscription
  } catch (err) {
    console.error('⚠️ خطا در registerWebPush:', err)
  }
}

// ابزار کمکی برای تبدیل Base64 به Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
