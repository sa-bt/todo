<template>
  <section dir="rtl" class="space-y-6">
    <header class="flex flex-col gap-1 border-b border-[var(--color-border)] pb-4">
      <h2 class="text-2xl font-extrabold text-[var(--color-heading)]">آمار بازدید سایت</h2>
      <p class="text-sm text-[var(--color-text-secondary)]">
        همه اعداد این صفحه، بازدید واقعی مرورگرها هستند. بازدید روبات‌ها ثبت می‌شود ولی در
        هیچ‌کدام از این عددها نمی‌آید.
      </p>
    </header>

    <!-- صافی‌ها در یک ردیف بالای همه چیز، و همه چیز زیرشان با همین بازه ساخته می‌شود -->
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex rounded-lg border border-[var(--color-border)] p-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="min-h-9 rounded-md px-3 text-sm font-medium transition"
          :class="
            store.period === tab.value
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text)] hover:bg-[var(--color-background-mute)]'
          "
          @click="store.setPeriod(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!--
        انتخاب‌گر تاریخ شمسی است، همان که گزارش کاربر استفاده می‌کند. فیلد تاریخ
        خود مرورگر تاریخ میلادی نشان می‌داد، و در برنامه‌ای که همه تاریخ‌هایش
        شمسی است این تنها جای ناهماهنگ می‌شد.
      -->
      <div v-if="store.period !== 'overview'" class="flex flex-col gap-1 text-xs">
        <span class="text-[var(--color-text-secondary)]">{{ dateFieldLabel }}</span>
        <Datepicker
          :model-value="jalaliDate"
          format="jYYYY/jMM/jDD"
          type="date"
          locale="fa"
          :input-class="DATE_INPUT_CLASS"
          @update:model-value="onDateChange"
        />
      </div>

      <template v-else>
        <div class="flex flex-col gap-1 text-xs">
          <span class="text-[var(--color-text-secondary)]">از تاریخ</span>
          <Datepicker
            :model-value="jalaliFrom"
            format="jYYYY/jMM/jDD"
            type="date"
            locale="fa"
            :input-class="DATE_INPUT_CLASS"
            @update:model-value="value => onRangeChange(value, store.to)"
          />
        </div>

        <div class="flex flex-col gap-1 text-xs">
          <span class="text-[var(--color-text-secondary)]">تا تاریخ</span>
          <Datepicker
            :model-value="jalaliTo"
            format="jYYYY/jMM/jDD"
            type="date"
            locale="fa"
            :input-class="DATE_INPUT_CLASS"
            @update:model-value="value => onRangeChange(store.from, value)"
          />
        </div>
      </template>

      <p v-if="periodLabel" class="pb-2 text-xs text-[var(--color-text-secondary)]">
        {{ periodLabel }}
      </p>
    </div>

    <p
      v-if="store.error"
      class="rounded-lg border border-rose-400/50 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
    >
      {{ store.error }}
    </p>

    <p
      v-else-if="!store.report && store.loading"
      class="text-sm text-[var(--color-text-secondary)]"
    >
      در حال دریافت آمار…
    </p>

    <!-- هنگام واکشی دوباره، همان نمای قبلی کم‌رنگ می‌ماند تا صفحه نپرد -->
    <div
      v-else-if="store.report"
      class="space-y-6 transition-opacity"
      :class="store.loading ? 'opacity-50' : 'opacity-100'"
    >
      <p
        v-if="store.isEmpty"
        class="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4 text-sm text-[var(--color-text-secondary)]"
      >
        در این بازه هیچ بازدیدی ثبت نشده است. اگر تازه این قابلیت را راه انداخته‌اید، آمار از
        اولین بازدید بعدی پر می‌شود.
      </p>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="بازدید صفحه" :value="store.totals.views" :change="store.change.views" />
        <StatCard
          label="بازدیدکننده یکتا"
          :value="store.totals.unique_visitors"
          :change="store.change.unique_visitors"
        />
        <StatCard label="نشست" :value="store.totals.sessions" :change="store.change.sessions" />
        <StatCard
          label="کاربر واردشده فعال"
          :value="store.totals.active_members"
          :change="store.change.active_members"
        />
        <StatCard
          label="نرخ خروج فوری"
          :value="store.totals.bounce_rate"
          suffix="٪"
          :comparison="previousBounceRate"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <ColumnChart
            :title="seriesTitle"
            :subtitle="seriesSubtitle"
            :points="seriesPoints"
            :label-every="labelEvery"
          />
        </div>

        <div
          v-if="trendPoints.length"
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <TrendLine :title="trendTitle" subtitle="بازدید صفحه" :points="trendPoints" />
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <BreakdownList
            title="منبع ورود"
            :items="store.report.referrer_groups"
            :labels="referrerLabels"
          />
        </div>

        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <BreakdownList title="دستگاه" :items="store.report.devices" :labels="deviceLabels" />
        </div>

        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <BreakdownList title="مرورگر" :items="store.report.browsers" :labels="browserLabels" />
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <BreakdownList
            title="مهمان در برابر کاربر واردشده"
            :items="audienceItems"
            :labels="audienceLabels"
          />

          <p class="mt-3 text-xs text-[var(--color-text-secondary)]">
            بازدیدکننده تازه در این بازه: {{ faNumber(store.totals.new_visitors) }} نفر. میانگین
            مدت هر نشست: {{ averageSession }}.
          </p>
        </div>

        <div
          v-if="referrerHosts.length"
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
        >
          <BreakdownList title="سایت‌های ارجاع‌دهنده" :items="referrerHosts" />
        </div>
      </div>

      <!-- جدول، هم خودش گزارش است و هم نمای متنی همان اعدادِ نمودارها -->
      <div
        class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4"
      >
        <h3 class="mb-3 text-sm font-bold text-[var(--color-heading)]">صفحه‌های پربازدید</h3>

        <p
          v-if="!store.report.top_paths.length"
          class="text-xs text-[var(--color-text-secondary)]"
        >
          داده‌ای در این بازه ثبت نشده.
        </p>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-right text-sm">
            <thead>
              <tr
                class="border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]"
              >
                <th class="py-2 font-medium">صفحه</th>
                <th class="py-2 font-medium">بازدید</th>
                <th class="py-2 font-medium">بازدیدکننده یکتا</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in store.report.top_paths"
                :key="row.path"
                class="border-b border-[var(--color-border)] last:border-0"
              >
                <td class="py-2 text-[var(--color-text)]">
                  <code class="text-xs" dir="ltr">{{ row.path }}</code>
                  <span
                    v-if="pageNames[row.path]"
                    class="mr-2 text-xs text-[var(--color-text-secondary)]"
                  >
                    {{ pageNames[row.path] }}
                  </span>
                </td>
                <td class="py-2 tabular-nums text-[var(--color-text)]">
                  {{ faNumber(row.views) }}
                </td>
                <td class="py-2 tabular-nums text-[var(--color-text-secondary)]">
                  {{ faNumber(row.unique_visitors) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/*
 * گزارش بازدید سایت برای مدیر.
 *
 * تا پیش از این، اعداد همین صفحه دستی و ساختگی بودند و حتی یک کارت «فروش
 * ماهانه» داشت که چنین چیزی در محصول نیست. حالا هر عددی که اینجا دیده می‌شود
 * از بازدید واقعی می‌آید.
 *
 * هیچ محاسبه‌ای اینجا انجام نمی‌شود جز قالب‌بندی. تعریف بازدید و نشست و خروج
 * فوری فقط روی سرور است تا دو جای برنامه دو عدد متفاوت نسازند.
 */
import { computed, onMounted } from 'vue'
import Datepicker from 'vue3-persian-datetime-picker'
import { useAdminAnalyticsStore } from '@/stores/adminAnalytics'
import StatCard from '@/components/Admin/StatCard.vue'
import ColumnChart from '@/components/Admin/ColumnChart.vue'
import TrendLine from '@/components/Admin/TrendLine.vue'
import BreakdownList from '@/components/Admin/BreakdownList.vue'
import { toPersianNumber } from '@/utils/number'
import { gregorianToJalaliInput, jalaliInputToGregorian } from '@/utils/jalali'

const store = useAdminAnalyticsStore()

const DATE_INPUT_CLASS =
  'min-h-9 w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-text)]'

const tabs = [
  { value: 'daily', label: 'روزانه' },
  { value: 'weekly', label: 'هفتگی' },
  { value: 'overview', label: 'بازه دلخواه' },
]

const referrerLabels = {
  direct: 'ورود مستقیم',
  search: 'جست‌وجو',
  social: 'شبکه‌های اجتماعی',
  internal: 'داخل خود سایت',
  other: 'سایر',
}

const deviceLabels = {
  mobile: 'موبایل',
  tablet: 'تبلت',
  desktop: 'رایانه',
}

const browserLabels = {
  chrome: 'کروم',
  firefox: 'فایرفاکس',
  safari: 'سافاری',
  edge: 'اج',
  opera: 'اپرا',
  samsung: 'مرورگر سامسونگ',
  other: 'سایر',
}

const audienceLabels = {
  guest: 'مهمان',
  member: 'کاربر واردشده',
}

/* نام فارسی صفحه‌های شناخته‌شده، کنار مسیر فنی خودشان. */
const pageNames = {
  '/': 'صفحه معرفی',
  '/vorod': 'ورود',
  '/sabtenam': 'ثبت‌نام',
  '/app/day': 'روز',
  '/app/week': 'هفته',
  '/app/month': 'ماه',
  '/app/goals': 'اهداف',
  '/app/year': 'گزارش سال',
  '/app/year-review': 'کارت سال',
  '/app/settings': 'تنظیمات',
  '/app/notifications': 'اعلان‌ها',
  '/admin': 'پنل مدیریت',
}

const faNumber = value => toPersianNumber(Number(value ?? 0).toLocaleString('en-US'))

const dateFieldLabel = computed(() =>
  store.period === 'weekly' ? 'یک روز از هفته موردنظر' : 'تاریخ'
)

/*
 * انبار حالت تاریخ میلادی نگه می‌دارد، چون سرور همان را می‌خواهد. انتخاب‌گر
 * شمسی می‌دهد و می‌گیرد. تبدیل فقط در همین مرز انجام می‌شود.
 */
const jalaliDate = computed(() => gregorianToJalaliInput(store.date))
const jalaliFrom = computed(() => gregorianToJalaliInput(store.from))
const jalaliTo = computed(() => gregorianToJalaliInput(store.to))

function onDateChange(value) {
  const gregorian = jalaliInputToGregorian(value)

  if (gregorian) store.setDate(gregorian)
}

function onRangeChange(from, to) {
  // هر دو سر بازه ممکن است شمسی تازه یا میلادی قبلی باشند.
  const start = jalaliInputToGregorian(from) ?? from
  const end = jalaliInputToGregorian(to) ?? to

  if (start && end) store.setRange(start, end)
}

const periodLabel = computed(() => {
  const period = store.report?.period

  if (!period) return ''

  const from = toPersianNumber(period.jalali_from)

  if (period.days === 1) return `گزارش روز ${from}`

  return `از ${from} تا ${toPersianNumber(period.jalali_to)}`
})

const previousBounceRate = computed(() => {
  const rate = store.previous?.bounce_rate

  if (rate === null || rate === undefined) return 'دوره قبل نشستی نداشت'

  return `دوره قبل: ${toPersianNumber(rate)}٪`
})

const seriesPoints = computed(() => store.report?.series?.points ?? [])

const isHourly = computed(() => store.report?.series?.unit === 'hour')

const seriesTitle = computed(() =>
  isHourly.value ? 'بازدید در ساعت‌های شبانه‌روز' : 'بازدید روزهای این بازه'
)

const seriesSubtitle = computed(() => (isHourly.value ? 'به وقت تهران' : 'هر ستون یک روز'))

/* بیست و چهار برچسب ساعت کنار هم جا نمی‌شود، پس یکی در میان نوشته می‌شود. */
const labelEvery = computed(() => (isHourly.value ? 3 : 1))

const trendPoints = computed(() => store.report?.trend ?? [])

const trendTitle = computed(() =>
  store.period === 'weekly' ? 'روند چهارده هفته گذشته' : 'روند چهارده روز گذشته'
)

const audienceItems = computed(() => {
  if (!store.totals) return []

  return [
    { key: 'guest', views: store.totals.guest_views },
    { key: 'member', views: store.totals.member_views },
  ]
})

const referrerHosts = computed(() =>
  (store.report?.top_referrers ?? []).map(row => ({ key: row.host, views: row.views }))
)

const averageSession = computed(() => {
  const seconds = Number(store.totals?.avg_session_seconds ?? 0)

  if (seconds < 60) return `${toPersianNumber(seconds)} ثانیه`

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${toPersianNumber(minutes)} دقیقه و ${toPersianNumber(rest)} ثانیه`
})

onMounted(() => {
  if (!store.report) store.load()
})
</script>
