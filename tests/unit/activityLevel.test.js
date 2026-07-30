import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LEVELS,
  MAX_LEVELS,
  cloneLevels,
  isValidColor,
  levelOf,
  lowerBoundOf,
  normalizeLevels,
  onColorOf,
  textColorOf,
  validateLevels,
} from '@/utils/activityLevel'

/*
 * سطح بازدهی، پایه رنگ‌بندی کل گزارش است: نقشه حرارتی، کارت ماه، نوار کارت هدف،
 * الگوی روزهای هفته و کارت سال همه از همین یک تابع رنگ می‌گیرند. پس هر تغییری
 * در این فایل، همه آن‌ها را با هم عوض می‌کند.
 */
describe('levelOf', () => {
  it('روز بدون تسک و روز آینده سطح صفر می‌گیرند', () => {
    expect(levelOf(0, 0)).toBe(0)
    expect(levelOf(5, 5, true)).toBe(0)
  })

  it('هر چهارده مرز پالت پیش‌فرض سطح درست می‌دهد', () => {
    // مرز بالای هر سطح و یک واحد بالاتر از آن. با مخرج صد، درصد همان عدد است.
    const boundaries = [
      [20, 1],
      [21, 2],
      [30, 2],
      [31, 3],
      [45, 3],
      [46, 4],
      [55, 4],
      [56, 5],
      [70, 5],
      [71, 6],
      [85, 6],
      [86, 7],
      [100, 7],
    ]

    boundaries.forEach(([done, expected]) => {
      expect(levelOf(100, done), `${done} از ۱۰۰`).toBe(expected)
    })
  })

  it('پنجاه و پنج درصد سطح چهارم است، نه پنجم', () => {
    /*
     * آزمون بازگشتی برای ایرادی که در ب-۱۹ پیدا شد. نسخه قبلی درصد را با تقسیم
     * می‌ساخت و `(55 / 100) * 100` در جاوااسکریپت کمی بیشتر از ۵۵ است، پس این
     * روز سطح بالاتر می‌گرفت در حالی که صفحه همان را «۵۵٪» نشان می‌داد.
     */
    expect(levelOf(100, 55)).toBe(4)
    expect(levelOf(20, 11)).toBe(4)
  })

  it('یک درصد با مخرج‌های مختلف یک سطح می‌گیرد', () => {
    // ۵۷ درصد، سه بار با مخرج متفاوت.
    expect(levelOf(100, 57)).toBe(5)
    expect(levelOf(300, 171)).toBe(5)
    expect(levelOf(700, 399)).toBe(5)
  })

  it('پالت دلخواه با تعداد سطح متفاوت هم کار می‌کند', () => {
    const threeLevels = [
      { color: '#111111', upTo: 40 },
      { color: '#222222', upTo: 80 },
      { color: '#333333', upTo: 100 },
    ]

    expect(levelOf(100, 40, false, threeLevels)).toBe(1)
    expect(levelOf(100, 41, false, threeLevels)).toBe(2)
    expect(levelOf(100, 81, false, threeLevels)).toBe(3)
    expect(levelOf(100, 100, false, threeLevels)).toBe(3)
  })
})

describe('lowerBoundOf', () => {
  it('اولین سطح از صفر و بقیه از یک واحد بالاتر از سطح قبلی شروع می‌شوند', () => {
    expect(lowerBoundOf(DEFAULT_LEVELS, 0)).toBe(0)
    expect(lowerBoundOf(DEFAULT_LEVELS, 1)).toBe(21)
    expect(lowerBoundOf(DEFAULT_LEVELS, 6)).toBe(86)
  })
})

describe('رنگ متن', () => {
  it('روی رنگ روشن، متن تیره و روی رنگ تیره، متن روشن می‌نشیند', () => {
    expect(onColorOf('#FCD34D')).toBe('#1f2937')
    expect(onColorOf('#ffffff')).toBe('#1f2937')
    expect(onColorOf('#B91C1C')).toBe('#ffffff')
    expect(onColorOf('#000000')).toBe('#ffffff')
  })

  it('رنگ نامعتبر متن تیره می‌گیرد و دست‌نخورده برمی‌گردد', () => {
    expect(onColorOf('نه‌رنگ')).toBe('#1f2937')
    expect(textColorOf('نه‌رنگ')).toBe('نه‌رنگ')
  })

  it('رنگ کنار سطح با رنگ متن تم آمیخته می‌شود تا در هر دو تم خوانا بماند', () => {
    expect(textColorOf('#FCD34D')).toBe('color-mix(in srgb, #FCD34D 74%, var(--color-text))')
  })
})

describe('isValidColor', () => {
  it('فقط کد شش‌رقمی معتبر را می‌پذیرد', () => {
    expect(isValidColor('#059669')).toBe(true)
    expect(isValidColor('  #059669  ')).toBe(true)
    expect(isValidColor('#059')).toBe(false)
    expect(isValidColor('059669')).toBe(false)
    expect(isValidColor('#05966g')).toBe(false)
    expect(isValidColor(null)).toBe(false)
  })
})

