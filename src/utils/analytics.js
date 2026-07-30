/*
 * ثبت بازدید صفحه.
 *
 * سرور هیچ صفحه‌ای نمی‌سازد و فقط رابط برنامه‌نویسی است، پس بازدید را باید
 * همین‌جا شمرد. اگر روی درخواست‌های سرور شمرده می‌شد، صفحه معرفی و هر
 * بازدیدکننده‌ای که هنوز وارد نشده اصلاً دیده نمی‌شد.
 *
 * قاعده‌ای که کل این فایل رویش سوار است: ثبت بازدید هرگز نباید به کار کاربر
 * آسیب بزند. هیچ تابعی اینجا خطا پرتاب نمی‌کند و هیچ‌کدام مسیریابی را معطل
 * نمی‌کنند.
 */

const VISITOR_KEY = 'visitor-id'
const SESSION_KEY = 'visit-session'
const OPT_OUT_KEY = 'analytics-opt-out'

/*
 * نشست بعد از نیم ساعت بی‌کاری تازه می‌شود، همان قراردادی که ابزارهای آمار
 * وب معمولاً دارند. بدون این، یک زبانه بازمانده تا فردا یک نشست بی‌پایان
 * می‌ساخت و میانگین مدت نشست بی‌معنی می‌شد.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000

const TRACK_PATH = '/api/track/view'

/**
 * شناسه تصادفی. روی مرورگرهای قدیمی‌تر یا زمینه ناامن، `crypto.randomUUID`
 * وجود ندارد، پس جایگزین ساده‌ای هم هست. شکل خروجی هر دو با قاعده سرور
 * می‌خواند: فقط حرف و رقم و خط تیره.
 */
export function createId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // به جایگزین زیر می‌افتد
  }

  const random = () => Math.random().toString(36).slice(2, 10)

  return `${random()}-${random()}-${Date.now().toString(36)}`
}

/**
 * خواندن از حافظه مرورگر بدون امکان شکست.
 *
 * در حالت ناشناس بعضی مرورگرها خود دسترسی به حافظه را خطا می‌دهند، نه فقط
 * نوشتن را.
 */
function readStore(store, key) {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStore(store, key, value) {
  try {
    store?.setItem(key, value)
  } catch {
    // حافظه در دسترس نیست؛ بازدید بدون ماندگاری هم ثبت می‌شود
  }
}

/**
 * شناسه ماندگار بازدیدکننده.
 *
 * یک عدد تصادفی است و از هیچ چیزی درباره کاربر ساخته نشده. نشانی شبکه نه
 * اینجا و نه روی سرور ذخیره نمی‌شود.
 */
export function getVisitorId(storage = globalThis.localStorage) {
  const existing = readStore(storage, VISITOR_KEY)

  if (existing) return existing

  const created = createId()
  writeStore(storage, VISITOR_KEY, created)

  return created
}

/**
 * شناسه نشست جاری، با تازه شدن بعد از بی‌کاری.
 *
 * مهر زمانی کنار خود شناسه نگه داشته می‌شود تا یک کلید بیشتر لازم نباشد.
 */
export function getSessionId(storage = globalThis.sessionStorage, now = Date.now()) {
  const raw = readStore(storage, SESSION_KEY)

  if (raw) {
    const [id, seenAt] = raw.split('|')
    const idle = now - Number(seenAt)

    if (id && Number.isFinite(idle) && idle < SESSION_IDLE_MS) {
      writeStore(storage, SESSION_KEY, `${id}|${now}`)

      return id
    }
  }

  const created = createId()
  writeStore(storage, SESSION_KEY, `${created}|${now}`)

  return created
}

/**
 * کاربری که آمار را نمی‌خواهد، با گذاشتن این کلید خاموشش می‌کند.
 */
export function isOptedOut(storage = globalThis.localStorage) {
  return readStore(storage, OPT_OUT_KEY) === '1'
}

/**
 * مقادیر کارزار از نشانی صفحه.
 *
 * خود نشانی کامل فرستاده نمی‌شود؛ فقط این سه مقدار که برای سنجش یک کارزار
 * لازم‌اند بیرون کشیده می‌شوند.
 */
export function readCampaign(search = '') {
  const result = {}

  try {
    const params = new URLSearchParams(search)

    for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const value = params.get(key)

      if (value) result[key] = value.slice(0, 100)
    }
  } catch {
    // نشانی خراب، بدون مقدار کارزار
  }

  return result
}

