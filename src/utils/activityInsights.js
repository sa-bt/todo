/*
 * تحلیل روزهای گزارش: جمع‌بندی، الگوی روزهای هفته، زنجیره و جمله‌های بینش.
 *
 * این منطق تا امروز داخل جزء صفحه گزارش بود و راهی برای سنجیدنش جز باز کردن
 * مرورگر وجود نداشت. اینجا هیچ‌چیز از Vue نمی‌داند و هیچ حالتی نگه نمی‌دارد، پس
 * آزمون‌پذیر است. صفحه گزارش همان محاسبه‌ها را از همین فایل می‌گیرد.
 *
 * ورودی همه توابع، آرایه روزهاست با همان شکلی که صفحه گزارش می‌سازد:
 *
 *   { numeric, rowIndex, total, done, totalWeight, doneWeight }
 *
 * `total` و `done` شمار تسک‌اند و `totalWeight` و `doneWeight` جمع وزن. درصد و
 * سطح رنگ از وزن ساخته می‌شوند و شمارش برای «روز کامل» به کار می‌رود.
 *
 * `numeric` تاریخ شمسی به شکل عدد است: سال × ۱۰۰۰۰ + ماه × ۱۰۰ + روز. مقایسه با
 * امروز همه‌جا با همین عدد انجام می‌شود، پس هیچ تابعی اینجا تقویم را دوباره حساب
 * نمی‌کند و «امروز» را هم خودش نمی‌خواند؛ فراخوان آن را می‌دهد.
 */

import { toPersianNumber } from '@/utils/number'

// با داده کم، جمله «قوی‌ترین روز» ادعای بی‌پشتوانه می‌شود.
export const MIN_ACTIVE_WEEKDAYS = 3

export const MAX_INSIGHTS = 5

// کمتر از این اختلاف، نوسان است نه روند.
export const INSIGHT_MIN_GAP = 5

export const MIN_TREND_WEEKS = 3
export const MIN_STREAK = 3
export const MIN_DAYS_FOR_IDLE_CLAIM = 14
export const IDLE_RATIO = 0.4

const percentOf = (doneWeight, totalWeight) =>
  totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 1000) / 10 : 0

export const pluralizeWeekday = (label) => `${label}‌ها`

/**
 * جمع‌بندی یک دسته روز. فقط روزهای گذشته و امروز می‌آیند، مطابق منطق سرور.
 *
 * هم کارت‌های آمار و هم مقایسه با دوره قبل از همین یک فرمول استفاده می‌کنند،
 * تا دو عدد کنار هم با دو تعریف متفاوت ساخته نشوند.
 */
export function summarizeDays(days, todayNumeric) {
  let total = 0
  let done = 0
  let totalWeight = 0
  let doneWeight = 0
  let perfect = 0
  let inactive = 0

  days.forEach((day) => {
    if (day.numeric > todayNumeric) return

    total += day.total
    done += day.done
    totalWeight += day.totalWeight
    doneWeight += day.doneWeight

    // روز کامل با هر دو جفت عدد یک روز است: همه تسک‌ها انجام شده یعنی همه
    // وزن‌ها انجام شده. شمارش اینجا مانده چون مقایسه ارزان‌تری است.
    if (day.total > 0 && day.done === day.total) perfect++
    if (day.total === 0) inactive++
  })

  return { total, done, perfect, inactive, avg: percentOf(doneWeight, totalWeight) }
}

/**
 * تفکیک روزهای هفته.
 *
 * `rowIndex` همان جایگاه روز در ستون نقشه حرارتی است و از شنبه شروع می‌شود، پس
 * بدون محاسبه دوباره تقویم می‌شود روزهای هفته را جدا کرد.
 *
 * سطح رنگ اینجا ساخته نمی‌شود، چون پالت کاربر حالت است و این فایل حالت ندارد.
 * فراخوان با استور پالت آن را اضافه می‌کند.
 */
