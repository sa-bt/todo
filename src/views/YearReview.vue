<script setup>
/*
 * کارت سال من: جمع‌بندی یک سال شمسی در یک صفحه.
 *
 * برخلاف صفحه گزارش، اینجا فیلتر بازه و فیلتر هدف وجود ندارد. موضوع این صفحه
 * کل سال است، همان‌طور که گذشته. سرور همه اعداد را در یک درخواست می‌دهد، پس
 * صفحه هیچ محاسبه‌ای را دوباره انجام نمی‌دهد و عددهای اینجا با صفحه گزارش
 * اختلاف پیدا نمی‌کنند.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jalaali from 'jalaali-js'
import {
  Loader2, Share2, ArrowRight, Star, ListChecks, Flame, CalendarDays,
  TrendingUp, TrendingDown, Minus, Trophy, Sunrise, Activity,
} from 'lucide-vue-next'
import api from '@/plugins/axios'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import { toPersianNumber } from '@/utils/number'
import { useActivityPaletteStore } from '@/stores/activityPalette'
import { SHAMSI_MONTH_NAMES, WEEK_DAY_NAMES_LONG } from '@/utils/jalali'

const route = useRoute()
const router = useRouter()

// رنگ‌بندی از پالت کاربر می‌آید، همان پالتی که صفحه گزارش‌ها دارد.
const palette = useActivityPaletteStore()
const getLevel = (total, done) => palette.getLevel(total, done)

const todayJalali = jalaali.toJalaali(new Date())

// سال آینده هنوز رخ نداده، پس کارت فقط تا سال جاری عقب می‌رود.
const YEAR_SPAN = 5

const years = Array.from(
  { length: YEAR_SPAN + 1 },
  (_, i) => todayJalali.jy - i
)

// با داده کم، ادعای «قوی‌ترین روز» یا «بهترین ماه» پشتوانه ندارد.
const MIN_ACTIVE_WEEKDAYS = 3
const MIN_ACTIVE_MONTHS = 2

// اختلاف کمتر از این، نوسان است نه پیشرفت یا افت.
const MIN_GAP = 5

// «شنبه» به «شنبه‌ها». نیم‌فاصله عمدی است.
const pluralizeWeekday = label => `${label}‌ها`

function parseYearQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value
  const year = parseInt(raw, 10)

  return years.includes(year) ? year : todayJalali.jy
}

const selectedYear = ref(parseYearQuery(route.query.year))

const review = ref(null)
const isLoading = ref(true)
const loadError = ref(null)

async function fetchReview(year) {
  isLoading.value = true
  loadError.value = null

  try {
    const res = await api.get(`/reports/year-review?year=${year}`)

    review.value = res.data?.data || null
  } catch (e) {
    console.error(e)
    review.value = null
    loadError.value = 'دریافت کارت سال ناموفق بود.'
  } finally {
    isLoading.value = false
  }
}

const summary = computed(() => review.value?.summary || null)

const hasData = computed(() => (summary.value?.total_tasks || 0) > 0)

const isCurrentYear = computed(() => selectedYear.value === todayJalali.jy)

/**
 * کلید روز شمسی مثل ۱۴۰۴-۳-۵ به شکل خواندنی فارسی.
 */
const formatDay = key => (key ? toPersianNumber(key.replaceAll('-', '/')) : '')

const percentLabel = value => `${toPersianNumber(Math.round(value))}٪`

/* ===== ماه‌ها ===== */
const months = computed(() =>
  (review.value?.months || []).map(month => ({
    ...month,
    name: SHAMSI_MONTH_NAMES[month.month - 1],
    level: getLevel(month.total, month.done),
  }))
)

const activeMonths = computed(() => months.value.filter(month => month.total > 0))

const bestMonth = computed(() => {
  if (activeMonths.value.length < MIN_ACTIVE_MONTHS) return null

  return [...activeMonths.value].sort((a, b) => b.percent - a.percent)[0]
})

