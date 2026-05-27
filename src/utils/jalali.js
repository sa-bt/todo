// jalali.js

import * as jalaali from 'jalaali-js'

// نام ماه‌های شمسی برای نمایش در UI
const SHAMSI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const DAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const pad = number => number.toString().padStart(2, '0')

/**
 * خروجی تاریخ میلادی استاندارد برای API
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function formatGregorianDate(date) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}

/**
 * خروجی تاریخ شمسی استاندارد برای UI
 * @param {Date} date
 * @returns {string} YYYY-MM-DD مثل 1405-03-02
 */
export function formatShamsiDate(date) {
  const { jy, jm, jd } = jalaali.toJalaali(date)

  return `${jy}-${pad(jm)}-${pad(jd)}`
}

/**
 * تبدیل تاریخ میلادی به شمسی برای نمایش
 * ورودی می‌تواند Date یا string میلادی باشد.
 */
export function gregorianToJalali(date) {
  if (!date) return ''

  const normalizedDate = typeof date === 'string'
    ? new Date(date.slice(0, 10))
    : date

  return formatShamsiDate(normalizedDate)
}

/**
 * تاریخ امروز به شمسی
 */
export function getTodayShamsi(date = new Date()) {
  return formatShamsiDate(date)
}

/**
 * تاریخ امروز به میلادی برای API
 */
export function getTodayGregorian(date = new Date()) {
  return formatGregorianDate(date)
}

/**
 * گرفتن بازه هفته جاری شمسی
 *
 * نکته مهم:
 * - start و end برای API هستند و میلادی برمی‌گردند.
 * - shamsiStart و shamsiEnd فقط برای نمایش در UI هستند.
 */
export function getShamsiWeekRange(date = new Date()) {
  const today = new Date(date)

  // روزهای میلادی:
  // 0 = یکشنبه، 1 = دوشنبه، ...، 6 = شنبه
  const todayGregorianDay = today.getDay()

  // هفته شمسی از شنبه شروع می‌شود.
  const daysToSubtract = todayGregorianDay === 6 ? 0 : todayGregorianDay + 1

  const startOfWeekGregorian = new Date(today)
  startOfWeekGregorian.setDate(today.getDate() - daysToSubtract)

  const endOfWeekGregorian = new Date(startOfWeekGregorian)
  endOfWeekGregorian.setDate(startOfWeekGregorian.getDate() + 6)

  return {
    start: formatGregorianDate(startOfWeekGregorian),
    end: formatGregorianDate(endOfWeekGregorian),

    apiStartDate: formatGregorianDate(startOfWeekGregorian),
    apiEndDate: formatGregorianDate(endOfWeekGregorian),

    shamsiStart: formatShamsiDate(startOfWeekGregorian),
    shamsiEnd: formatShamsiDate(endOfWeekGregorian),
  }
}

/**
 * ماه قبل شمسی را محاسبه می‌کند.
 * ورودی و خروجی Date میلادی است، اما منطق حرکت روی ماه شمسی انجام می‌شود.
 *
 * @param {Date} date
 * @returns {Date}
 */
export function getPreviousMonth(date) {
  const { jy, jm } = jalaali.toJalaali(date)

  let newJm = jm - 1
  let newJy = jy

  if (newJm < 1) {
    newJm = 12
    newJy -= 1
  }

  const gDate = jalaali.toGregorian(newJy, newJm, 1)

  return new Date(gDate.gy, gDate.gm - 1, gDate.gd)
}

/**
 * ماه بعد شمسی را محاسبه می‌کند.
 * ورودی و خروجی Date میلادی است، اما منطق حرکت روی ماه شمسی انجام می‌شود.
 *
 * @param {Date} date
 * @returns {Date}
 */
export function getNextMonth(date) {
  const { jy, jm } = jalaali.toJalaali(date)

  let newJm = jm + 1
  let newJy = jy

  if (newJm > 12) {
    newJm = 1
    newJy += 1
  }

  const gDate = jalaali.toGregorian(newJy, newJm, 1)

  return new Date(gDate.gy, gDate.gm - 1, gDate.gd)
}

/**
 * تولید اطلاعات تقویم ماه شمسی
 *
 * قرارداد مهم:
 * - monthName / year / dayOfMonth / shamsiDate برای UI هستند.
 * - isoDate / apiStartDate / apiEndDate برای API و مقایسه با task.day هستند.
 *
 * @param {Date} date تاریخ میلادی فعلی که ماه شمسی را مشخص می‌کند
 */
export function getShamsiMonthInfo(date) {
  const today = new Date()
  const todayGregorian = formatGregorianDate(today)
  const todayShamsi = formatShamsiDate(today)

  const { jy, jm } = jalaali.toJalaali(date)

  const monthName = SHAMSI_MONTH_NAMES[jm - 1]
  const totalDaysInMonth = jalaali.jalaaliMonthLength(jy, jm)

  const firstDayObj = jalaali.toGregorian(jy, jm, 1)
  const firstDayOfMonth = new Date(
    firstDayObj.gy,
    firstDayObj.gm - 1,
    firstDayObj.gd
  )

  const lastDayObj = jalaali.toGregorian(jy, jm, totalDaysInMonth)
  const lastDayOfMonth = new Date(
    lastDayObj.gy,
    lastDayObj.gm - 1,
    lastDayObj.gd
  )

  // شنبه = 0، یکشنبه = 1، ...، جمعه = 6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7

  const grid = []
  let week = Array(7).fill(null)
  let currentDayOfWeek = startDayOfWeek

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const currentGregorian = jalaali.toGregorian(jy, jm, day)

    const currentDate = new Date(
      currentGregorian.gy,
      currentGregorian.gm - 1,
      currentGregorian.gd
    )

    const isoDate = formatGregorianDate(currentDate)
    const shamsiDate = formatShamsiDate(currentDate)

    week[currentDayOfWeek] = {
      dayOfMonth: day,

      // برای API و match با task.day
      isoDate,

      // برای نمایش، دیباگ، یا هر منطق UI شمسی
      shamsiDate,

      isCurrentMonth: true,
      isToday: isoDate === todayGregorian,
    }

    if (currentDayOfWeek === 6) {
      grid.push(week)
      week = Array(7).fill(null)
      currentDayOfWeek = 0
    } else {
      currentDayOfWeek++
    }
  }

  if (currentDayOfWeek !== 0) {
    grid.push(week)
  }

  return {
    monthName,
    year: jy,
    month: jm,

    // تاریخ‌های شمسی فقط برای UI
    shamsiStartDate: formatShamsiDate(firstDayOfMonth),
    shamsiEndDate: formatShamsiDate(lastDayOfMonth),
    todayShamsi,

    // تاریخ‌های میلادی برای API
    apiStartDate: formatGregorianDate(firstDayOfMonth),
    apiEndDate: formatGregorianDate(lastDayOfMonth),
    todayGregorian,

    // برای سازگاری با کدهای قبلی
    // از این به بعد این دو هم میلادی هستند.
    startDate: formatGregorianDate(firstDayOfMonth),
    endDate: formatGregorianDate(lastDayOfMonth),
    today: todayGregorian,

    grid,
    dayNames: DAY_NAMES,
  }
}