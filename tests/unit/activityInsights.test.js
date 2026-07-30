import { describe, expect, it } from 'vitest'

import {
  MAX_INSIGHTS,
  buildInsights,
  computeStreak,
  previousPeriodStats,
  summarizeDays,
  trailingRun,
  weekdayBuckets,
  weekdayInsightOf,
} from '@/utils/activityInsights'
import { WEEK_DAY_NAMES_LONG } from '@/utils/jalali'

/*
 * این آزمون‌ها همان سناریوهایی هستند که هنگام ساخت زنجیره، الگوی روزهای هفته و
 * بینش خودکار با اسکریپت موقت سنجیده شدند و بعد دور ریخته شدند. حالا در مخزن
 * می‌مانند.
 */

// هشتم مرداد ۱۴۰۵ به شکل عددی، همان قراردادی که صفحه گزارش دارد.
const TODAY = 14050508

/**
 * یک روز بازه. وزن پیش‌فرض برابر شمارش گرفته می‌شود، همان‌طور که صفحه گزارش وقتی
 * پاسخ سرور وزن ندارد رفتار می‌کند.
 */
const day = (numeric, total, done, rowIndex = 0) => ({
  numeric,
  rowIndex,
  total,
  done,
  totalWeight: total,
  doneWeight: done,
})

const stats = ({ total = 10, done = 5, perfect = 0, inactive = 0, avg = 50 } = {}) => ({
  total,
  done,
  perfect,
  inactive,
  avg,
})

const noStreak = { current: 0, best: { length: 0, start: null, end: null } }

describe('summarizeDays', () => {
  it('روز آینده در جمع‌بندی نمی‌آید', () => {
    const result = summarizeDays(
      [day(14050501, 2, 2), day(14050509, 5, 0), day(14050510, 5, 5)],
      TODAY,
    )

    expect(result.total).toBe(2)
    expect(result.done).toBe(2)
    expect(result.avg).toBe(100)
  })

  it('روز کامل و روز بی‌برنامه جدا شمرده می‌شوند', () => {
    const result = summarizeDays(
      [day(14050501, 3, 3), day(14050502, 0, 0), day(14050503, 4, 1)],
      TODAY,
    )

    expect(result.perfect).toBe(1)
    expect(result.inactive).toBe(1)
    expect(result.total).toBe(7)
    expect(result.done).toBe(4)
  })

  it('بازه بدون تسک، بازدهی صفر می‌دهد نه تقسیم بر صفر', () => {
    const result = summarizeDays([day(14050501, 0, 0), day(14050502, 0, 0)], TODAY)

    expect(result.avg).toBe(0)
    expect(result.inactive).toBe(2)
  })

  it('بازدهی با یک رقم اعشار گرد می‌شود', () => {
    // ۱ از ۳ یعنی ۳۳.۳ درصد.
    expect(summarizeDays([day(14050501, 3, 1)], TODAY).avg).toBe(33.3)
  })

  it('بازه خالی همه اعداد را صفر می‌دهد', () => {
    expect(summarizeDays([], TODAY)).toEqual({
      total: 0,
      done: 0,
      perfect: 0,
      inactive: 0,
      avg: 0,
    })
  })
})

describe('computeStreak', () => {
  it('روز بدون تسک زنجیره را نمی‌شکند ولی به آن اضافه هم نمی‌کند', () => {
    const result = computeStreak(
      [day(14050501, 2, 2), day(14050502, 0, 0), day(14050503, 1, 1)],
      TODAY,
    )

    expect(result.best.length).toBe(2)
    expect(result.current).toBe(2)
  })

  it('روز ناتمام زنجیره را می‌شکند و شمارش از نو شروع می‌شود', () => {
    const result = computeStreak(
      [day(14050501, 2, 2), day(14050502, 2, 2), day(14050503, 2, 1), day(14050504, 1, 1)],
      TODAY,
    )

    expect(result.best.length).toBe(2)
    expect(result.current).toBe(1)
    expect(result.lastBreak.numeric).toBe(14050503)
  })

  it('زنجیره‌ای که با روز ناتمام تمام شده، زنجیره فعال ندارد', () => {
    const result = computeStreak(
      [day(14050501, 1, 1), day(14050502, 1, 1), day(14050503, 3, 2)],
      TODAY,
    )

    expect(result.current).toBe(0)
    expect(result.currentStart).toBeNull()
    expect(result.best.length).toBe(2)
  })

  it('در تساوی طول، زنجیره تازه‌تر نشان داده می‌شود', () => {
    const result = computeStreak(
      [
        day(14050501, 1, 1),
        day(14050502, 1, 1),
        day(14050503, 2, 0),
        day(14050504, 1, 1),
        day(14050505, 1, 1),
      ],
      TODAY,
    )

    expect(result.best.length).toBe(2)
    expect(result.best.start.numeric).toBe(14050504)
    expect(result.best.end.numeric).toBe(14050505)
  })

  it('روز آینده در زنجیره نمی‌آید، حتی اگر تسک انجام‌شده داشته باشد', () => {
    const result = computeStreak(
      [day(14050508, 1, 1), day(14050509, 1, 1), day(14050510, 1, 1)],
      TODAY,
    )

    expect(result.best.length).toBe(1)
    expect(result.current).toBe(1)
  })

  it('بازه کاملاً خالی زنجیره ندارد', () => {
    const result = computeStreak([day(14050501, 0, 0), day(14050502, 0, 0)], TODAY)

    expect(result).toEqual({
      current: 0,
      currentStart: null,
      best: { length: 0, start: null, end: null },
      lastBreak: null,
    })
  })

  it('ابتدای زنجیره فعال، اولین روز همان زنجیره است', () => {
    const result = computeStreak(
      [day(14050501, 2, 1), day(14050502, 1, 1), day(14050503, 1, 1)],
      TODAY,
    )

    expect(result.current).toBe(2)
    expect(result.currentStart.numeric).toBe(14050502)
  })

  it('همه روزهای کامل یک زنجیره پیوسته می‌سازند', () => {
    const days = [1, 2, 3, 4, 5].map((d) => day(14050500 + d, 2, 2))
    const result = computeStreak(days, TODAY)

    expect(result.best.length).toBe(5)
    expect(result.current).toBe(5)
    expect(result.lastBreak).toBeNull()
  })
})

