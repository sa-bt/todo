const DEFAULT_ADMIN_HOST = 'admin.sa-bt.ir'

/*
 * همان `start_url` در `public/admin-manifest.webmanifest`؛ نشانی‌ای که پنل
 * نصب‌شده با آن بالا می‌آید.
 *
 * اسلش پایانی تزئینی نیست: `scope` پنل «/admin/» است و طبق مشخصات manifest اگر
 * `start_url` داخل `scope` نباشد، مرورگر `scope` را نادیده می‌گیرد و آن را به
 * پوشه‌ی `start_url` یعنی «/» برمی‌گرداند. «/admin» با «/admin/» شروع نمی‌شود،
 * پس دامنه‌ی پنل عملاً کل مبدأ می‌شد و دقیقاً با دامنه‌ی اپ کاربر یکی می‌افتاد.
 */
const ADMIN_START_PATH = '/admin/'

export function isAdminHost(hostname = globalThis.location?.hostname || '') {
  const configuredHost = String(import.meta.env.VITE_ADMIN_HOST || DEFAULT_ADMIN_HOST)
    .trim()
    .toLowerCase()

  return String(hostname).trim().toLowerCase() === configuredHost
}

/**
 * نشانی ورود به پنل مدیریت برای پیوندهای بیرون از خود پنل.
 *
 * تا وقتی هر دو اپ روی یک مبدأ هستند، `scope` اپ کاربر (`/`) مسیر `/admin/` را
 * هم در بر می‌گیرد و مرورگر می‌تواند همین پیوند را به اپ کاربرِ نصب‌شده بسپارد.
 * با تنظیم `VITE_ADMIN_HOST` پنل روی مبدأ خودش قرار می‌گیرد و این ابهام از بین
 * می‌رود؛ کانفیگ آماده‌اش `deploy/nginx/todo-admin.conf` است.
 *
 * برخلاف `isAdminHost`، اینجا عمداً از مقدار پیش‌فرض استفاده نمی‌شود: مقدار
 * پیش‌فرض روی localhost یعنی فرستادن توسعه‌دهنده به پنل سرور اصلی.
 */
export function adminAppUrl(location = globalThis.location) {
  const configuredHost = String(import.meta.env.VITE_ADMIN_HOST || '')
    .trim()
    .toLowerCase()
  const currentHost = String(location?.hostname || '')
    .trim()
    .toLowerCase()

  if (!configuredHost || configuredHost === currentHost) {
    return ADMIN_START_PATH
  }

  const protocol = location?.protocol === 'http:' ? 'http:' : 'https:'

  return `${protocol}//${configuredHost}${ADMIN_START_PATH}`
}

export function isStandaloneApp() {
  const win = globalThis.window

  if (!win) return false

  return (
    win.matchMedia?.('(display-mode: standalone)').matches === true ||
    win.navigator?.standalone === true
  )
}
