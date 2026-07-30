import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  createId,
  externalReferrer,
  getSessionId,
  getVisitorId,
  isOptedOut,
  readCampaign,
} from '@/utils/analytics'

/**
 * حافظه ساختگی مرورگر.
 *
 * آزمون‌ها روی `node` اجرا می‌شوند و حافظه واقعی مرورگر وجود ندارد، پس همان
 * قرارداد کوچکی که این پیمانه استفاده می‌کند اینجا ساخته می‌شود.
 */
function fakeStore(initial = {}) {
  const data = { ...initial }

  return {
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
    data,
  }
}

/** حافظه‌ای که دسترسی به آن خطا می‌دهد، مثل حالت ناشناس بعضی مرورگرها. */
function brokenStore() {
  return {
    getItem() {
      throw new Error('denied')
    },
    setItem() {
      throw new Error('denied')
    },
  }
}

describe('createId', () => {
  it('شناسه‌ای می‌سازد که با قاعده سرور می‌خواند', () => {
    const id = createId()

    expect(id.length).toBeGreaterThanOrEqual(8)
    expect(id.length).toBeLessThanOrEqual(64)
    expect(id).toMatch(/^[A-Za-z0-9-]+$/)
  })

  it('دو بار پشت سر هم، دو شناسه متفاوت می‌دهد', () => {
    expect(createId()).not.toBe(createId())
  })
})

describe('getVisitorId', () => {
  it('بار اول می‌سازد و ذخیره می‌کند', () => {
    const store = fakeStore()
    const id = getVisitorId(store)

    expect(id).toBeTruthy()
    expect(store.data['visitor-id']).toBe(id)
  })

  it('بار بعد همان شناسه قبلی را برمی‌گرداند', () => {
    const store = fakeStore({ 'visitor-id': 'existing-visitor' })

    expect(getVisitorId(store)).toBe('existing-visitor')
  })

  it('وقتی حافظه در دسترس نیست هم شناسه می‌دهد و خطا نمی‌دهد', () => {
    expect(getVisitorId(brokenStore())).toMatch(/^[A-Za-z0-9-]+$/)
  })
})

describe('getSessionId', () => {
  it('نشست تازه می‌سازد و زمانش را کنار شناسه نگه می‌دارد', () => {
    const store = fakeStore()
    const id = getSessionId(store, 1_000)

    expect(store.data['visit-session']).toBe(`${id}|1000`)
  })

  it('در همان نشست، شناسه عوض نمی‌شود', () => {
    const store = fakeStore({ 'visit-session': 'session-one|1000' })

    // ده دقیقه بعد
    expect(getSessionId(store, 1000 + 10 * 60 * 1000)).toBe('session-one')
  })

  it('مهر زمانی با هر بازدید تازه می‌شود، پس مرور پیوسته نشست را نمی‌شکند', () => {
    const store = fakeStore({ 'visit-session': 'session-one|1000' })

    getSessionId(store, 5_000)

    expect(store.data['visit-session']).toBe('session-one|5000')
  })

  it('بعد از نیم ساعت بی‌کاری، نشست تازه می‌گیرد', () => {
    const store = fakeStore({ 'visit-session': 'session-one|1000' })
    const id = getSessionId(store, 1000 + 31 * 60 * 1000)

    expect(id).not.toBe('session-one')
  })

  it('داده خراب در حافظه، نشست تازه می‌سازد نه خطا', () => {
    const store = fakeStore({ 'visit-session': 'garbage' })

    expect(getSessionId(store, 1_000)).toMatch(/^[A-Za-z0-9-]+$/)
  })
})

describe('isOptedOut', () => {
  it('بدون کلید، آمار روشن است', () => {
    expect(isOptedOut(fakeStore())).toBe(false)
  })

  it('با کلید خاموشی، آمار خاموش است', () => {
    expect(isOptedOut(fakeStore({ 'analytics-opt-out': '1' }))).toBe(true)
  })

  it('مقدار دیگری جز یک، خاموشی حساب نمی‌شود', () => {
    expect(isOptedOut(fakeStore({ 'analytics-opt-out': 'no' }))).toBe(false)
  })
})

describe('externalReferrer', () => {
  it('ارجاع از سایت دیگر نگه داشته می‌شود', () => {
    expect(externalReferrer('https://google.com/search?q=x', 'https://todo.app')).toBe(
      'https://google.com/search?q=x'
    )
  })

  it('ارجاع از خود سایت دور ریخته می‌شود', () => {
    expect(externalReferrer('https://todo.app/vorod', 'https://todo.app')).toBeNull()
  })

  it('ارجاع خالی یا خراب، تهی است', () => {
    expect(externalReferrer('', 'https://todo.app')).toBeNull()
    expect(externalReferrer('not-a-url', 'https://todo.app')).toBeNull()
  })
})

describe('readCampaign', () => {
  it('فقط سه مقدار کارزار را بیرون می‌کشد', () => {
    const campaign = readCampaign('?utm_source=telegram&utm_medium=post&other=x')

    expect(campaign).toEqual({ utm_source: 'telegram', utm_medium: 'post' })
  })

  it('نشانی بدون مقدار کارزار، شیء خالی می‌دهد', () => {
    expect(readCampaign('?page=2')).toEqual({})
  })

  it('مقدار خیلی بلند بریده می‌شود تا از ستون سرور بیرون نزند', () => {
    const long = 'x'.repeat(300)

    expect(readCampaign(`?utm_source=${long}`).utm_source).toHaveLength(100)
  })
})

describe('buildPayload', () => {
  const context = {
    visitorId: 'visitor-1',
    sessionId: 'session-1',
    referrer: '',
    origin: 'https://todo.app',
    search: '',
  }

  it('کمترین بار درخواست، فقط سه فیلد لازم سرور را دارد', () => {
    expect(buildPayload('/vorod', null, context)).toEqual({
      visitor_id: 'visitor-1',
      session_id: 'session-1',
      path: '/vorod',
    })
  })

  it('نام مسیر وقتی هست اضافه می‌شود', () => {
    expect(buildPayload('/vorod', 'login', context).route).toBe('login')
  })

  it('ارجاع داخلی فرستاده نمی‌شود', () => {
    const payload = buildPayload('/app/day', 'day', {
      ...context,
      referrer: 'https://todo.app/vorod',
    })

    expect(payload.referrer).toBeUndefined()
  })

  it('ارجاع بیرونی فرستاده می‌شود', () => {
    const payload = buildPayload('/', 'landing', {
      ...context,
      referrer: 'https://t.me/channel',
    })

    expect(payload.referrer).toBe('https://t.me/channel')
  })

  it('مقادیر کارزار از نشانی صفحه به بار درخواست می‌آیند', () => {
    const payload = buildPayload('/', 'landing', {
      ...context,
      search: '?utm_source=instagram&utm_campaign=summer',
    })

    expect(payload.utm_source).toBe('instagram')
    expect(payload.utm_campaign).toBe('summer')
  })

  it('مسیر تهی به ریشه تبدیل می‌شود', () => {
    expect(buildPayload('', null, context).path).toBe('/')
  })

  it('هیچ‌وقت توکن یا چیزی درباره خود کاربر در بار درخواست نمی‌رود', () => {
    const payload = buildPayload('/app/day', 'day', context)

    expect(Object.keys(payload)).toEqual(['visitor_id', 'session_id', 'path', 'route'])
  })
})