describe('weekdayBuckets', () => {
  const labels = WEEK_DAY_NAMES_LONG

  it('هفت سطل به ترتیب شنبه تا جمعه ساخته می‌شود', () => {
    const buckets = weekdayBuckets([], TODAY, labels)

    expect(buckets).toHaveLength(7)
    expect(buckets[0].label).toBe('شنبه')
    expect(buckets[6].label).toBe('جمعه')
    expect(buckets.every((bucket) => bucket.percent === 0)).toBe(true)
  })

  it('روزها بر اساس جایگاهشان در ستون نقشه تجمیع می‌شوند', () => {
    const buckets = weekdayBuckets(
      [day(14050501, 2, 2, 0), day(14050508, 2, 1, 0), day(14050502, 4, 1, 1)],
      TODAY,
      labels,
    )

    expect(buckets[0].total).toBe(4)
    expect(buckets[0].done).toBe(3)
    expect(buckets[0].percent).toBe(75)
    expect(buckets[0].days).toBe(2)
    expect(buckets[1].percent).toBe(25)
  })

  it('روز آینده و روز بدون تسک شمار روزهای فعال را بالا نمی‌برند', () => {
    const buckets = weekdayBuckets(
      [day(14050501, 0, 0, 3), day(14050502, 1, 1, 3), day(14050515, 5, 5, 3)],
      TODAY,
      labels,
    )

    expect(buckets[3].days).toBe(1)
    expect(buckets[3].total).toBe(1)
    expect(buckets[3].percent).toBe(100)
  })
})

describe('weekdayInsightOf', () => {
  const bucket = (label, percent, total = 5) => ({ label, percent, total })

  it('با کمتر از سه روز فعال، ادعای الگو ساخته نمی‌شود', () => {
    expect(
      weekdayInsightOf([bucket('شنبه', 90), bucket('یک‌شنبه', 20), bucket('دوشنبه', 0, 0)]),
    ).toBeNull()
  })

  it('وقتی همه روزها درصد برابر دارند، الگویی وجود ندارد', () => {
    expect(
      weekdayInsightOf([bucket('شنبه', 50), bucket('یک‌شنبه', 50), bucket('دوشنبه', 50)]),
    ).toBeNull()
  })

  it('قوی‌ترین و ضعیف‌ترین روز را جدا می‌کند', () => {
    const result = weekdayInsightOf([
      bucket('شنبه', 40),
      bucket('یک‌شنبه', 90),
      bucket('دوشنبه', 10),
      bucket('جمعه', 0, 0),
    ])

    expect(result.best.label).toBe('یک‌شنبه')
    expect(result.worst.label).toBe('دوشنبه')
  })
})

describe('trailingRun', () => {
  it('طول دنباله نزولی انتهایی را می‌شمارد', () => {
    expect(trailingRun([80, 70, 60], true)).toBe(3)
    expect(trailingRun([50, 80, 70, 60], true)).toBe(3)
  })

  it('طول دنباله صعودی انتهایی را می‌شمارد', () => {
    expect(trailingRun([40, 50, 60], false)).toBe(3)
  })

  it('درصد برابر دنباله را ادامه نمی‌دهد', () => {
    expect(trailingRun([60, 60, 60], true)).toBe(1)
    expect(trailingRun([60, 60, 60], false)).toBe(1)
  })
})