// پرکارترین ماه، نه بهترین ماه. این دو یکی نیستند.
const busiestMonth = computed(() => {
  if (!activeMonths.value.length) return null

  return [...activeMonths.value].sort((a, b) => b.total - a.total)[0]
})

/* ===== روزهای هفته ===== */
const weekdays = computed(() =>
  (review.value?.weekdays || []).map(day => ({
    ...day,
    label: WEEK_DAY_NAMES_LONG[day.index],
  }))
)

const bestWeekday = computed(() => {
  const active = weekdays.value.filter(day => day.total > 0)

  if (active.length < MIN_ACTIVE_WEEKDAYS) return null

  const sorted = [...active].sort((a, b) => b.percent - a.percent)

  // وقتی همه روزها یکسان‌اند، الگویی وجود ندارد.
  return sorted[0].percent === sorted[sorted.length - 1].percent ? null : sorted[0]
})

/* ===== مقایسه با سال قبل ===== */
const previousYear = computed(() => {
  const previous = review.value?.previous_year

  if (!previous) return null

  const diff = Math.round(summary.value.average_percent) - Math.round(previous.average_percent)

  return {
    ...previous,
    diff,
    tone: Math.abs(diff) < MIN_GAP ? 'flat' : (diff > 0 ? 'up' : 'down'),
  }
})

const previousYearText = computed(() => {
  const previous = previousYear.value

  if (!previous) return null

  const year = toPersianNumber(previous.year)
  const tasks = toPersianNumber(previous.total_tasks)

  if (previous.tone === 'flat') {
    return `بازدهی‌ات تقریباً مثل سال ${year} است. آن سال ${tasks} تسک داشتی.`
  }

  const gap = toPersianNumber(Math.abs(previous.diff))

  return previous.tone === 'up'
    ? `نسبت به سال ${year} بازدهی‌ات ${gap} درصد بهتر شده. آن سال ${tasks} تسک داشتی.`
    : `نسبت به سال ${year} بازدهی‌ات ${gap} درصد پایین‌تر است. آن سال ${tasks} تسک داشتی.`
})

/* ===== کارت‌های برجسته ===== */
const highlights = computed(() => {
  if (!hasData.value) return []

  const stats = summary.value
  const streak = review.value.streak
  const busiest = review.value.busiest_day

  const cards = [
    {
      key: 'tasks',
      icon: ListChecks,
      value: toPersianNumber(stats.total_tasks),
      label: 'تسک ثبت‌شده',
      note: `${toPersianNumber(stats.done_tasks)} تسک انجام شد`,
    },
    {
      key: 'percent',
      icon: TrendingUp,
      value: percentLabel(stats.average_percent),
      label: 'بازدهی سال',
      note: `از ${toPersianNumber(stats.active_days)} روز فعال`,
    },
    {
      key: 'perfect',
      icon: Star,
      value: toPersianNumber(stats.perfect_days),
      label: 'روز طلایی',
      note: 'روزی که هیچ تسکی جا نماند',
    },
    {
      key: 'streak',
      icon: Flame,
      value: `${toPersianNumber(streak.length)} روز`,
      label: 'بلندترین زنجیره',
      note: streak.start
        ? `${formatDay(streak.start)} تا ${formatDay(streak.end)}`
        : 'زنجیره‌ای ساخته نشد',
    },
  ]

  if (review.value.first_day) {
    cards.push({
      key: 'first-day',
      icon: Sunrise,
      value: formatDay(review.value.first_day),
      label: 'اولین روز فعال',
      note: 'از اینجا شروع کردی',
    })
  }

  if (busiest) {
    cards.push({
      key: 'busiest-day',
      icon: CalendarDays,
      value: formatDay(busiest.day),
      label: 'پرکارترین روز',
      note: `${toPersianNumber(busiest.done)} از ${toPersianNumber(busiest.total)} تسک`,
    })
  }

  if (bestWeekday.value) {
    cards.push({
      key: 'weekday',
      icon: Activity,
      value: pluralizeWeekday(bestWeekday.value.label),
      label: 'قوی‌ترین روز هفته',
      note: `${percentLabel(bestWeekday.value.percent)} بازدهی`,
    })
  }

  if (busiestMonth.value) {
    cards.push({
      key: 'busiest-month',
      icon: Trophy,
      value: busiestMonth.value.name,
      label: 'پرکارترین ماه',
      note: `${toPersianNumber(busiestMonth.value.total)} تسک`,
    })
  }

  return cards
})

