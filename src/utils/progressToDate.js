/*
 * بازدهی «تا امروز».
 *
 * درصد بازدهی هر دوره روی همه تسک‌های آن دوره حساب می‌شود، حتی روزهایی که هنوز
 * نرسیده‌اند. روز سوم هفته، تسک‌های چهار روز آینده هم در مخرج کسرند و عدد بی‌دلیل
 * پایین می‌ماند. این پیمانه همان محاسبه را فقط روی روزهای رسیده انجام می‌دهد.
 *
 * سه قاعده ثابت این فایل:
 *
 * ۱. امروز داخل حساب است. تسک امروز، انجام‌شده یا نشده، در مخرج می‌آید.
 *
 * ۲. قاعده وزن دست نمی‌خورد. شمارش‌ها شمارش می‌مانند و فقط درصد وزنی است، دقیقاً
 *    مثل بقیه گزارش‌ها. پس ممکن است «۱۰ از ۲۰» با درصدی جز پنجاه بیاید.
 *
 * ۳. دیده شدن این عدد فقط به تقویم بسته است، نه به داده. اگر شرط را به «تسک
 *    آینده‌ای وجود دارد یا نه» گره بزنیم، کارت با ساختن یک تسک فردا ظاهر و با
 *    حذفش ناپدید می‌شود.
 */

import { weightedPercent } from './taskWeight'
import { getTodayGregorian } from './jalali'

/** روز تسک به شکل میلادی کوتاه. پاسخ سرور گاهی ساعت هم دارد. */
const dayOf = (task) => task?.day?.slice(0, 10) || ''

/** تسک‌هایی که روزشان رسیده است. امروز داخل حساب است. */
export function tasksUpToToday(tasks, today = getTodayGregorian()) {
  return tasks.filter((task) => {
    const day = dayOf(task)

    return day !== '' && day <= today
  })
}

/**
 * آیا دوره در جریان است؟
 *
 * روز آخر دوره عمداً بیرون است. آن روز، «تا امروز» با «کل دوره» یکی می‌شود و دو
 * کارت با عدد یکسان کنار هم می‌نشیند. دوره تمام‌شده و دوره نرسیده هم بیرون‌اند.
 */
export function isPeriodInProgress(start, end, today = getTodayGregorian()) {
  if (!start || !end) return false

  return today >= start && today < end
}

/**
 * بازدهی تا امروز برای یک دوره.
 *
 * `applicable` نادرست یعنی این عدد حرف تازه‌ای ندارد و صفحه نباید نشانش دهد.
 */
export function progressToDate(tasks, { start, end, today = getTodayGregorian() } = {}) {
  if (!isPeriodInProgress(start, end, today)) {
    return { applicable: false, total: 0, done: 0, percent: 0 }
  }

  const arrived = tasksUpToToday(tasks, today)

  return {
    applicable: true,
    total: arrived.length,
    done: arrived.filter((task) => task.is_done).length,
    percent: weightedPercent(arrived),
  }
}