/**
 * ارجاع‌دهنده فقط وقتی معنی دارد که از بیرون همین سایت آمده باشد.
 *
 * جابه‌جایی داخل خود برنامه ارجاع‌دهنده نمی‌سازد، پس فرستادنش سرور را وادار
 * می‌کرد هر پرش بین دو تب را یک ورود تازه از بیرون بشمارد.
 */
export function externalReferrer(referrer, currentOrigin) {
  if (!referrer) return null

  try {
    if (new URL(referrer).origin === currentOrigin) return null
  } catch {
    return null
  }

  return referrer
}

/**
 * ساخت بار درخواست یک بازدید.
 *
 * جدا از فرستادن نوشته شده تا بشود بدون شبکه سنجیدش.
 */
export function buildPayload(path, routeName, context = {}) {
  const {
    visitorId,
    sessionId,
    referrer = '',
    origin = '',
    search = '',
  } = context

  const payload = {
    visitor_id: visitorId,
    session_id: sessionId,
    path: String(path || '/').slice(0, 2048),
    ...readCampaign(search),
  }

  if (routeName) payload.route = String(routeName).slice(0, 64)

  const external = externalReferrer(referrer, origin)

  if (external) payload.referrer = external.slice(0, 2048)

  return payload
}

/**
 * ارسال بدون معطل کردن صفحه.
 *
 * برای بازدید مهمان، بیکن سبک‌ترین راه است و حتی وقتی صفحه بسته می‌شود هم
 * می‌رسد. ولی بیکن سرآیند نمی‌گیرد، و بدون سرآیند شناسایی، سرور کاربر
 * واردشده را از مهمان تشخیص نمی‌دهد. پس برای کاربر واردشده درخواست معمولی با
 * `keepalive` فرستاده می‌شود. توکن فقط در سرآیند می‌رود و هیچ‌وقت داخل بدنه،
 * چون بدنه در ثبت رخداد سرور و میانی‌ها دیده می‌شود.
 */
function send(url, payload, token) {
  const body = JSON.stringify(payload)

  if (!token && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' })

      if (navigator.sendBeacon(url, blob)) return
    } catch {
      // به درخواست معمولی زیر می‌افتد
    }
  }

  const headers = { 'Content-Type': 'application/json' }

  if (token) headers.Authorization = `Bearer ${token}`

  fetch(url, { method: 'POST', headers, body, keepalive: true }).catch(() => {
    // نرسیدن یک بازدید به سرور، چیزی برای گفتن به کاربر نیست
  })
}

function trackerUrl() {
  const base = import.meta.env?.VITE_API_BASE || ''

  return `${String(base).replace(/\/$/, '')}${TRACK_PATH}`
}

function currentToken() {
  return readStore(globalThis.localStorage, 'token')
}

/**
 * ثبت یک بازدید صفحه. تنها چیزی که بیرون این فایل صدا زده می‌شود.
 */
export function trackPageView(path, routeName) {
  try {
    if (typeof window === 'undefined') return
    if (isOptedOut()) return

    const payload = buildPayload(path, routeName, {
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      referrer: document.referrer,
      origin: window.location.origin,
      search: window.location.search,
    })

    send(trackerUrl(), payload, currentToken())
  } catch {
    // آمار هرگز نباید مسیریابی را بشکند
  }
}
