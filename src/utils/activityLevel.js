/*
 * سطح بازدهی و رنگ آن، در یک جا.
 *
 * قاعده اصلی: یک درصد، یک رنگ. ۵۷ درصد در روز، هفته، ماه و هدف باید دقیقاً یک
 * رنگ بگیرد. پس هیچ‌جای برنامه نباید رنگ سطح را خودش بسازد؛ همه از همین فایل و
 * استور `activityPalette` می‌گیرند.
 *
 * این فایل فقط منطق خالص است و هیچ حالتی نگه نمی‌دارد. حالت کاربر (رنگ‌ها و
 * دامنه‌هایی که خودش انتخاب کرده) در استور نگه‌داری می‌شود.
 *
 * ساختار یک پالت: آرایه‌ای از سطح‌ها، هر سطح `{ color, upTo }`.
 * `upTo` مرز بالای همان سطح است. مرز پایین، `upTo` سطح قبلی به‌اضافه یک است.
 * `upTo` آخرین سطح همیشه صد است.
 *
 * سطح صفر جزء پالت نیست: روز بدون تسک است، نه روز ضعیف. رنگش از تم می‌آید و
 * قابل تغییر نیست، چون معنایش «نبود داده» است نه «بازدهی کم».
 */

export const EMPTY_LEVEL_COLOR = 'var(--color-background-mute)'
export const EMPTY_LEVEL_LABEL_COLOR = 'var(--color-text-secondary)'

// کمتر از دو سطح یعنی رنگ‌بندی وجود ندارد. بیشتر از ده سطح، راهنما را ناخوانا
// می‌کند و اختلاف دو سطح مجاور هم برای چشم قابل تشخیص نمی‌ماند.
export const MIN_LEVELS = 2
export const MAX_LEVELS = 10

/*
 * پالت پیش‌فرض.
 *
 * همان هفت سطح قبلی است، با یک تفاوت: جای زرد و نارنجی عوض شد. نارنجی هشدار
 * بیشتری می‌دهد، پس به سطح پایین‌تر (۳۱ تا ۴۵) رسید و زرد به سطح بالاتر.
 */
export const DEFAULT_LEVELS = [
  { color: '#B91C1C', upTo: 20 },
  { color: '#DC2626', upTo: 30 },
  { color: '#F59E0B', upTo: 45 },
  { color: '#FCD34D', upTo: 55 },
  { color: '#86EFAC', upTo: 70 },
  { color: '#34D399', upTo: 85 },
  { color: '#059669', upTo: 100 },
]

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

export const isValidColor = value => typeof value === 'string' && HEX_PATTERN.test(value.trim())

export const cloneLevels = levels => levels.map(level => ({ color: level.color, upTo: level.upTo }))

/**
 * سطح یک بازه از روی درصد انجام‌شده.
 *
 * مقایسه با ضرب انجام می‌شود، نه با تقسیم. نسخه قبلی درصد را با تقسیم می‌ساخت و
 * روی مرزها به خطای اعشار می‌خورد: `(55 / 100) * 100` در جاوااسکریپت کمی بیشتر
 * از ۵۵ است، پس ۵۵ تسک از ۱۰۰ تسک سطح بالاتر می‌گرفت، در حالی که صفحه همان عدد
 * را «۵۵٪» نشان می‌داد. با ضرب، مقایسه دقیق است و رنگ با عدد نشان‌داده‌شده جور
 * درمی‌آید.
 */
export function levelOf(total, done, isFuture = false, levels = DEFAULT_LEVELS) {
  if (isFuture || !total) return 0

  for (let i = 0; i < levels.length - 1; i++) {
    if (done * 100 <= levels[i].upTo * total) return i + 1
  }

  return levels.length
}

/**
 * مرز پایین هر سطح. اولین سطح از صفر شروع می‌شود.
 */
export const lowerBoundOf = (levels, index) => (index === 0 ? 0 : levels[index - 1].upTo + 1)

/**
 * روشنایی نسبی رنگ، برای تصمیم‌گیری درباره رنگ متن روی آن.
 * فرمول استاندارد WCAG است.
 */
