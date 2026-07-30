import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SHAMSI_MONTH_NAMES,
  WEEK_DAY_NAMES_LONG,
  WEEK_DAY_NAMES_SHORT,
  formatGregorianDate,
  formatShamsiDate,
  getNextMonth,
  getPreviousMonth,
  getShamsiMonthInfo,
  getShamsiWeekRange,
  getTodayGregorian,
  getTodayShamsi,
  gregorianToJalali,
  gregorianToJalaliInput,
  jalaliInputToGregorian,
} from '@/utils/jalali'

/*
 * این فایل قرارداد تاریخ بین رابط کاربری و سرور است: نمایش شمسی، درخواست میلادی.
 * هر خطای یک‌روزه اینجا، در نمای روز، نقشه حرارتی و مقایسه با تسک‌ها دیده می‌شود.
 *
 * تاریخ‌های لنگر این آزمون‌ها دستی سنجیده شده‌اند، نه با همان کتابخانه‌ای که کد
 * استفاده می‌کند: اول فروردین ۱۴۰۵ برابر ۲۱ مارس ۲۰۲۶ و شنبه است، و ۳۰ ژوئیه
 * ۲۰۲۶ برابر هشتم مرداد ۱۴۰۵ و پنج‌شنبه است.
 */
describe('تبدیل تاریخ', () => {
  it('تاریخ میلادی با دو رقم ماه و روز ساخته می‌شود', () => {
    expect(formatGregorianDate(new Date(2026, 6, 5))).toBe('2026-07-05')
    expect(formatGregorianDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('تاریخ شمسی از تاریخ میلادی درست ساخته می‌شود', () => {
    expect(formatShamsiDate(new Date(2026, 2, 21))).toBe('1405-01-01')
    expect(formatShamsiDate(new Date(2026, 6, 30))).toBe('1405-05-08')
  })

  it('روز پیش از نوروز، آخرین روز سال قبل است', () => {
    expect(formatShamsiDate(new Date(2026, 2, 20))).toBe('1404-12-29')
  })

  it('رشته تاریخ همراه با ساعت هم پذیرفته می‌شود', () => {
    expect(gregorianToJalali('2026-07-30')).toBe('1405-05-08')
    expect(gregorianToJalali('2026-07-30T21:45:00.000Z')).toBe('1405-05-08')
  })

  it('ورودی خالی رشته خالی می‌دهد', () => {
    expect(gregorianToJalali(null)).toBe('')
    expect(gregorianToJalali('')).toBe('')
  })
})

/*
 * مرز بین انتخاب‌گر تاریخ شمسی و تاریخ میلادی درخواست. هر خطای یک‌روزه اینجا،
 * گزارش مدیر را روی روز اشتباه باز می‌کند.
 */
describe('تبدیل ورودی انتخاب‌گر تاریخ', () => {
  it('تاریخ شمسی انتخاب‌گر به میلادی درخواست تبدیل می‌شود', () => {
    expect(jalaliInputToGregorian('1405/05/08')).toBe('2026-07-30')
    expect(jalaliInputToGregorian('1405/01/01')).toBe('2026-03-21')
  })

  it('خط تیره هم مثل اسلش پذیرفته می‌شود', () => {
    expect(jalaliInputToGregorian('1405-05-08')).toBe('2026-07-30')
  })

  it('ورودی نامعتبر تهی می‌دهد، نه تاریخ اشتباه', () => {
    expect(jalaliInputToGregorian('')).toBeNull()
    expect(jalaliInputToGregorian(null)).toBeNull()
    expect(jalaliInputToGregorian('1405/05')).toBeNull()
    expect(jalaliInputToGregorian('1405/13/01')).toBeNull()
    expect(jalaliInputToGregorian('1405/05/32')).toBeNull()
    expect(jalaliInputToGregorian('امروز')).toBeNull()
  })

  it('تاریخ میلادی به قالب انتخاب‌گر برمی‌گردد', () => {
    expect(gregorianToJalaliInput('2026-07-30')).toBe('1405/05/08')
    expect(gregorianToJalaliInput('2026-03-21')).toBe('1405/01/01')
  })

  it('دو تبدیل، عکس هم هستند', () => {
    expect(jalaliInputToGregorian(gregorianToJalaliInput('2026-07-30'))).toBe('2026-07-30')
    expect(gregorianToJalaliInput(jalaliInputToGregorian('1405/05/08'))).toBe('1405/05/08')
  })

  it('ورودی تهی برای نمایش، رشته خالی می‌دهد', () => {
    expect(gregorianToJalaliInput('')).toBe('')
    expect(gregorianToJalaliInput(null)).toBe('')
  })
})

describe('نام ماه و روز هفته', () => {
  it('دوازده ماه به ترتیب، با شروع از فروردین', () => {
    expect(SHAMSI_MONTH_NAMES).toHaveLength(12)
    expect(SHAMSI_MONTH_NAMES[0]).toBe('فروردین')
    expect(SHAMSI_MONTH_NAMES[11]).toBe('اسفند')
  })

  it('هفته از شنبه شروع می‌شود و به جمعه ختم', () => {
    // همین شماره‌گذاری در گزارش هفتگی سرور و نمودار روزهای هفته هم به کار می‌رود.
    expect(WEEK_DAY_NAMES_LONG[0]).toBe('شنبه')
    expect(WEEK_DAY_NAMES_LONG[6]).toBe('جمعه')
    expect(WEEK_DAY_NAMES_SHORT).toHaveLength(7)
    expect(WEEK_DAY_NAMES_SHORT[0]).toBe('ش')
  })
})

describe('getShamsiWeekRange', () => {
  it('هفته از شنبه تا جمعه بسته می‌شود', () => {
    // پنج‌شنبه ۳۰ ژوئیه، وسط هفته‌ای که شنبه‌اش ۲۵ ژوئیه است.
    const range = getShamsiWeekRange(new Date(2026, 6, 30))

    expect(range.start).toBe('2026-07-25')
    expect(range.end).toBe('2026-07-31')
    expect(range.shamsiStart).toBe('1405-05-03')
    expect(range.shamsiEnd).toBe('1405-05-09')
  })

  it('خود شنبه ابتدای هفته است، نه پایان هفته قبل', () => {
    const range = getShamsiWeekRange(new Date(2026, 6, 25))

    expect(range.start).toBe('2026-07-25')
    expect(range.end).toBe('2026-07-31')
  })

  it('جمعه آخرین روز همان هفته است', () => {
    const range = getShamsiWeekRange(new Date(2026, 6, 31))

    expect(range.start).toBe('2026-07-25')
    expect(range.end).toBe('2026-07-31')
  })

  it('کلیدهای درخواست همان بازه میلادی را می‌دهند', () => {
    const range = getShamsiWeekRange(new Date(2026, 6, 30))

    expect(range.apiStartDate).toBe(range.start)
    expect(range.apiEndDate).toBe(range.end)
  })
})

describe('حرکت روی ماه شمسی', () => {
  it('ماه قبل، اول همان ماه شمسی است', () => {
    expect(formatShamsiDate(getPreviousMonth(new Date(2026, 6, 30)))).toBe('1405-04-01')
  })

  it('ماه بعد، اول ماه بعدی شمسی است', () => {
    expect(formatShamsiDate(getNextMonth(new Date(2026, 6, 30)))).toBe('1405-06-01')
  })

  it('از فروردین به عقب، به اسفند سال قبل می‌رود', () => {
    expect(formatShamsiDate(getPreviousMonth(new Date(2026, 2, 25)))).toBe('1404-12-01')
  })

  it('از اسفند به جلو، به فروردین سال بعد می‌رود', () => {
    // چهاردهم اسفند ۱۴۰۴ برابر پنجم مارس ۲۰۲۶ است.
    expect(formatShamsiDate(getNextMonth(new Date(2026, 2, 5)))).toBe('1405-01-01')
  })
})

describe('getShamsiMonthInfo', () => {
  beforeEach(() => {
    // این تابع برای تشخیص «امروز» ساعت سیستم را می‌خواند.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('نام ماه، سال و بازه درخواست را می‌دهد', () => {
    const info = getShamsiMonthInfo(new Date(2026, 6, 30))

    expect(info.monthName).toBe('مرداد')
    expect(info.year).toBe(1405)
    expect(info.month).toBe(5)
    expect(info.apiStartDate).toBe('2026-07-23')
    expect(info.apiEndDate).toBe('2026-08-22')
    expect(info.shamsiStartDate).toBe('1405-05-01')
    expect(info.shamsiEndDate).toBe('1405-05-31')
  })

  it('همه روزهای ماه و فقط همان روزها در جدول هستند', () => {
    const info = getShamsiMonthInfo(new Date(2026, 6, 30))
    const days = info.grid.flat().filter(Boolean)

    expect(days).toHaveLength(31)
    expect(days[0].dayOfMonth).toBe(1)
    expect(days[30].dayOfMonth).toBe(31)
    expect(days.every((day) => day.isCurrentMonth)).toBe(true)
  })

  it('هر هفته هفت خانه دارد و روزهای پیش از اول ماه خالی‌اند', () => {
    const info = getShamsiMonthInfo(new Date(2026, 6, 30))

    expect(info.grid.every((week) => week.length === 7)).toBe(true)

    // اول مرداد ۱۴۰۵ پنج‌شنبه است، پس پنج خانه اول هفته نخست خالی می‌ماند.
    expect(info.grid[0].slice(0, 5).every((cell) => cell === null)).toBe(true)
    expect(info.grid[0][5].dayOfMonth).toBe(1)
    expect(info.grid[0][6].dayOfMonth).toBe(2)
  })

  it('ماهی که اولش شنبه است، از همان خانه اول شروع می‌شود', () => {
    // اول فروردین ۱۴۰۵ شنبه است.
    const info = getShamsiMonthInfo(new Date(2026, 2, 21))

    expect(info.monthName).toBe('فروردین')
    expect(info.grid[0][0].dayOfMonth).toBe(1)
    expect(info.grid[0][0].shamsiDate).toBe('1405-01-01')
    expect(info.grid[0][0].isoDate).toBe('2026-03-21')
  })

  it('امروز فقط روی یک خانه علامت می‌خورد', () => {
    const info = getShamsiMonthInfo(new Date(2026, 6, 30))
    const todayCells = info.grid.flat().filter((cell) => cell?.isToday)

    expect(todayCells).toHaveLength(1)
    expect(todayCells[0].shamsiDate).toBe('1405-05-08')
    expect(info.todayShamsi).toBe('1405-05-08')
    expect(info.todayGregorian).toBe('2026-07-30')
  })

  it('در ماهی که امروز در آن نیست، هیچ خانه‌ای علامت امروز نمی‌گیرد', () => {
    const info = getShamsiMonthInfo(new Date(2026, 2, 21))

    expect(info.grid.flat().filter((cell) => cell?.isToday)).toHaveLength(0)
  })
})

describe('امروز', () => {
  it('هر دو شکل امروز از یک تاریخ ساخته می‌شوند', () => {
    const date = new Date(2026, 6, 30)

    expect(getTodayShamsi(date)).toBe('1405-05-08')
    expect(getTodayGregorian(date)).toBe('2026-07-30')
  })
})
