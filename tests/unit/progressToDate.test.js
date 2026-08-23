import { describe, it, expect } from 'vitest'
import {
  tasksUpToToday,
  isPeriodInProgress,
  progressToDate,
} from '@/utils/progressToDate'

// هفته نمونه: شنبه تا جمعه. «امروز» روز سوم همین هفته است.
const START = '2026-08-08'
const END = '2026-08-14'
const TODAY = '2026-08-10'

const task = (day, is_done, weight = 2) => ({ day, is_done, weight })

describe('tasksUpToToday', () => {
  it('امروز را نگه می‌دارد و آینده را کنار می‌گذارد', () => {
    const tasks = [task('2026-08-08', 1), task(TODAY, 0), task('2026-08-11', 0)]

    expect(tasksUpToToday(tasks, TODAY).map((t) => t.day)).toEqual([
      '2026-08-08',
      TODAY,
    ])
  })

  it('روز همراه ساعت را هم درست می‌خواند', () => {
    const tasks = [task('2026-08-10T00:00:00.000Z', 0)]

    expect(tasksUpToToday(tasks, TODAY)).toHaveLength(1)
  })

  it('تسک بدون روز را نمی‌شمارد', () => {
    expect(tasksUpToToday([{ is_done: 1 }, task(null, 1)], TODAY)).toEqual([])
  })
})

describe('isPeriodInProgress', () => {
  it('وسط دوره درست است', () => {
    expect(isPeriodInProgress(START, END, TODAY)).toBe(true)
  })

  it('روز اول دوره هم درست است', () => {
    expect(isPeriodInProgress(START, END, START)).toBe(true)
  })

  it('روز آخر دوره نادرست است، چون با کل دوره یکی می‌شود', () => {
    expect(isPeriodInProgress(START, END, END)).toBe(false)
  })

  it('دوره تمام‌شده و دوره نرسیده نادرست‌اند', () => {
    expect(isPeriodInProgress(START, END, '2026-09-01')).toBe(false)
    expect(isPeriodInProgress(START, END, '2026-07-01')).toBe(false)
  })

  it('بازه ناقص نادرست است', () => {
    expect(isPeriodInProgress('', END, TODAY)).toBe(false)
    expect(isPeriodInProgress(START, null, TODAY)).toBe(false)
  })
})

describe('progressToDate', () => {
  it('مخرج فقط روزهای رسیده است', () => {
    // چهار تسک تا امروز که دوتایش انجام شده، و سه تسک در روزهای آینده.
    const tasks = [
      task('2026-08-08', 1),
      task('2026-08-08', 1),
      task('2026-08-09', 0),
      task(TODAY, 0),
      task('2026-08-11', 0),
      task('2026-08-12', 0),
      task('2026-08-13', 0),
    ]

    expect(progressToDate(tasks, { start: START, end: END, today: TODAY })).toEqual({
      applicable: true,
      total: 4,
      done: 2,
      percent: 50,
    })
  })

  it('شمارش‌ها شمارش می‌مانند و فقط درصد وزنی است', () => {
    // ده تسک تا امروز، پنج‌تا انجام‌شده. ولی انجام‌شده‌ها سبک‌ترند، پس درصد
    // زیر پنجاه می‌نشیند و جمله «۵ از ۱۰» سر جایش می‌ماند.
    const tasks = [
      ...Array.from({ length: 5 }, () => task('2026-08-08', 1, 1)),
      ...Array.from({ length: 5 }, () => task('2026-08-09', 0, 3)),
    ]

    const result = progressToDate(tasks, { start: START, end: END, today: TODAY })

    expect(result.total).toBe(10)
    expect(result.done).toBe(5)
    expect(result.percent).toBe(25)
  })

  it('بیرون از دوره در جریان، عدد نمی‌دهد', () => {
    const tasks = [task('2026-08-08', 1)]

    expect(progressToDate(tasks, { start: START, end: END, today: '2026-09-01' })).toEqual({
      applicable: false,
      total: 0,
      done: 0,
      percent: 0,
    })
  })

  it('دوره در جریانِ بدون تسک رسیده، صفر می‌دهد نه خطا', () => {
    const tasks = [task('2026-08-12', 0)]

    expect(progressToDate(tasks, { start: START, end: END, today: TODAY })).toEqual({
      applicable: true,
      total: 0,
      done: 0,
      percent: 0,
    })
  })
})