describe('validateLevels', () => {
  it('پالت پیش‌فرض سالم است', () => {
    expect(validateLevels(DEFAULT_LEVELS)).toBe('')
  })

  it('ساختار غیرآرایه رد می‌شود', () => {
    expect(validateLevels(null)).not.toBe('')
    expect(validateLevels({})).not.toBe('')
  })

  it('کمتر از دو سطح و بیشتر از ده سطح رد می‌شوند', () => {
    expect(validateLevels([{ color: '#059669', upTo: 100 }])).not.toBe('')

    const tooMany = Array.from({ length: MAX_LEVELS + 1 }, (_, i) => ({
      color: '#059669',
      upTo: i === MAX_LEVELS ? 100 : i + 1,
    }))

    expect(validateLevels(tooMany)).not.toBe('')
  })

  it('مرز آخر که صد نباشد رد می‌شود', () => {
    expect(
      validateLevels([
        { color: '#111111', upTo: 50 },
        { color: '#222222', upTo: 90 },
      ]),
    ).not.toBe('')
  })

  it('مرز نامرتب یا تکراری رد می‌شود', () => {
    expect(
      validateLevels([
        { color: '#111111', upTo: 50 },
        { color: '#222222', upTo: 30 },
        { color: '#333333', upTo: 100 },
      ]),
    ).not.toBe('')

    expect(
      validateLevels([
        { color: '#111111', upTo: 50 },
        { color: '#222222', upTo: 50 },
        { color: '#333333', upTo: 100 },
      ]),
    ).not.toBe('')
  })

  it('مرز غیرصحیح، بیرون از بازه، یا رنگ نامعتبر رد می‌شود', () => {
    const base = { color: '#333333', upTo: 100 }

    expect(validateLevels([{ color: '#111111', upTo: 1.5 }, base])).not.toBe('')
    expect(validateLevels([{ color: '#111111', upTo: 0 }, base])).not.toBe('')
    expect(validateLevels([{ color: 'red', upTo: 50 }, base])).not.toBe('')
  })
})

describe('normalizeLevels', () => {
  it('داده بی‌ربط یا کوتاه به پیش‌فرض برمی‌گردد', () => {
    expect(normalizeLevels(null)).toEqual(DEFAULT_LEVELS)
    expect(normalizeLevels('[]')).toEqual(DEFAULT_LEVELS)
    expect(normalizeLevels([{ color: '#059669', upTo: 100 }])).toEqual(DEFAULT_LEVELS)
  })

  it('مرز آخر همیشه صد می‌شود', () => {
    const result = normalizeLevels([
      { color: '#111111', upTo: 50 },
      { color: '#222222', upTo: 80 },
    ])

    expect(result[result.length - 1].upTo).toBe(100)
  })

  it('مرز نامرتب تعمیر می‌شود، نه رد', () => {
    expect(
      normalizeLevels([
        { color: '#111111', upTo: 50 },
        { color: '#222222', upTo: 30 },
        { color: '#333333', upTo: 100 },
      ]),
    ).toEqual([
      { color: '#111111', upTo: 50 },
      { color: '#222222', upTo: 51 },
      { color: '#333333', upTo: 100 },
    ])
  })

  it('رنگ نامعتبر با رنگ خاکستری جایگزین می‌شود', () => {
    expect(
      normalizeLevels([
        { color: 'خراب', upTo: 50 },
        { color: '#059669', upTo: 100 },
      ]),
    ).toEqual([
      { color: '#888888', upTo: 50 },
      { color: '#059669', upTo: 100 },
    ])
  })

  it('مرز غیرعددی به بالاترین مرز مجاز کوتاه می‌شود', () => {
    expect(
      normalizeLevels([
        { color: '#111111', upTo: 'نه‌عدد' },
        { color: '#222222', upTo: 100 },
      ]),
    ).toEqual([
      { color: '#111111', upTo: 99 },
      { color: '#222222', upTo: 100 },
    ])
  })

  it('بیشتر از ده سطح بریده می‌شود', () => {
    const tooMany = Array.from({ length: 12 }, (_, i) => ({
      color: '#059669',
      upTo: (i + 1) * 8,
    }))

    expect(normalizeLevels(tooMany)).toHaveLength(MAX_LEVELS)
  })

  it('پالت سالم مرزهایش را حفظ می‌کند و رنگ‌ها یک‌دست کوچک می‌شوند', () => {
    const result = normalizeLevels(cloneLevels(DEFAULT_LEVELS))

    expect(result.map((level) => level.upTo)).toEqual(DEFAULT_LEVELS.map((level) => level.upTo))

    // کد رنگ کوچک و بزرگ یک رنگ‌اند، پس یک شکل ذخیره می‌شوند.
    expect(result.map((level) => level.color)).toEqual(
      DEFAULT_LEVELS.map((level) => level.color.toLowerCase()),
    )
  })
})