const topGoals = computed(() => review.value?.top_goals || [])

/* ===== اشتراک‌گذاری ===== */
/*
 * متن، نه تصویر. تصویر خروجی کار جداگانه‌ای است و اینجا انجام نشده.
 * روی مرورگری که پنجره اشتراک‌گذاری دارد همان باز می‌شود، وگرنه متن در
 * حافظه موقت کپی می‌شود.
 */
const shareState = ref(null)

const shareText = computed(() => {
  if (!hasData.value) return ''

  const stats = summary.value
  const lines = [
    `کارت سال ${toPersianNumber(selectedYear.value)} من`,
    `${toPersianNumber(stats.total_tasks)} تسک، ${toPersianNumber(stats.done_tasks)} انجام‌شده، ${percentLabel(stats.average_percent)} بازدهی`,
    `${toPersianNumber(stats.perfect_days)} روز طلایی و بلندترین زنجیره ${toPersianNumber(review.value.streak.length)} روز`,
  ]

  if (bestMonth.value) {
    lines.push(`بهترین ماه: ${bestMonth.value.name} با ${percentLabel(bestMonth.value.percent)}`)
  }

  if (bestWeekday.value) {
    lines.push(`قوی‌ترین روز هفته: ${pluralizeWeekday(bestWeekday.value.label)}`)
  }

  if (topGoals.value.length) {
    const best = topGoals.value[0]
    lines.push(`برترین هدف: ${best.title} با ${percentLabel(best.percent)}`)
  }

  return lines.join('\n')
})

async function shareCard() {
  if (!shareText.value) return

  shareState.value = null

  const title = `کارت سال ${toPersianNumber(selectedYear.value)}`

  try {
    if (navigator.share) {
      await navigator.share({ title, text: shareText.value })
      return
    }

    await navigator.clipboard.writeText(shareText.value)
    shareState.value = 'copied'
  } catch (e) {
    // بستن پنجره اشتراک‌گذاری توسط کاربر خطا نیست.
    if (e?.name === 'AbortError') return

    console.error(e)
    shareState.value = 'failed'
  }
}

/* ===== همگام‌سازی سال با نشانی صفحه ===== */
watch(selectedYear, year => {
  shareState.value = null
  fetchReview(year)

  const query = { ...route.query }

  if (year === todayJalali.jy) delete query.year
  else query.year = String(year)

  router.replace({ query }).catch(() => {})
})

// حرکت جلو و عقب مرورگر باید سال را برگرداند.
watch(() => route.query.year, value => {
  if (route.name !== 'yearReview') return

  selectedYear.value = parseYearQuery(value)
})

onMounted(() => fetchReview(selectedYear.value))
</script>

