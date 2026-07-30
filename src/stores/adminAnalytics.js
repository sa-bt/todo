// stores/adminAnalytics.js
/*
 * آمار بازدید سایت برای پنل مدیریت.
 *
 * سه نما دارد: روزانه، هفتگی و بازه دلخواه. هر سه از یک ساختار پاسخ می‌آیند،
 * پس صفحه گزارش لازم نیست برای هر نما شکل جدا بشناسد.
 *
 * محاسبه هیچ عددی اینجا انجام نمی‌شود. سرور یک تعریف از بازدید و نشست و خروج
 * فوری دارد و همان تعریف باید تنها تعریف بماند، وگرنه دو عدد کنار هم با دو
 * فرمول ساخته می‌شوند.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getVisitAnalytics } from '@/plugins/api'

export const PERIODS = {
  daily: 'daily',
  weekly: 'weekly',
  overview: 'overview',
}

/** تاریخ میلادی امروز به شکلی که سرور می‌خواهد. */
function todayIso() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function isoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  const pad = value => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const useAdminAnalyticsStore = defineStore('adminAnalytics', () => {
  const period = ref(PERIODS.daily)
  const date = ref(todayIso())
  const from = ref(isoDaysAgo(29))
  const to = ref(todayIso())

  const report = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /*
   * روزی که هنوز هیچ بازدیدی ثبت نشده با روزی که داده‌اش صفر است فرقی ندارد،
   * ولی صفحه باید بین «چیزی نیست» و «هنوز نیامده» فرق بگذارد.
   */
  const isEmpty = computed(() => report.value !== null && report.value.totals?.views === 0)

  const totals = computed(() => report.value?.totals ?? null)
  const previous = computed(() => report.value?.previous ?? null)
  const change = computed(() => report.value?.change ?? {})

  function paramsFor(current) {
    if (current === PERIODS.overview) {
      return { from: from.value, to: to.value }
    }

    return { date: date.value }
  }

  async function load() {
    loading.value = true
    error.value = null

    try {
      report.value = await getVisitAnalytics(period.value, paramsFor(period.value))
    } catch (err) {
      /*
       * گزارش قبلی پاک می‌شود. نگه داشتنش یعنی صفحه اعداد بازه‌ای را نشان
       * دهد که کاربر دیگر انتخابش نکرده.
       */
      report.value = null
      error.value =
        err?.response?.data?.errors?.[0] ??
        err?.response?.data?.message ??
        'دریافت آمار بازدید ممکن نشد.'
    } finally {
      loading.value = false
    }
  }

  async function setPeriod(next) {
    if (!PERIODS[next] || period.value === next) return

    period.value = next

    await load()
  }

  async function setDate(next) {
    date.value = next

    await load()
  }

  async function setRange(nextFrom, nextTo) {
    from.value = nextFrom
    to.value = nextTo

    await load()
  }

  return {
    period,
    date,
    from,
    to,
    report,
    loading,
    error,
    isEmpty,
    totals,
    previous,
    change,
    load,
    setPeriod,
    setDate,
    setRange,
  }
})