export function weekdayBuckets(days, todayNumeric, labels) {
  const buckets = labels.map((label, index) => ({
    index,
    label,
    total: 0,
    done: 0,
    totalWeight: 0,
    doneWeight: 0,
    days: 0,
  }))

  days.forEach((day) => {
    if (day.numeric > todayNumeric) return

    const bucket = buckets[day.rowIndex]

    bucket.total += day.total
    bucket.done += day.done
    bucket.totalWeight += day.totalWeight
    bucket.doneWeight += day.doneWeight

    if (day.total > 0) bucket.days++
  })

  return buckets.map((bucket) => ({
    ...bucket,
    percent: percentOf(bucket.doneWeight, bucket.totalWeight),
  }))
}

/**
 * قوی‌ترین و ضعیف‌ترین روز هفته، یا هیچ.
 *
 * دو نگهبان دارد: دست‌کم سه روز هفته باید داده داشته باشند، و اگر درصد بهترین و
 * بدترین روز برابر باشد هیچ الگویی وجود ندارد.
 */
export function weekdayInsightOf(buckets) {
  const active = buckets.filter((day) => day.total > 0)

  if (active.length < MIN_ACTIVE_WEEKDAYS) return null

  const sorted = [...active].sort((a, b) => b.percent - a.percent)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  if (best.percent === worst.percent) return null

  return { best, worst }
}

/**
 * زنجیره روزهای کامل.
 *
 * تعریف روز کامل: روزی که تسک دارد و همه تسک‌هایش انجام شده.
 *
 * تصمیم: روز بدون تسک زنجیره را نمی‌شکند، ولی به آن هم اضافه نمی‌کند.
 * برنامه‌ریزی نکردن برای یک روز شکست نیست، و شمردنش به‌عنوان شکست باعث می‌شد
 * کاربری که آخر هفته استراحت می‌کند هیچ‌وقت زنجیره‌ای بلندتر از پنج روز نبیند.
 */
export function computeStreak(days, todayNumeric) {
  let current = 0
  let currentStart = null
  let best = { length: 0, start: null, end: null }
  let lastBreak = null

  days.forEach((day) => {
    if (day.numeric > todayNumeric || day.total === 0) return

    if (day.done === day.total) {
      current++

      if (current === 1) currentStart = day

      // مساوی هم جایگزین می‌شود تا در تساوی، زنجیره تازه‌تر نشان داده شود.
      if (current >= best.length) best = { length: current, start: currentStart, end: day }

      return
    }

    current = 0
    currentStart = null
    lastBreak = day
  })

  return { current, currentStart: current ? currentStart : null, best, lastBreak }
}

/**
 * طول دنباله یکنوای انتهایی. برای [۸۰، ۷۰، ۶۰] با جهت نزولی، سه برمی‌گرداند.
 */
export function trailingRun(values, isDown) {
  let run = 1

  for (let i = values.length - 1; i > 0; i--) {
    const diff = values[i] - values[i - 1]

    if (isDown ? diff < 0 : diff > 0) run++
    else break
  }

  return run
}

/**
 * دوره‌ای هم‌اندازه بازه، دقیقاً پیش از آن.
 *
 * فقط وقتی ساخته می‌شود که کامل داخل نقشه باشد و بازه هم به آینده نکشیده باشد.
 * مقایسه یک بازه نیمه‌تمام با یک دوره کامل، عدد گمراه‌کننده می‌دهد.
 */
export function previousPeriodStats(gridDays, visibleDays, rangeEndNumeric, todayNumeric) {
  if (!visibleDays.length || rangeEndNumeric > todayNumeric) return null

  const firstIndex = gridDays.findIndex((day) => day.numeric === visibleDays[0].numeric)

  if (firstIndex < visibleDays.length) return null

  const stats = summarizeDays(
    gridDays.slice(firstIndex - visibleDays.length, firstIndex),
    todayNumeric,
  )

  return stats.total > 0 ? stats : null
}

/**
 * جمله‌های بینش.
 *
 * دو قاعده در ساختن جمله‌ها رعایت شد:
 *
 * یک، هر جمله نگهبان خودش را دارد. جمله‌ای که پشتوانه آماری ندارد ساخته نمی‌شود،
 * حتی اگر فهرست کوتاه بماند. ادعای الگو با داده کم بی‌پشتوانه است.
 *
 * دو، هیچ جمله‌ای چیزی را که کارت‌های بالای صفحه می‌گویند تکرار نمی‌کند. بینش
 * یعنی چیزی که از داده درمی‌آید، نه بازخوانی همان عدد. به همین دلیل نه جمله‌ای
 * برای شمار کارهای عقب‌افتاده ساخته می‌شود و نه برای درصد بازدهی کل.
 */