<template>
  <div class="review-page">
    <div class="review-head">
      <RouterLink :to="{ name: 'year' }" class="back-link">
        <ArrowRight class="w-4 h-4"/>
        بازگشت به گزارش
      </RouterLink>

      <div class="head-controls">
        <BaseSelect
          v-model="selectedYear"
          name="review-year"
          :options="years.map(y => ({ value: y, label: toPersianNumber(y) }))"
          size="sm"
          class="year-sel"
        />

        <button
          v-if="hasData"
          type="button"
          class="share-btn"
          @click="shareCard"
        >
          <Share2 class="w-4 h-4"/>
          اشتراک‌گذاری
        </button>
      </div>
    </div>

    <p v-if="shareState === 'copied'" class="share-note">متن کارت در حافظه کپی شد.</p>
    <p v-else-if="shareState === 'failed'" class="share-note is-error">کپی متن کارت ممکن نشد.</p>

    <div v-if="isLoading" class="loading-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary"/>
    </div>

    <div v-else-if="loadError" class="empty-box">{{ loadError }}</div>

    <div v-else-if="!hasData" class="empty-box">
      <b>برای سال {{ toPersianNumber(selectedYear) }} هنوز داده‌ای نیست.</b>
      <span>وقتی تسک‌های این سال ثبت شوند، کارت سال ساخته می‌شود.</span>
    </div>

    <template v-else>
      <!-- سرکارت -->
      <section class="hero">
        <span class="hero-label">کارت سال من</span>
        <b class="hero-year">{{ toPersianNumber(selectedYear) }}</b>
        <span class="hero-percent">{{ percentLabel(summary.average_percent) }} بازدهی</span>
        <span class="hero-note">
          {{ toPersianNumber(summary.done_tasks) }} تسک از
          {{ toPersianNumber(summary.total_tasks) }} تسک
          <template v-if="isCurrentYear">— این سال هنوز تمام نشده است</template>
        </span>
      </section>

      <p v-if="previousYearText" :class="['compare-line', `is-${previousYear.tone}`]">
        <TrendingUp v-if="previousYear.tone === 'up'" class="w-4 h-4"/>
        <TrendingDown v-else-if="previousYear.tone === 'down'" class="w-4 h-4"/>
        <Minus v-else class="w-4 h-4"/>
        <span>{{ previousYearText }}</span>
      </p>

      <!-- کارت‌های برجسته -->
      <div class="highlight-grid">
        <div v-for="card in highlights" :key="card.key" class="highlight-card">
          <span class="highlight-icon"><component :is="card.icon" class="w-5 h-5"/></span>
          <b class="highlight-value">{{ card.value }}</b>
          <span class="highlight-label">{{ card.label }}</span>
          <small class="highlight-note">{{ card.note }}</small>
        </div>
      </div>

      <!-- ماه‌های سال -->
      <section class="panel">
        <div class="panel-head">
          <b>ماه‌های سال</b>
          <small v-if="bestMonth">
            بهترین ماه: {{ bestMonth.name }} با {{ percentLabel(bestMonth.percent) }}
          </small>
          <small v-else>برای مقایسه ماه‌ها به داده بیشتری نیاز است.</small>
        </div>

        <div class="month-chart">
          <div v-for="month in months" :key="month.month" class="month-col">
            <span class="month-value">{{ month.total ? percentLabel(month.percent) : '—' }}</span>
            <div class="month-track">
              <div
                class="month-fill"
                :style="{ height: month.percent + '%', backgroundColor: palette.colors[month.level] }"
              ></div>
            </div>
            <span class="month-name">{{ month.name }}</span>
            <span class="month-count">{{ toPersianNumber(month.total) }}</span>
          </div>
        </div>
      </section>

      <!-- اهداف برتر -->
      <section v-if="topGoals.length" class="panel">
        <div class="panel-head">
          <b>اهداف برتر سال</b>
          <small>ترتیب از بیشترین بازدهی. هدفی که در این سال تسکی نداشته نمی‌آید.</small>
        </div>

        <div class="goal-list">
          <div v-for="(goal, index) in topGoals" :key="goal.id" class="goal-row">
            <span class="goal-index">{{ toPersianNumber(index + 1) }}</span>
            <span class="goal-body">
              <span class="goal-title-row">
                <span class="goal-title">{{ goal.title }}</span>
                <span class="goal-count">
                  {{ toPersianNumber(goal.done) }} از {{ toPersianNumber(goal.total) }}
                </span>
              </span>
              <span class="goal-bar">
                <span :style="{
                  width: goal.percent + '%',
                  backgroundColor: palette.colors[getLevel(goal.total, goal.done)]
                }"></span>
              </span>
            </span>
            <span class="goal-percent" :style="{ color: palette.textColors[getLevel(goal.total, goal.done)] }">
              {{ percentLabel(goal.percent) }}
            </span>
          </div>
        </div>
      </section>

      <p class="review-foot">
        کارت سال همه اهداف را با هم حساب می‌کند و روزهایی که هنوز نرسیده‌اند در آمار نمی‌آیند.
      </p>
    </template>
  </div>