describe('previousPeriodStats', () => {
  /*
   * نقشه‌ای ده‌روزه که کامل در گذشته است: بیست و یکم تا سی‌ام تیر ۱۴۰۵.
   * پنج روز اول نصف تسک‌ها انجام شده و پنج روز دوم همه.
   */
  const grid = Array.from({ length: 10 }, (_, i) => day(14050421 + i, 2, i < 5 ? 1 : 2))

  it('دوره قبل هم‌اندازه بازه و دقیقاً پیش از آن است', () => {
    const visible = grid.slice(5)
    const result = previousPeriodStats(grid, visible, visible[visible.length - 1].numeric, TODAY)

    expect(result.total).toBe(10)
    expect(result.avg).toBe(50)
  })

  it('اگر دوره قبل کامل داخل نقشه نباشد، مقایسه‌ای ساخته نمی‌شود', () => {
    const visible = grid.slice(3)

    expect(
      previousPeriodStats(grid, visible, visible[visible.length - 1].numeric, TODAY),
    ).toBeNull()
  })

  it('بازه‌ای که به آینده کشیده، با دوره کامل مقایسه نمی‌شود', () => {
    const visible = grid.slice(5)

    expect(previousPeriodStats(grid, visible, 14050520, TODAY)).toBeNull()
  })

  it('دوره قبل بدون تسک، مقایسه نمی‌سازد', () => {
    const emptyThenFull = [
      ...Array.from({ length: 5 }, (_, i) => day(14050421 + i, 0, 0)),
      ...Array.from({ length: 5 }, (_, i) => day(14050426 + i, 2, 2)),
    ]
    const visible = emptyThenFull.slice(5)

    expect(
      previousPeriodStats(emptyThenFull, visible, visible[visible.length - 1].numeric, TODAY),
    ).toBeNull()
  })

  it('بازه خالی مقایسه‌ای ندارد', () => {
    expect(previousPeriodStats(grid, [], 0, TODAY)).toBeNull()
  })
})