export function buildInsights({
  stats,
  trendPercents = [],
  previousStats = null,
  streak,
  weekday = null,
  months = [],
  pastDays = 0,
}) {
  const list = []

  /* روند هفتگی */
  if (trendPercents.length >= MIN_TREND_WEEKS) {
    const down = trailingRun(trendPercents, true)
    const up = trailingRun(trendPercents, false)

    if (down >= MIN_TREND_WEEKS) {
      list.push({
        key: 'trend-down',
        tone: 'bad',
        text: `در ${toPersianNumber(down)} هفته گذشته بازدهی‌ات پشت سر هم پایین آمده.`,
      })
    } else if (up >= MIN_TREND_WEEKS) {
      list.push({
        key: 'trend-up',
        tone: 'good',
        text: `${toPersianNumber(up)} هفته پیاپی بازدهی‌ات بالا رفته.`,
      })
    }
  }

  /* مقایسه با دوره قبل */
  if (previousStats) {
    const diff = Math.round(stats.avg) - Math.round(previousStats.avg)

    if (Math.abs(diff) >= INSIGHT_MIN_GAP) {
      list.push({
        key: 'previous-period',
        tone: diff > 0 ? 'good' : 'bad',
        text:
          diff > 0
            ? `بازدهی‌ات نسبت به دوره قبل ${toPersianNumber(diff)} درصد بهتر شده.`
            : `بازدهی‌ات نسبت به دوره قبل ${toPersianNumber(-diff)} درصد افت کرده.`,
      })
    }
  }

  /* زنجیره */
  if (streak.current >= MIN_STREAK) {
    list.push({
      key: 'streak-alive',
      tone: 'good',
      text: `${toPersianNumber(streak.current)} روز پیاپی همه تسک‌هایت را تمام کرده‌ای.`,
    })
  } else if (streak.best.length >= MIN_STREAK) {
    list.push({
      key: 'streak-broken',
      tone: 'neutral',
      text: `بلندترین زنجیره‌ات در این بازه ${toPersianNumber(streak.best.length)} روز بوده و الان زنجیره فعالی نداری.`,
    })
  }

  /* الگوی روزهای هفته */
  if (weekday) {
    const best = pluralizeWeekday(weekday.best.label)
    const worst = pluralizeWeekday(weekday.worst.label)

    list.push({
      key: 'weekday',
      tone: 'neutral',
      // وقتی فاصله دو سر خیلی زیاد است، جمله صریح‌تر گفته می‌شود.
      text:
        weekday.worst.percent * 2 <= weekday.best.percent
          ? `${worst} کمتر از نصف ${best} کار می‌کنی.`
          : `${best} قوی‌ترین روز توست و ${worst} ضعیف‌ترین.`,
    })
  }

  /* بهترین و ضعیف‌ترین ماه */
  const activeMonths = months.filter((month) => month.total > 0)

  if (activeMonths.length >= 2) {
    const sorted = [...activeMonths].sort((a, b) => b.percent - a.percent)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]

    if (best.percent - worst.percent >= INSIGHT_MIN_GAP) {
      list.push({
        key: 'months',
        tone: 'neutral',
        text: `بهترین ماهت ${best.title} بوده با ${toPersianNumber(best.percent)} درصد، و ضعیف‌ترین ${worst.title} با ${toPersianNumber(worst.percent)} درصد.`,
      })
    }
  }

  /* روزهای بی‌برنامه */
  if (pastDays >= MIN_DAYS_FOR_IDLE_CLAIM && stats.inactive >= pastDays * IDLE_RATIO) {
    list.push({
      key: 'idle-days',
      tone: 'bad',
      text: `در ${toPersianNumber(stats.inactive)} روز از ${toPersianNumber(pastDays)} روز این بازه هیچ تسکی برنامه‌ریزی نکرده‌ای.`,
    })
  }

  return list.slice(0, MAX_INSIGHTS)
}