export function luminanceOf(color) {
  if (!isValidColor(color)) return 1

  const hex = color.trim().slice(1)
  const channels = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)

  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/*
 * وقتی رنگ‌ها دست کاربر است، نمی‌شود رنگ متن را از قبل نوشت. این دو تابع رنگ
 * متن را از خود رنگ حساب می‌کنند تا هر پالتی که کاربر بسازد خوانا بماند.
 */

/** رنگ متنی که *روی* رنگ سطح می‌نشیند (مثل درصد داخل خانه هفته). */
export const onColorOf = color => (luminanceOf(color) > 0.45 ? '#1f2937' : '#ffffff')

/**
 * رنگ متنی که *کنار* رنگ سطح روی پس‌زمینه صفحه می‌نشیند (مثل درصد زیر کارت ماه).
 *
 * رنگ روشن روی پس‌زمینه روشن خوانده نمی‌شود. آمیختن با رنگ متن تم، در تم روشن
 * تیره‌اش می‌کند و در تم تیره روشن‌ترش، پس در هر دو تم خوانا می‌ماند و ته‌رنگ
 * سطح هم حفظ می‌شود.
 */
export const textColorOf = color =>
  isValidColor(color) ? `color-mix(in srgb, ${color} 74%, var(--color-text))` : color

/**
 * اعتبارسنجی یک پالت. پیام خطا برمی‌گرداند، یا خالی اگر سالم بود.
 *
 * همین تابع هم برای ورودی کاربر در پنجره تنظیم استفاده می‌شود و هم برای داده‌ای
 * که از حافظه مرورگر خوانده می‌شود، تا داده دست‌کاری‌شده صفحه را نشکند.
 */
export function validateLevels(levels) {
  if (!Array.isArray(levels)) return 'ساختار رنگ‌بندی درست نیست.'

  if (levels.length < MIN_LEVELS) return 'دست‌کم دو سطح لازم است.'
  if (levels.length > MAX_LEVELS) return 'بیشتر از ده سطح پذیرفته نمی‌شود.'

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]

    if (!level || !isValidColor(level.color)) return 'رنگ‌ها باید کد شش‌رقمی معتبر باشند.'

    const isLast = i === levels.length - 1
    const upTo = Number(level.upTo)

    if (!Number.isInteger(upTo)) return 'مرز هر سطح باید عدد صحیح باشد.'

    if (isLast) {
      if (upTo !== 100) return 'مرز بالای آخرین سطح باید صد باشد.'
      continue
    }

    if (upTo < 1 || upTo > 99) return 'مرز هر سطح باید بین ۱ و ۹۹ باشد.'

    if (i > 0 && upTo <= levels[i - 1].upTo) return 'مرزها باید از کم به زیاد و بدون تکرار باشند.'
  }

  return ''
}

/**
 * پالت خوانده‌شده از حافظه را به شکل سالم درمی‌آورد.
 * اگر قابل تعمیر نبود، پیش‌فرض برمی‌گردد؛ چون نبود رنگ‌بندی بهتر از صفحه شکسته است.
 */
export function normalizeLevels(input) {
  if (!Array.isArray(input) || input.length < MIN_LEVELS) return cloneLevels(DEFAULT_LEVELS)

  const levels = input.slice(0, MAX_LEVELS).map(level => ({
    color: isValidColor(level?.color) ? level.color.trim().toLowerCase() : '#888888',
    upTo: Number.isFinite(Number(level?.upTo)) ? Math.round(Number(level.upTo)) : 100,
  }))

  levels[levels.length - 1].upTo = 100

  // مرز غیرصعودی را جلو می‌بریم تا ترتیب سطح‌ها معنی‌دار بماند.
  for (let i = 0; i < levels.length - 1; i++) {
    const min = i === 0 ? 1 : levels[i - 1].upTo + 1

    if (levels[i].upTo < min) levels[i].upTo = min
    if (levels[i].upTo > 99) levels[i].upTo = 99
  }

  return validateLevels(levels) ? cloneLevels(DEFAULT_LEVELS) : levels
}