describe('buildInsights', () => {
  const keysOf = (list) => list.map((item) => item.key)

  it('بدون هیچ پشتوانه‌ای، فهرست خالی می‌ماند', () => {
    expect(buildInsights({ stats: stats(), streak: noStreak })).toEqual([])
  })

  it('سه هفته افت پیاپی یک جمله می‌سازد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      trendPercents: [90, 70, 50],
    })

    expect(keysOf(list)).toEqual(['trend-down'])
    expect(list[0].tone).toBe('bad')
    expect(list[0].text).toContain('۳ هفته')
  })

  it('سه هفته رشد پیاپی جمله مثبت می‌سازد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      trendPercents: [40, 60, 80],
    })

    expect(keysOf(list)).toEqual(['trend-up'])
    expect(list[0].tone).toBe('good')
  })

  it('نوسان بدون روند جمله نمی‌سازد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      trendPercents: [60, 80, 70],
    })

    expect(list).toEqual([])
  })

  it('کمتر از سه هفته داده، روند نمی‌سازد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      trendPercents: [90, 50],
    })

    expect(list).toEqual([])
  })

  it('بهتر شدن نسبت به دوره قبل گفته می‌شود', () => {
    const list = buildInsights({
      stats: stats({ avg: 70 }),
      previousStats: stats({ avg: 50 }),
      streak: noStreak,
    })

    expect(keysOf(list)).toEqual(['previous-period'])
    expect(list[0].tone).toBe('good')
    expect(list[0].text).toContain('۲۰ درصد بهتر')
  })

  it('افت نسبت به دوره قبل گفته می‌شود، با عدد مثبت', () => {
    const list = buildInsights({
      stats: stats({ avg: 40 }),
      previousStats: stats({ avg: 65 }),
      streak: noStreak,
    })

    expect(list[0].tone).toBe('bad')
    expect(list[0].text).toContain('۲۵ درصد افت')
  })

  it('اختلاف کمتر از پنج درصد با دوره قبل، جمله نمی‌سازد', () => {
    const list = buildInsights({
      stats: stats({ avg: 52 }),
      previousStats: stats({ avg: 48 }),
      streak: noStreak,
    })

    expect(list).toEqual([])
  })

  it('درصد پیش از مقایسه گرد می‌شود', () => {
    // ۵۵.۴ و ۵۰.۴ پس از گرد شدن پنج واحد فاصله دارند، پس جمله ساخته می‌شود.
    const list = buildInsights({
      stats: stats({ avg: 55.4 }),
      previousStats: stats({ avg: 50.4 }),
      streak: noStreak,
    })

    expect(keysOf(list)).toEqual(['previous-period'])
    expect(list[0].text).toContain('۵ درصد')
  })

  it('زنجیره فعال سه روز یا بیشتر گفته می‌شود', () => {
    const list = buildInsights({
      stats: stats(),
      streak: { current: 4, best: { length: 6 } },
    })

    expect(keysOf(list)).toEqual(['streak-alive'])
    expect(list[0].text).toContain('۴ روز')
  })

  it('وقتی زنجیره فعالی نیست، بلندترین زنجیره یادآوری می‌شود', () => {
    const list = buildInsights({
      stats: stats(),
      streak: { current: 0, best: { length: 5 } },
    })

    expect(keysOf(list)).toEqual(['streak-broken'])
    expect(list[0].tone).toBe('neutral')
  })

  it('زنجیره کوتاه‌تر از سه روز جمله‌ای ندارد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: { current: 2, best: { length: 2 } },
    })

    expect(list).toEqual([])
  })

  it('الگوی روزهای هفته با نام جمع روز گفته می‌شود', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      weekday: {
        best: { label: 'سه‌شنبه', percent: 80 },
        worst: { label: 'جمعه', percent: 50 },
      },
    })

    expect(keysOf(list)).toEqual(['weekday'])
    expect(list[0].text).toContain('سه‌شنبه‌ها')
    expect(list[0].text).toContain('جمعه‌ها')
  })

  it('وقتی ضعیف‌ترین روز کمتر از نصف قوی‌ترین است، جمله صریح‌تر می‌شود', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      weekday: {
        best: { label: 'سه‌شنبه', percent: 80 },
        worst: { label: 'جمعه', percent: 30 },
      },
    })

    expect(list[0].text).toContain('کمتر از نصف')
  })

  it('بهترین و ضعیف‌ترین ماه با دست‌کم دو ماه دارای داده گفته می‌شود', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      months: [
        { title: 'تیر', total: 20, percent: 80 },
        { title: 'مرداد', total: 10, percent: 40 },
        { title: 'شهریور', total: 0, percent: 0 },
      ],
    })

    expect(keysOf(list)).toEqual(['months'])
    expect(list[0].text).toContain('تیر')
    expect(list[0].text).toContain('مرداد')
  })

  it('با یک ماه دارای داده، بهترین ماه معنا ندارد', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      months: [
        { title: 'مرداد', total: 10, percent: 90 },
        { title: 'شهریور', total: 0, percent: 0 },
      ],
    })

    expect(list).toEqual([])
  })

  it('دو ماه با اختلاف ناچیز، جمله نمی‌سازند', () => {
    const list = buildInsights({
      stats: stats(),
      streak: noStreak,
      months: [
        { title: 'تیر', total: 20, percent: 62 },
        { title: 'مرداد', total: 10, percent: 60 },
      ],
    })

    expect(list).toEqual([])
  })

  it('روزهای بی‌برنامه با دست‌کم دو هفته داده و چهل درصد گفته می‌شود', () => {
    const list = buildInsights({
      stats: stats({ inactive: 8 }),
      streak: noStreak,
      pastDays: 20,
    })

    expect(keysOf(list)).toEqual(['idle-days'])
    expect(list[0].text).toContain('۸ روز از ۲۰ روز')
  })

  it('بازه کوتاه، ادعای روزهای بی‌برنامه نمی‌سازد', () => {
    const list = buildInsights({
      stats: stats({ inactive: 10 }),
      streak: noStreak,
      pastDays: 13,
    })

    expect(list).toEqual([])
  })

  it('کمتر از چهل درصد روز بی‌برنامه، جمله نمی‌سازد', () => {
    const list = buildInsights({
      stats: stats({ inactive: 7 }),
      streak: noStreak,
      pastDays: 20,
    })

    expect(list).toEqual([])
  })

  it('فهرست از پنج جمله بیشتر نمی‌شود و کلیدها یکتا هستند', () => {
    const list = buildInsights({
      stats: stats({ avg: 80, inactive: 9 }),
      previousStats: stats({ avg: 40 }),
      streak: { current: 5, best: { length: 5 } },
      trendPercents: [40, 60, 80],
      weekday: {
        best: { label: 'سه‌شنبه', percent: 90 },
        worst: { label: 'جمعه', percent: 20 },
      },
      months: [
        { title: 'تیر', total: 20, percent: 90 },
        { title: 'مرداد', total: 10, percent: 40 },
      ],
      pastDays: 20,
    })

    // شش قاعده فعال است، ولی سقف پنج جمله رعایت می‌شود.
    expect(list).toHaveLength(MAX_INSIGHTS)
    expect(new Set(keysOf(list)).size).toBe(MAX_INSIGHTS)
    expect(keysOf(list)).toEqual([
      'trend-up',
      'previous-period',
      'streak-alive',
      'weekday',
      'months',
    ])
  })
})
