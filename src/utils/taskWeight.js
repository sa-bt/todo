/*
 * سهم هر تسک در درصد پیشرفت.
 *
 * قاعده اصلی این فایل: **شمارش‌ها شمارش می‌مانند، فقط درصدها وزنی می‌شوند.**
 * اگر وزن روی شمارش هم اعمال شود، روزی که پنج تسک دارد جمله «۹ از ۱۵ تسک» را
 * نشان می‌دهد، و همان‌جا عدد بی‌معنی می‌شود.
 *
 * وزن از اولویت هدف می‌آید و سرور آن را آماده روی هر تسک می‌فرستد. پس نگاشت
 * اولویت به عدد فقط یک جا نگه‌داری می‌شود و آن یک جا سمت سرور است. اینجا هیچ
 * چیزی درباره «بالا» و «متوسط» و «پایین» نوشته نشده و نباید نوشته شود.
 */

/** وزن تسکی که سرور برایش عددی نفرستاده. برابر اولویت متوسط است. */
export const DEFAULT_TASK_WEIGHT = 2

export function taskWeight(task) {
  const weight = Number(task?.weight)

  return Number.isFinite(weight) && weight > 0 ? weight : DEFAULT_TASK_WEIGHT
}

/**
 * جمع وزن کل و وزن انجام‌شده یک فهرست تسک.
 *
 * جدا از تابع درصد نگه داشته شده، چون جاهایی مثل نقشه حرارتی به خود دو عدد
 * نیاز دارند تا رنگ سطح را با همان دقت مقایسه ضربی حساب کنند.
 */
export function weightTotals(tasks) {
  let total = 0
  let done = 0

  for (const task of tasks) {
    const weight = taskWeight(task)

    total += weight

    if (task?.is_done) done += weight
  }

  return { total, done }
}

/** درصد پیشرفت وزنی یک فهرست تسک، گرد شده به عدد صحیح. */
export function weightedPercent(tasks) {
  const { total, done } = weightTotals(tasks)

  return total > 0 ? Math.round((done / total) * 100) : 0
}