</template>

<style scoped>
.review-page {
  background-color: var(--color-background);
  min-height: 100vh;
  padding: 1.5rem;
  direction: rtl;
  color: var(--color-text);
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-secondary);
  text-decoration: none;
}
.back-link:hover { color: var(--color-primary); }

.head-controls { display: flex; align-items: center; gap: 0.75rem; }
.year-sel { min-width: 120px; }

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  transition: 0.2s;
}
.share-btn:hover { background: color-mix(in srgb, var(--color-primary) 18%, transparent); }

.share-note { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); margin-bottom: 0.75rem; }
.share-note.is-error { color: #DC2626; }

.loading-center { display: flex; align-items: center; justify-content: center; padding: 4rem 0; }

.empty-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2.5rem 1.25rem;
  border-radius: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

/* سرکارت */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 2rem 1.25rem;
  border-radius: 22px;
  text-align: center;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--color-primary) 14%, var(--color-background-soft)),
    var(--color-background-soft)
  );
}
.hero-label { font-size: 12px; font-weight: 800; color: var(--color-text-secondary); }
.hero-year { font-size: 44px; font-weight: 900; line-height: 1.1; color: var(--color-text); }
.hero-percent { font-size: 18px; font-weight: 800; color: var(--color-primary); }
.hero-note { font-size: 12px; color: var(--color-text-secondary); }

.compare-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.8rem 1rem;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}
.compare-line.is-up { color: #059669; }
.compare-line.is-down { color: #DC2626; }
.compare-line.is-flat { color: var(--color-text-secondary); }

/* کارت‌های برجسته */
.highlight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.highlight-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 1rem;
  border-radius: 18px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}
.highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  margin-bottom: 4px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.highlight-value { font-size: 20px; font-weight: 900; }
.highlight-label { font-size: 12px; font-weight: 800; color: var(--color-text-secondary); }
.highlight-note { font-size: 11px; color: var(--color-text-secondary); opacity: 0.85; }

/* پنل‌ها */
.panel {
  padding: 1.1rem;
  border-radius: 20px;
  margin-bottom: 1.25rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}
.panel-head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem; }
.panel-head b { font-size: 14px; font-weight: 900; }
.panel-head small { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }

/* نمودار ماه‌ها */
.month-chart {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 6px;
  overflow-x: auto;
}
.month-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 34px; }
.month-value { font-size: 10px; font-weight: 800; color: var(--color-text-secondary); }
.month-track {
  width: 100%;
  height: 110px;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: var(--color-background-mute);
}
.month-fill { width: 100%; border-radius: 8px 8px 0 0; transition: height 0.3s; }
.month-name { font-size: 10px; font-weight: 800; }
.month-count { font-size: 10px; color: var(--color-text-secondary); }

/* اهداف برتر */
.goal-list { display: flex; flex-direction: column; gap: 8px; }
.goal-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}
.goal-index { font-size: 12px; font-weight: 900; color: var(--color-text-secondary); width: 18px; }
.goal-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.goal-title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.goal-title { font-size: 13px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goal-count { font-size: 11px; color: var(--color-text-secondary); }
.goal-bar { height: 8px; border-radius: 999px; overflow: hidden; background: var(--color-background-mute); }
.goal-bar > span { display: block; height: 100%; border-radius: 999px; transition: width 0.3s; }
.goal-percent { font-size: 13px; font-weight: 900; min-width: 48px; text-align: left; }

.review-foot { font-size: 11px; color: var(--color-text-secondary); text-align: center; }

@media (max-width: 640px) {
  .review-page { padding: 1rem; }
  .hero-year { font-size: 36px; }
  .month-chart { grid-template-columns: repeat(12, 36px); }
}
</style>
