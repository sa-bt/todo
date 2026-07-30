/* =======================================================
   مدیریت چرخه‌ی عمر و به‌روزرسانی Service Worker
   ======================================================= */

const UPDATE_EVENT = 'swUpdateAvailable'

// هر ۱۵ دقیقه یک‌بار وجود نسخه جدید بررسی می‌شود
const CHECK_INTERVAL = 15 * 60 * 1000

let registrationRef = null
let hadControllerAtStartup = false
let reloading = false
let watchersStarted = false

export function getSwRegistration() {
  return registrationRef
}

/**
 * اطلاع‌رسانی به UI که نسخه جدید آماده‌ی فعال‌سازی است
 */
function announceUpdate(worker) {
  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT, {
      detail: { newWorker: worker, registration: registrationRef },
    })
  )
}

/**
 * بررسی دستی وجود نسخه جدید روی سرور
 */
export async function checkForUpdate() {
  if (!registrationRef) return
  try {
    await registrationRef.update()
  } catch (error) {
    // آفلاین بودن یا خطای شبکه نباید چیزی را بشکند
    console.debug('SW update check failed:', error)
  }
}

/**
 * فعال‌سازی نسخه جدید؛ رفرش صفحه با رویداد controllerchange انجام می‌شود
 * تا مطمئن شویم سرویس‌ورکر جدید واقعاً کنترل را گرفته است.
 */
export function applyUpdate(worker = null) {
  const target = worker || (registrationRef && registrationRef.waiting)

  if (!target) {
    forceReload()
    return
  }

  target.postMessage({ type: 'SKIP_WAITING', action: 'skipWaiting' })

  // اگر تا ۵ ثانیه controllerchange نرسید، خودمان رفرش می‌کنیم
  setTimeout(forceReload, 5000)
}

/**
 * پاکسازی کامل: حذف همه‌ی سرویس‌ورکرها و کش‌ها بدون نیاز به حذف PWA از گوشی
 */
export async function hardReset() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    }
  } catch (error) {
    console.error('Hard reset failed:', error)
  } finally {
    reloading = true
    // پارامتر یکبارمصرف تا سند تازه از شبکه بیاید و HTTP cache دور زده شود
    const separator = window.location.search ? '&' : '?'
    window.location.replace(`${window.location.pathname}${window.location.search}${separator}fresh=${Date.now()}`)
  }
}

function forceReload() {
  if (reloading) return
  reloading = true
  window.location.reload()
}

function startUpdateWatchers() {
  if (watchersStarted) return
  watchersStarted = true

  // مهم‌ترین بخش برای PWA نصب‌شده: هر بار که اپ از بک‌گراند برمی‌گردد
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })

  window.addEventListener('focus', checkForUpdate)
  window.addEventListener('online', checkForUpdate)
  setInterval(checkForUpdate, CHECK_INTERVAL)
}

export async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return null

  hadControllerAtStartup = !!navigator.serviceWorker.controller

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // خود فایل sw.js هرگز از HTTP cache خوانده نشود
      updateViaCache: 'none',
    })

    registrationRef = registration
    console.log('✅ Service Worker registered with scope:', registration.scope)

    // نسخه‌ای که از نشست قبلی در حالت waiting مانده هم باید اعلام شود
    if (registration.waiting && hadControllerAtStartup) {
      announceUpdate(registration.waiting)
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        // فقط وقتی کنترلر قبلی وجود داشته، این یک «به‌روزرسانی» است نه نصب اولیه
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 New version installed and waiting for activation.')
          announceUpdate(newWorker)
        }
      })
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // در نصب اولیه کنترلر عوض می‌شود ولی نیازی به رفرش نیست
      if (!hadControllerAtStartup) {
        hadControllerAtStartup = true
        return
      }
      forceReload()
    })

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'HARD_RESET_DONE') forceReload()
    })

    startUpdateWatchers()
    checkForUpdate()

    return registration
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return null
  }
}

// دریچه‌ی اضطراری از کنسول مرورگر: __todoAppReset()
if (typeof window !== 'undefined') {
  window.__todoAppReset = hardReset
}
