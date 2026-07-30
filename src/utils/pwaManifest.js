const USER_THEME_COLOR = '#2563EB'
const ADMIN_THEME_COLOR = '#0f172a'

/**
 * فقط رنگ نوار مرورگر را با مسیر جاری هم‌راستا می‌کند.
 *
 * ⚠️ آگاهانه تگ <link rel="manifest"> عوض نمی‌شود. هویت یک PWA نصب‌شده
 * (`id` و `scope`) به manifest همان سندی گره خورده که نصب از آن انجام شده است؛
 * جابه‌جا کردن آن در زمان اجرا باعث می‌شود بررسی به‌روزرسانی manifest توسط
 * مرورگر به نتیجه نرسد و نام و آیکون اپ نصب‌شده روی نسخه‌ی قدیمی بماند.
 *
 * هر اپ سند ورودی مستقل خودش را دارد: `index.html` برای اپ کاربر و
 * `admin.html` برای پنل مدیریت (سرور مسیرهای /admin را به آن می‌دهد).
 */
export function syncPwaManifest(pathname = window.location.pathname) {
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const themeColor = isAdminPath ? ADMIN_THEME_COLOR : USER_THEME_COLOR

  let themeMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeMeta) {
    themeMeta = document.createElement('meta')
    themeMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeMeta)
  }
  themeMeta.setAttribute('content', themeColor)
}
