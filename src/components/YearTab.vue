<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jalaali from 'jalaali-js'
import Datepicker from 'vue3-persian-datetime-picker'
import api from '@/plugins/axios'
import {
  ListChecks, CheckCircle2, Star, CalendarDays, Zap, LayoutGrid, Hash, Calendar, X, Loader2,
  Moon, TrendingUp, Target, CalendarRange, Circle, AlertTriangle, Trophy, ArrowUpDown,
  Activity, Flame, HeartCrack, Lightbulb, Sparkles, Palette // ✅ آیکون‌های جدید اضافه شدند
} from 'lucide-vue-next'
import BaseSelect from './UI/BaseSelect.vue'
import PaletteEditor from './Activity/PaletteEditor.vue'
import PageHeader from './UI/PageHeader.vue'
import StatCard from './UI/StatCard.vue'
import EmptyState from './UI/EmptyState.vue'
import { toPersianNumber } from '@/utils/number'
import { weightedPercent } from '@/utils/taskWeight'
import { useActivityPaletteStore } from '@/stores/activityPalette'
import {
  SHAMSI_MONTH_NAMES as monthNames,
  WEEK_DAY_NAMES_SHORT as weekDaysShort,
  WEEK_DAY_NAMES_LONG as weekDaysLong,
} from '@/utils/jalali'
/*
 * تحلیل روزها (جمع‌بندی، الگوی روزهای هفته، زنجیره و جمله‌های بینش) از این صفحه
 * بیرون کشیده شد تا آزمون‌پذیر باشد. تصمیم‌ها و نگهبان‌های هر محاسبه، همراه خودش
 * به همان فایل رفتند.
 */
import {
  buildInsights,
  computeStreak,
  pluralizeWeekday,
  previousPeriodStats,
  summarizeDays,
  weekdayBuckets,
  weekdayInsightOf,
} from '@/utils/activityInsights'

/* ===== تنظیمات ظاهری ===== */
/*
 * رنگ‌بندی این صفحه از پالت کاربر می‌آید، نه از رنگ ثابت.
 *
 * قاعده: یک درصد، یک رنگ. پس سطح روز، هفته، ماه، هدف و روز هفته همه از یک
 * تابع می‌آیند و رنگ‌های معنایی صفحه (کارت عقب‌افتاده، بینش، زنجیره) هم از دو سر
 * همین پالت. کاربر می‌تواند رنگ‌ها، دامنه‌ها و حتی تعداد سطح‌ها را عوض کند.
 */
const palette = useActivityPaletteStore()

const getLevel = (total, done, isFuture = false) => palette.getLevel(total, done, isFuture)

const CELL = 14
const GAP  = 2

// ترتیب همین شیء، ترتیب دکمه‌های بالای صفحه است. کلیدها در نشانی صفحه هم می‌آیند.
const TAB_LABELS = {
  yearly: 'سالانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  goals: 'اهداف',
  pattern: 'الگو',
}

/* ===== تشخیص زمان ===== */
const todayObj = jalaali.toJalaali(new Date())
const todayNumeric = todayObj.jy * 10000 + todayObj.jm * 100 + todayObj.jd
const todayKey = computed(() => `${todayObj.jy}-${todayObj.jm}-${todayObj.jd}`)

const YEAR_SPAN = 5
const RELATIVE_RANGE_DAYS = { last30: 30, last90: 90, last180: 180 }

// همان سقفی که سرور برای یک گزارش می‌پذیرد. بازه بلندتر از این بریده می‌شود.
const GRID_MAX_DAYS = 1100

/* ===== ابزارهای تاریخ ===== */
const pad = value => String(value).padStart(2, '0')

const toNumeric = (jy, jm, jd) => jy * 10000 + jm * 100 + jd

const formatGregorian = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const isLeap = year => ((year * 8 + 29) % 33) < 8

function jalaliToDate(jy, jm, jd) {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)

  return new Date(gy, gm - 1, gd)
}

/**
 * ورودی Datepicker با قالب jYYYY/jMM/jDD می‌آید.
 * خروجی، تاریخ میلادی همان روز است.
 */
function parseJalaliInput(value) {
  if (!value) return null

  const parts = String(value).split(/[/\-]/).map(part => parseInt(part, 10))

  if (parts.length !== 3 || parts.some(Number.isNaN)) return null

  const [jy, jm, jd] = parts

  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null

  return jalaliToDate(jy, jm, jd)
}

const dateToNumeric = date => {
  const { jy, jm, jd } = jalaali.toJalaali(date)

  return toNumeric(jy, jm, jd)
}

// نیمه‌شب محلی، تا جابه‌جایی ساعت روی شمارش روز اثر نگذارد.
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate())

function addDays(date, count) {
  const next = startOfDay(date)
  next.setDate(next.getDate() + count)

  return next
}

// طول بازه شامل هر دو سر.
const rangeLength = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86400000) + 1

/* ===== همگام‌سازی فیلترها با نشانی صفحه ===== */
/*
 * گزارش باید قابل نشانه‌گذاری باشد و تازه‌سازی صفحه نباید فیلترها را از بین ببرد.
 * فقط همین شش کلید متعلق به این صفحه‌اند؛ بقیه پارامترهای نشانی دست‌نخورده می‌مانند.
 */
const route = useRoute()
const router = useRouter()

const OWNED_QUERY_KEYS = ['tab', 'year', 'goal', 'range', 'from', 'to']
const TAB_KEYS = Object.keys(TAB_LABELS)
const RANGE_KEYS = ['year', 'last30', 'last90', 'last180', 'custom']

// vue-router برای کلید تکراری آرایه می‌دهد.
const readQueryValue = value => (Array.isArray(value) ? value[0] : value)

function parseTabQuery(value) {
  const raw = readQueryValue(value)

  return TAB_KEYS.includes(raw) ? raw : 'yearly'
}

function parseYearQuery(value) {
  const year = parseInt(readQueryValue(value), 10)

  if (Number.isNaN(year)) return todayObj.jy

  return Math.abs(year - todayObj.jy) <= YEAR_SPAN ? year : todayObj.jy
}

// درستی مالکیت هدف بعد از رسیدن فهرست اهداف بررسی می‌شود.
function parseGoalQuery(value) {
  const goalId = parseInt(readQueryValue(value), 10)

  return Number.isNaN(goalId) || goalId < 1 ? null : goalId
}

function parseRangeQuery(value, year) {
  const raw = readQueryValue(value)

  if (!RANGE_KEYS.includes(raw)) return 'year'

  // بازه نسبی فقط برای سال جاری معنا دارد.
  if (RELATIVE_RANGE_DAYS[raw] && year !== todayObj.jy) return 'year'

  return raw
}

/**
 * تاریخ نشانی صفحه به همان قالبی برمی‌گردد که Datepicker می‌فهمد.
 */
function parseDateQuery(value) {
  const raw = readQueryValue(value)

  if (!raw) return null

  const parts = String(raw).split(/[/\-]/).map(part => parseInt(part, 10))

  if (parts.length !== 3 || parts.some(Number.isNaN)) return null

  const [jy, jm, jd] = parts

  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null

  return `${jy}/${pad(jm)}/${pad(jd)}`
}

function readFiltersFromQuery(query) {
  const year = parseYearQuery(query.year)
  const range = parseRangeQuery(query.range, year)

  return {
    tab: parseTabQuery(query.tab),
    year,
    goal: parseGoalQuery(query.goal),
    range,
    from: range === 'custom' ? parseDateQuery(query.from) : null,
    to: range === 'custom' ? parseDateQuery(query.to) : null,
  }
}

const initialFilters = readFiltersFromQuery(route.query)

/* ===== وضعیت (State) ===== */
const activitiesData = ref({})
const activeTab = ref(initialFilters.tab)
const heatmapContainer = ref(null)
const isLoading = ref(true)
const tip = ref({ show: false, x: 0, y: 0, data: null, isMobile: false })
const tooltipRef = ref(null)
const emit = defineEmits(['view-tasks'])

const selectedYear = ref(initialFilters.year)
const years = computed(() =>
  Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, i) => todayObj.jy - YEAR_SPAN + i)
)

const isCurrentYear = computed(() => selectedYear.value === todayObj.jy)

/* ===== فیلتر هدف ===== */
const goalFilter = ref(initialFilters.goal)
const goalList = ref([])

const goalOptions = computed(() => [
  { value: null, label: 'همه اهداف' },
  ...goalList.value.map(goal => ({ value: goal.id, label: goal.title })),
])

/* ===== فیلتر بازه ===== */
const rangeKey = ref(initialFilters.range)
const customStart = ref(initialFilters.from)
const customEnd = ref(initialFilters.to)

const rangeOptions = computed(() => {
  const options = [{ value: 'year', label: 'کل سال' }]

  // بازه‌های نسبی فقط وقتی معنا دارند که سال جاری انتخاب شده باشد.
  if (isCurrentYear.value) {
    options.push(
      { value: 'last30', label: '۳۰ روز اخیر' },
      { value: 'last90', label: '۳ ماه اخیر' },
      { value: 'last180', label: '۶ ماه اخیر' },
    )
  }

  options.push({ value: 'custom', label: 'بازه دلخواه' })

  return options
})

/* ===== Logic: Fetch & Scroll ===== */
/*
 * گزارش بر پایه بازه گرفته می‌شود، نه سال. به همین دلیل بازه‌ای که سال شمسی را
 * قطع می‌کند دیگر بریده نمی‌شود.
 */
async function fetchActivities(range, goalId = null){
  isLoading.value = true;
  try{
    const query = new URLSearchParams({
      from: formatGregorian(range.start),
      to: formatGregorian(range.end),
    })
    if (goalId) query.append('goal_id', goalId)

    const res = await api.get(`/reports/activity?${query}`)

    activitiesData.value = res.data?.data?.days || {}

    if (todayNumeric >= dateToNumeric(range.start) && todayNumeric <= dateToNumeric(range.end)) {
      nextTick(autoScroll);
    }
  }catch(e){
    console.error(e);
    activitiesData.value = {}
  } finally {
    isLoading.value = false;
  }
}

/**
 * فهرست اهداف قابل انتخاب برای فیلتر.
 * بدون واسطه store خوانده می‌شود تا cache وابسته به query در store دخالت نکند.
 */
async function fetchGoalOptions() {
  try {
    const res = await api.get('/goals?without_children=1')
    goalList.value = (res.data?.data || []).filter(goal => goal?.id && goal?.title)

    // هدفی که از نشانی صفحه آمده ممکن است متعلق به این کاربر نباشد یا حذف شده باشد.
    if (goalFilter.value && !goalList.value.some(goal => goal.id === goalFilter.value)) {
      goalFilter.value = null
    }
  } catch (e) {
    console.error(e)
    goalList.value = []
  }
}

/* ===== نرخ جاماندگی ===== */
/*
 * برخلاف بقیه کارت‌ها، این عدد به بازه انتخاب‌شده وابسته نیست.
 * هر تسک گذشته و انجام‌نشده، عقب‌افتاده است.
 */
const EMPTY_BACKLOG = { count: 0, returned: 0, oldest: null, daysBehind: 0, tasks: [] }

const backlog = ref({ ...EMPTY_BACKLOG })
const backlogLoading = ref(true)

async function fetchBacklog(goalId = null) {
  backlogLoading.value = true

  try {
    const query = new URLSearchParams()
    if (goalId) query.append('goal_id', goalId)

    const suffix = query.toString() ? `?${query}` : ''
    const res = await api.get(`/reports/backlog${suffix}`)
    const data = res.data?.data || {}

    backlog.value = {
      count: data.count || 0,
      returned: data.returned || 0,
      oldest: data.oldest_day_shamsi || null,
      daysBehind: data.days_behind || 0,
      tasks: data.tasks || [],
    }
  } catch (e) {
    console.error(e)
    backlog.value = { ...EMPTY_BACKLOG }
  } finally {
    backlogLoading.value = false
  }
}

function autoScroll() {
  const el = heatmapContainer.value?.querySelector('.today-cell');
  if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

/* ===== رتبه‌بندی اهداف ===== */
/*
 * فیلتر هدف عمداً روی این گزارش اثر ندارد. هدف این تب مقایسه اهداف با یکدیگر است،
 * پس همیشه همه اهداف می‌آیند و هدف انتخاب‌شده فقط برجسته می‌شود.
 * داده فقط وقتی گرفته می‌شود که کاربر واقعاً وارد این تب شود.
 */
const ranking = ref([])
const rankingLoading = ref(false)
const rankingError = ref(null)
const rankingOrder = ref('desc')

let fetchedRankingKey = null

const sortedRanking = computed(() =>
  rankingOrder.value === 'desc' ? ranking.value : [...ranking.value].reverse()
)

const rankingSummary = computed(() => {
  const goals = ranking.value

  if (goals.length < 2) return null

  return { best: goals[0], worst: goals[goals.length - 1] }
})

async function fetchGoalRanking(range) {
  rankingLoading.value = true
  rankingError.value = null

  try {
    const query = new URLSearchParams({ from: range.from, to: range.to })
    const res = await api.get(`/reports/goal-ranking?${query}`)

    ranking.value = res.data?.data?.goals || []
  } catch (e) {
    console.error(e)
    ranking.value = []
    rankingError.value = 'دریافت رتبه‌بندی اهداف ناموفق بود.'
    fetchedRankingKey = null
  } finally {
    rankingLoading.value = false
  }
}

// Retry for the goal-ranking error state: rebuilds the request from the range
// currently on screen, so the button works without touching the filters.
function retryGoalRanking() {
  const range = rangeGregorian.value

  if (!range) return

  fetchedRankingKey = `${range.from}:${range.to}`
  fetchGoalRanking(range)
}

function toggleRankingOrder() {
  rankingOrder.value = rankingOrder.value === 'desc' ? 'asc' : 'desc'
}

// کلیک روی یک ردیف، همان هدف را در بقیه تب‌ها فیلتر می‌کند.
function toggleRankingGoal(goalId) {
  goalFilter.value = goalFilter.value === goalId ? null : goalId
}

/* ===== محاسبات تقویم ===== */
/*
 * سال انتخاب‌شده، به تاریخ میلادی.
 */
const yearRange = computed(() => {
  const year = selectedYear.value

  return {
    start: jalaliToDate(year, 1, 1),
    end: jalaliToDate(year, 12, isLeap(year) ? 30 : 29),
  }
})

/**
 * بازه‌ای که کاربر خواسته است. برخلاف قبل، به سال انتخاب‌شده بریده نمی‌شود.
 */
const requestedRange = computed(() => {
  const year = yearRange.value

  if (rangeKey.value === 'custom') {
    const first = parseJalaliInput(customStart.value)
    const last = parseJalaliInput(customEnd.value)

    if (!first && !last) return year

    // سر خالی از سال انتخاب‌شده پر می‌شود. ترتیب معکوس هم پذیرفته است.
    const low = first ?? year.start
    const high = last ?? year.end

    return low <= high ? { start: low, end: high } : { start: high, end: low }
  }

  const relativeDays = RELATIVE_RANGE_DAYS[rangeKey.value]

  if (relativeDays) {
    const end = startOfDay(new Date())

    return { start: addDays(end, -(relativeDays - 1)), end }
  }

  return year
})

/**
 * روزهایی که نقشه حرارتی می‌کشد و از سرور گرفته می‌شوند.
 *
 * اتحاد سال انتخاب‌شده و بازه خواسته‌شده است، تا هم بازه‌ای که از سال بیرون
 * می‌زند کامل دیده شود، هم روزهای بیرون بازه مثل قبل کم‌رنگ سر جایشان بمانند.
 */
const gridRange = computed(() => {
  const year = yearRange.value
  const requested = requestedRange.value

  let start = requested.start < year.start ? requested.start : year.start
  let end = requested.end > year.end ? requested.end : year.end

  // سقف سرور. اول اتحاد با سال کنار می‌رود، بعد خود بازه از ابتدا کوتاه می‌شود.
  if (rangeLength(start, end) > GRID_MAX_DAYS) {
    start = requested.start
    end = requested.end
  }

  if (rangeLength(start, end) > GRID_MAX_DAYS) {
    start = addDays(end, -(GRID_MAX_DAYS - 1))
  }

  return { start, end }
})

// کلید متنی، تا تغییر بی‌اثر فیلترها درخواست تازه نسازد.
const gridRangeKey = computed(() =>
  `${formatGregorian(gridRange.value.start)}:${formatGregorian(gridRange.value.end)}`
)

// بازه خواسته‌شده از سقف بلندتر بوده و ابتدایش بریده شده است.
const isRangeClamped = computed(() => requestedRange.value.start < gridRange.value.start)

const gridDays = computed(() => {
  const { start, end } = gridRange.value
  const startWeekday = (start.getDay() + 1) % 7

  return Array.from({ length: rangeLength(start, end) }, (_, i) => {
    const dateObj = addDays(start, i)
    const { jy, jm, jd } = jalaali.toJalaali(dateObj)
    const key = `${jy}-${jm}-${jd}`
    /*
     * هر روز چهار عدد دارد، نه دو تا.
     *
     * `total` و `done` شمار تسک‌اند و هرجا عددی به کاربر نشان داده می‌شود از
     * همین دو می‌آید. `totalWeight` و `doneWeight` جمع وزن‌اند و فقط درصد و
     * رنگ سطح را می‌سازند. سرور هر چهار را می‌فرستد.
     *
     * پیش‌فرض وزن برابر شمارش گرفته شده تا اگر روزی پاسخ سرور قدیمی باشد،
     * صفحه به رفتار قبلی برگردد نه به صفر.
     */
    const d = activitiesData.value[key] || { total: 0, done: 0 }
    const totalWeight = d.total_weight ?? d.total
    const doneWeight = d.done_weight ?? d.done
    const dayNum = toNumeric(jy, jm, jd)
    const isFuture = dayNum > todayNumeric

    return {
      rowIndex: (i + startWeekday) % 7, colIndex: Math.floor((i + startWeekday) / 7),
      key, jy, jm, jd, total: d.total, done: d.done, totalWeight, doneWeight,
      numeric: dayNum,
      gDate: formatGregorian(dateObj),
      percent: totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0,
      level: getLevel(totalWeight, doneWeight, isFuture),
      dateStart: `${jy}/${jm}/${jd}`, isFuture
    }
  })
})

// نقشه وقتی بیش از یک سال شمسی را می‌پوشاند، نام ماه به‌تنهایی گویا نیست.
const isMultiYearGrid = computed(() => {
  const days = gridDays.value

  return days.length > 0 && days[0].jy !== days[days.length - 1].jy
})

const monthLabel = (jy, jm) =>
  isMultiYearGrid.value ? `${monthNames[jm - 1]} ${toPersianNumber(jy)}` : monthNames[jm - 1]

/**
 * مرز بازه انتخاب‌شده، به شکل عددی شمسی.
 */
const rangeBounds = computed(() => {
  const days = gridDays.value

  if (!days.length) return { start: 0, end: 0 }

  return {
    start: Math.max(days[0].numeric, dateToNumeric(requestedRange.value.start)),
    end: Math.min(days[days.length - 1].numeric, dateToNumeric(requestedRange.value.end)),
  }
})

// بازه انتخاب‌شده دقیقاً همان چیزی است که نقشه می‌کشد.
const isFullRange = computed(() => {
  const days = gridDays.value

  if (!days.length) return true

  return rangeBounds.value.start === days[0].numeric
    && rangeBounds.value.end === days[days.length - 1].numeric
})

const isInRange = day => day.numeric >= rangeBounds.value.start && day.numeric <= rangeBounds.value.end

const visibleDays = computed(() => gridDays.value.filter(isInRange))

const isEmptyRange = computed(() => !visibleDays.value.length)

// مرز بازه به تاریخ میلادی، همان چیزی که سرور می‌خواهد.
const rangeGregorian = computed(() => {
  const days = visibleDays.value

  if (!days.length) return null

  return { from: days[0].gDate, to: days[days.length - 1].gDate }
})

const rangeLabel = computed(() => {
  const days = visibleDays.value

  if (!days.length) return 'بازه‌ای انتخاب نشده'

  return `${days[0].dateStart} تا ${days[days.length - 1].dateStart}`
})

// آمار کارت‌ها، تابع بازه انتخاب‌شده.
const rangeStats = computed(() => summarizeDays(visibleDays.value, todayNumeric))

/* ===== الگوی روزهای هفته ===== */
/*
 * تفکیک در پیمانه تحلیل انجام می‌شود؛ سطح رنگ اینجا اضافه می‌شود، چون پالت کاربر
 * حالت است و آن پیمانه حالت ندارد.
 */
const weekdayStats = computed(() =>
  weekdayBuckets(visibleDays.value, todayNumeric, weekDaysLong).map(bucket => ({
    ...bucket,
    level: getLevel(bucket.totalWeight, bucket.doneWeight),
  }))
)

const weekdayInsight = computed(() => weekdayInsightOf(weekdayStats.value))

/* ===== زنجیره در سطح بازه ===== */
// زنجیره مثل بقیه این صفحه محدود به بازه و فیلتر هدف انتخاب‌شده است.
const streakStats = computed(() => computeStreak(visibleDays.value, todayNumeric))

const hasPastActivity = computed(() =>
  visibleDays.value.some(day => day.numeric <= todayNumeric && day.total > 0)
)

/* ===== بینش خودکار ===== */
/*
 * جمله‌ها از همان داده‌ای ساخته می‌شوند که در صفحه هست، پس درخواست تازه‌ای لازم
 * نیست و همه‌شان تابع بازه و فیلتر هدف انتخاب‌شده‌اند.
 *
 * قاعده‌ها و آستانه‌های ساختن جمله‌ها در پیمانه تحلیل هستند. اینجا فقط داده همان
 * لحظه صفحه به آن داده می‌شود.
 */

// هفته‌های تمام‌شده‌ای که تسک داشتند. هفته ناقص یا خالی روند نمی‌سازد.
const trendWeeks = computed(() =>
  weeklyStats.value.filter(week => week.endNumeric <= todayNumeric && week.total > 0)
)

/**
 * دوره‌ای هم‌اندازه بازه، دقیقاً پیش از آن. شرط‌هایش در پیمانه تحلیل است.
 */
const previousPeriod = computed(() =>
  previousPeriodStats(gridDays.value, visibleDays.value, rangeBounds.value.end, todayNumeric)
)

// روزهای گذشته بازه، پایه ادعای «روزهای بی‌برنامه».
const pastDaysCount = computed(
  () => visibleDays.value.filter(day => day.numeric <= todayNumeric).length
)

const insights = computed(() =>
  buildInsights({
    stats: rangeStats.value,
    trendPercents: trendWeeks.value.map(week => week.percent),
    previousStats: previousPeriod.value,
    streak: streakStats.value,
    weekday: weekdayInsight.value,
    months: monthlyStats.value,
    pastDays: pastDaysCount.value,
  })
)

/**
 * ماه‌های موجود در نقشه، به ترتیب. ماه اول هر گروه ستون شروع برچسب را می‌دهد.
 */
const gridMonths = computed(() => {
  const groups = []

  gridDays.value.forEach(day => {
    const last = groups[groups.length - 1]

    if (last && last.jy === day.jy && last.jm === day.jm) {
      last.days.push(day)
      return
    }

    groups.push({ jy: day.jy, jm: day.jm, days: [day] })
  })

  return groups
})

const gridColumns = computed(() => {
  const days = gridDays.value

  return days.length ? days[days.length - 1].colIndex + 1 : 0
})

const monthSpans = computed(() => {
  const months = gridMonths.value

  return months.map((month, i) => ({
    key: `${month.jy}-${month.jm}`,
    name: monthLabel(month.jy, month.jm),
    start: month.days[0].colIndex,
    end: i < months.length - 1 ? months[i + 1].days[0].colIndex : gridColumns.value,
  }))
})

/**
 * مرز هفته‌ها همیشه از ابتدای نقشه محاسبه می‌شود تا با تغییر بازه جابه‌جا نشود.
 * سپس فقط هفته‌هایی که با بازه هم‌پوشانی دارند نمایش داده می‌شوند.
 */
const weeklyStatsAll = computed(() => {
  const weeks = []
  for (let i = 0; i < gridDays.value.length; i += 7) {
    const chunk = gridDays.value.slice(i, i + 7)
    const last = chunk[chunk.length - 1]
    const total = chunk.reduce((s, d) => s + d.total, 0)
    const done = chunk.reduce((s, d) => s + d.done, 0)
    const totalWeight = chunk.reduce((s, d) => s + d.totalWeight, 0)
    const doneWeight = chunk.reduce((s, d) => s + d.doneWeight, 0)
    const isFuture = chunk[0].numeric > todayNumeric
    weeks.push({
      title: `هفته ${Math.floor(i / 7) + 1}`,
      dateStart: chunk[0].dateStart, dateEnd: last.dateStart,
      gStart: chunk[0].gDate, gEnd: last.gDate,
      startNumeric: chunk[0].numeric, endNumeric: last.numeric,
      total, done, totalWeight, doneWeight,
      percent: totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0,
      level: getLevel(totalWeight, doneWeight, isFuture), isCurrent: chunk.some(d => d.key === todayKey.value)
    })
  }
  return weeks
})

const weeklyStats = computed(() =>
  weeklyStatsAll.value.filter(
    w => w.endNumeric >= rangeBounds.value.start && w.startNumeric <= rangeBounds.value.end
  )
)

const monthlyStatsAll = computed(() => {
  return gridMonths.value.map(({ jy, jm, days }) => {
    const last = days[days.length - 1]
    const total = days.reduce((s, d) => s + d.total, 0)
    const done = days.reduce((s, d) => s + d.done, 0)
    const totalWeight = days.reduce((s, d) => s + d.totalWeight, 0)
    const doneWeight = days.reduce((s, d) => s + d.doneWeight, 0)
    const isFuture = (jy * 100 + jm) > (todayObj.jy * 100 + todayObj.jm)
    return {
      title: monthLabel(jy, jm), dateStart: days[0].dateStart, dateEnd: last.dateStart,
      gStart: days[0].gDate, gEnd: last.gDate,
      startNumeric: days[0].numeric, endNumeric: last.numeric,
      total, done, totalWeight, doneWeight,
      percent: totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0,
      level: getLevel(totalWeight, doneWeight, isFuture),
      sparkPoints: days.map(d => (d.totalWeight && !d.isFuture) ? Math.round((d.doneWeight / d.totalWeight) * 100) : 0)
    }
  })
})

const monthlyStats = computed(() =>
  monthlyStatsAll.value.filter(
    m => m.endNumeric >= rangeBounds.value.start && m.startNumeric <= rangeBounds.value.end
  )
)

/* ===== جزئیات تسک‌ها ===== */
const details = ref({
  show: false,
  loading: false,
  error: null,
  title: '',
  subtitle: '',
  tasks: [],
})

const detailGroups = computed(() => {
  const groups = new Map()

  details.value.tasks.forEach(task => {
    const key = task.day || 'unknown'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  })

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, tasks]) => ({
      day,
      label: tasks[0]?.day_shamsi || day,
      tasks,
      total: tasks.length,
      done: tasks.filter(task => task.is_done).length,
    }))
})

const detailSummary = computed(() => {
  const total = details.value.tasks.length
  const done = details.value.tasks.filter(task => task.is_done).length

  // «کل» و «انجام‌شده» شمارش‌اند و «بازدهی» درصد، پس فقط سومی وزنی است. اگر
  // این عدد از دو تای دیگر ساخته می‌شد، با درصد همان روز روی نقشه فرق می‌کرد.
  return { total, done, percent: weightedPercent(details.value.tasks) }
})

function resolveGregorianRange(payload) {
  if (!payload) return null

  if (payload.type === 'daily') {
    return payload.gDate ? { start: payload.gDate, end: payload.gDate } : null
  }

  return payload.gStart && payload.gEnd ? { start: payload.gStart, end: payload.gEnd } : null
}

async function handleViewTasks(payload) {
  // قرارداد قبلی حفظ می‌شود تا مصرف‌کننده بیرونی نشکند.
  emit('view-tasks', payload);
  tip.value.show = false;

  const range = resolveGregorianRange(payload)

  if (!range) return

  details.value = {
    show: true,
    loading: true,
    error: null,
    title: payload.title || 'کارهای این بازه',
    subtitle: payload.dateEnd ? `${payload.dateStart} تا ${payload.dateEnd}` : payload.dateStart,
    tasks: [],
  }

  try {
    const query = new URLSearchParams({ start_date: range.start, end_date: range.end })
    const res = await api.get(`/tasks?${query}`)

    const items = res.data?.data || []

    details.value.tasks = goalFilter.value
      ? items.filter(task => task.goal_id === goalFilter.value)
      : items
  } catch (e) {
    console.error(e)
    details.value.error = 'دریافت کارها ناموفق بود.'
  } finally {
    details.value.loading = false
  }
}

/**
 * کارهای عقب‌افتاده از قبل در دست هستند و نیازی به درخواست دوباره نیست.
 */
function openBacklogDetails() {
  if (!backlog.value.count) return

  const capped = backlog.value.count > backlog.value.tasks.length

  details.value = {
    show: true,
    loading: false,
    error: null,
    title: 'کارهای عقب‌افتاده',
    subtitle: capped
      ? `${toPersianNumber(backlog.value.tasks.length)} مورد از ${toPersianNumber(backlog.value.count)} کار عقب‌افتاده`
      : `${toPersianNumber(backlog.value.count)} کار عقب‌افتاده`,
    tasks: backlog.value.tasks,
  }

  tip.value.show = false
}

function closeDetails() {
  details.value.show = false
}

function handleEscape(e) {
  if (e.key !== 'Escape') return

  if (showPalette.value) {
    showPalette.value = false
    return
  }

  if (details.value.show) {
    closeDetails()
    return
  }

  tip.value.show = false
}

/* ===== Tooltip & Global Click Handling ===== */
function handleToggleTip(e, data) {
  e.stopPropagation();
  tip.value.isMobile = window.innerWidth < 768
  tip.value.data = data
  tip.value.show = true
  if (!tip.value.isMobile) {
    tip.value.x = Math.min(e.clientX + 15, window.innerWidth - 250)
    tip.value.y = Math.max(12, e.clientY - 180)
  }
}

const closeGlobal = (e) => {
  if (!tip.value.show) return;
  if (tooltipRef.value && !tooltipRef.value.contains(e.target)) {
    tip.value.show = false;
  }
};
/*
 * راهنمای رنگ‌ها از خود پالت ساخته می‌شود، پس با عوض شدن دامنه‌ها یا تعداد
 * سطح‌ها خودش به‌روز می‌شود و هیچ‌وقت با رنگ خانه‌های نقشه اختلاف پیدا نمی‌کند.
 */
const legendItems = computed(() =>
  palette.bounds.map((bound, index) => ({
    color: palette.colors[index + 1],
    label: `${toPersianNumber(bound.from)}٪ تا ${toPersianNumber(bound.to)}٪ بازدهی`,
  })),
)

const legendTip = ref({
  show: false,
  index: null,
})

// پنجره تنظیم رنگ‌بندی، همان جایی که راهنمای رنگ‌ها هست.
const showPalette = ref(false)

const isTouchDevice = ref(false)

onMounted(() => {
  isTouchDevice.value = window.matchMedia('(hover: none), (pointer: coarse)').matches

  fetchActivities(gridRange.value, goalFilter.value)
  fetchGoalOptions()
  fetchBacklog(goalFilter.value)
  window.addEventListener('click', closeGlobal)
  window.addEventListener('keydown', handleEscape)
})
function showLegendTip(index) {
  if (!isTouchDevice.value) {
    legendTip.value = { show: true, index }
  }
}

function hideLegendTip() {
  if (!isTouchDevice.value) {
    legendTip.value = { show: false, index: null }
  }
}

function toggleLegendTip(index) {
  if (!isTouchDevice.value) return

  legendTip.value = {
    show: legendTip.value.index !== index || !legendTip.value.show,
    index: legendTip.value.index === index && legendTip.value.show ? null : index,
  }
}
onUnmounted(() => {
  window.removeEventListener('click', closeGlobal);
  window.removeEventListener('keydown', handleEscape);
});

/*
 * داده وقتی گرفته می‌شود که مرز نقشه یا فیلتر هدف عوض شود. تغییر بازه‌ای که
 * داخل همان مرز می‌ماند، مثل قبل بدون درخواست تازه انجام می‌شود.
 */
watch([gridRangeKey, goalFilter], () => {
  fetchActivities(gridRange.value, goalFilter.value)
})

watch(goalFilter, goalId => {
  fetchBacklog(goalId)
})

/*
 * رتبه‌بندی فقط هنگام دیده‌شدن تب و فقط وقتی بازه واقعاً عوض شده گرفته می‌شود،
 * تا هر تغییر فیلتر یک درخواست بی‌مصرف نسازد.
 */
watch([activeTab, rangeGregorian], ([tab, range]) => {
  if (tab !== 'goals') return

  if (!range) {
    ranking.value = []
    fetchedRankingKey = null
    return
  }

  const key = `${range.from}:${range.to}`

  if (key === fetchedRankingKey) return

  fetchedRankingKey = key
  fetchGoalRanking(range)
}, { immediate: true })

// بازه نسبی فقط برای سال جاری معتبر است.
watch(selectedYear, () => {
  if (!isCurrentYear.value && RELATIVE_RANGE_DAYS[rangeKey.value]) {
    rangeKey.value = 'year'
  }
})

watch(rangeKey, key => {
  if (key !== 'custom') {
    customStart.value = null
    customEnd.value = null
  }
})

/* ===== نوشتن فیلترها در نشانی صفحه ===== */
/*
 * فقط مقدارهای غیرپیش‌فرض نوشته می‌شوند تا نشانی صفحه در حالت عادی تمیز بماند.
 */
const filtersQuery = computed(() => {
  const query = {}

  if (activeTab.value !== 'yearly') query.tab = activeTab.value
  if (selectedYear.value !== todayObj.jy) query.year = String(selectedYear.value)
  if (goalFilter.value) query.goal = String(goalFilter.value)
  if (rangeKey.value !== 'year') query.range = rangeKey.value

  if (rangeKey.value === 'custom') {
    if (customStart.value) query.from = customStart.value
    if (customEnd.value) query.to = customEnd.value
  }

  return query
})

const sameQuery = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  return [...keys].every(key => readQueryValue(a[key]) === readQueryValue(b[key]))
}

watch(filtersQuery, next => {
  const preserved = { ...route.query }
  OWNED_QUERY_KEYS.forEach(key => delete preserved[key])

  const target = { ...preserved, ...next }

  if (sameQuery(target, route.query)) return

  // replace تا دکمه بازگشت مرورگر پر از حالت‌های میانی فیلتر نشود.
  router.replace({ query: target }).catch(() => {})
})

// حرکت جلو و عقب مرورگر باید فیلترها را برگرداند.
watch(() => route.query, query => {
  if (route.name !== 'year') return

  const filters = readFiltersFromQuery(query)

  activeTab.value = filters.tab
  selectedYear.value = filters.year
  goalFilter.value = filters.goal
  rangeKey.value = filters.range
  customStart.value = filters.from
  customEnd.value = filters.to
})

function getSparklinePath(points) {
  if (!points || points.length < 2) return ''
  const width = 100; const height = 30
  const step = width / (points.length - 1)
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (p * height / 100)}`).join(' ')
}

// ✅ تعریف کارت‌ها با آیکون‌ها (بدون رنگ ثابت - رنگ از تم گرفته میشود)
const statCards = computed(() => [
  { label: 'همه کارها', value: toPersianNumber(rangeStats.value.total), icon: ListChecks, color: 'blue' },
  { label: 'روز طلایی', value: toPersianNumber(rangeStats.value.perfect), icon: Star, color: 'green' },
  { label: 'بازدهی', value: toPersianNumber(rangeStats.value.avg) + '٪', icon: TrendingUp, color: 'indigo' },
  { label: 'روز بی‌کار', value: toPersianNumber(rangeStats.value.inactive), icon: Moon, color: 'gray' },
])
</script>

<template>
  <!-- رنگ‌های پالت به شکل متغیر CSS، تا استایل‌های همین فایل هم به آن‌ها برسند -->
  <div class="stats-page" :style="palette.cssVars">

    <PageHeader title="گزارش‌ها" subtitle="نمای فعالیت تو در بازه انتخاب‌شده.">
      <template #actions>
        <!-- کارت سال، صفحه جداگانه‌ای است و سال انتخاب‌شده را با خودش می‌برد. -->
        <RouterLink
          v-if="selectedYear <= todayObj.jy"
          :to="{ name: 'yearReview', query: selectedYear === todayObj.jy ? {} : { year: String(selectedYear) } }"
          class="review-link"
        >
          <Sparkles class="w-4 h-4"/>
          کارت سال من
        </RouterLink>
        <BaseSelect v-model="selectedYear" name="year-select" :options="years.map(y => ({ value: y, label: toPersianNumber(y) }))" class="year-sel" />
      </template>
    </PageHeader>

    <div class="header-row">
      <div class="tab-box">
        <button v-for="t in TAB_KEYS" :key="t" @click="activeTab = t"
                :class="['t-btn', {active: activeTab === t}]">
          <LayoutGrid v-if="t==='yearly'" class="s-icon"/>
          <Hash v-if="t==='weekly'" class="s-icon"/>
          <Calendar v-if="t==='monthly'" class="s-icon"/>
          <Trophy v-if="t==='goals'" class="s-icon"/>
          <Activity v-if="t==='pattern'" class="s-icon"/>
          <span>{{ TAB_LABELS[t] }}</span>
        </button>
      </div>
    </div>

    <!-- فیلترها -->
    <div class="filters-row">
      <div class="filter-item">
        <span class="filter-label"><Target class="w-3.5 h-3.5"/> هدف</span>
        <BaseSelect v-model="goalFilter" name="goal-filter" :options="goalOptions" size="sm" />
      </div>

      <div class="filter-item">
        <span class="filter-label"><CalendarRange class="w-3.5 h-3.5"/> بازه</span>
        <BaseSelect v-model="rangeKey" name="range-filter" :options="rangeOptions" size="sm" />
      </div>

      <div v-if="rangeKey === 'custom'" class="filter-item custom-range">
        <span class="filter-label">از تاریخ</span>
        <Datepicker
          v-model="customStart"
          format="jYYYY/jMM/jDD"
          type="date"
          locale="fa"
          :input-class="'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)]'"
        />
      </div>

      <div v-if="rangeKey === 'custom'" class="filter-item custom-range">
        <span class="filter-label">تا تاریخ</span>
        <Datepicker
          v-model="customEnd"
          format="jYYYY/jMM/jDD"
          type="date"
          locale="fa"
          :input-class="'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)]'"
        />
      </div>
    </div>

    <div v-if="!isFullRange || goalFilter" class="range-hint" :class="{ 'is-empty': isEmptyRange || isRangeClamped }">
      <span>بازه: {{ rangeLabel }}</span>
      <span v-if="goalFilter" class="range-hint-goal">
        هدف: {{ goalOptions.find(o => o.value === goalFilter)?.label }}
      </span>
      <span v-if="isRangeClamped">
        بازه انتخاب‌شده از سقف {{ toPersianNumber(GRID_MAX_DAYS) }} روز بلندتر بود و از ابتدا کوتاه شد.
      </span>
      <span v-else-if="isEmptyRange">تاریخ‌های انتخاب‌شده بازه معتبری نمی‌سازند.</span>
    </div>

    <!-- نرخ جاماندگی: مستقل از بازه انتخاب‌شده -->
    <button
      v-if="!backlogLoading && backlog.count"
      type="button"
      class="backlog-card"
      @click="openBacklogDetails"
    >
      <span class="backlog-icon"><AlertTriangle class="w-5 h-5"/></span>
      <span class="backlog-text">
        <b>{{ toPersianNumber(backlog.count) }} کار عقب‌افتاده داری</b>
        <small v-if="backlog.oldest">
          قدیمی‌ترین: {{ toPersianNumber(backlog.oldest) }}
          <template v-if="backlog.daysBehind">
            ({{ toPersianNumber(backlog.daysBehind) }} روز پیش)
          </template>
        </small>
      </span>
      <span class="backlog-cta">مشاهده فهرست</span>
    </button>

    <!-- کارت‌های آمار -->
    <div v-if="isLoading" class="stats-cards-grid">
      <div v-for="i in 4" :key="i" class="stat-card pulse-bg"></div>
    </div>

    <div v-else class="stats-cards-grid">
      <StatCard
        v-for="(card, i) in statCards"
        :key="i"
        :title="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
      />
    </div>

    <!-- بینش خودکار: از همان داده صفحه، تابع بازه و فیلتر هدف -->
    <div v-if="!isLoading && hasPastActivity" class="insights-card">
      <div class="insights-head">
        <Lightbulb class="w-4 h-4"/>
        <span>بینش</span>
      </div>

      <ul v-if="insights.length" class="insights-list">
        <li v-for="item in insights" :key="item.key" :class="['insight', `is-${item.tone}`]">
          <span class="insight-dot"></span>
          <span>{{ item.text }}</span>
        </li>
      </ul>

      <p v-else class="insights-empty">
        هنوز برای این بازه داده کافی نیست که جمله‌ای با پشتوانه ساخته شود.
      </p>
    </div>

    <div class="main-panel shadow-inner">

      <div v-if="isLoading" class="loading-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary"/>
      </div>

      <div v-else-if="activeTab === 'yearly'" class="fade-in heatmap-wrapper" ref="heatmapContainer">
        <div class="heatmap-scroll custom-scroll">
          <div class="heatmap-inner md:justify-center">
            <div class="days-labels">
              <span v-for="d in weekDaysShort" :key="d">{{d}}</span>
            </div>
            <div class="grid-container">
              <div class="months-row" :style="{ display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, ${CELL}px)`, gap: `${GAP}px` }">
                <span v-for="m in monthSpans" :key="m.key" :style="{ gridColumn: `${m.start + 1} / ${m.end + 1}` }">{{m.name}}</span>
              </div>
              <div class="cells-body" :style="{ display: 'grid', gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoFlow: 'column', gap: `${GAP}px` }">
                <button v-for="day in gridDays" :key="day.key"
                        class="cell"
                        :class="{
                          'today-cell': day.key === todayKey,
                          'future-cell': day.isFuture,
                          'planned-cell': day.isFuture && day.total > 0,
                          'out-range': !isInRange(day)
                        }"
                        :style="{ backgroundColor: day.isFuture ? undefined : palette.colors[day.level], gridRow: day.rowIndex + 1, gridColumn: day.colIndex + 1 }"
                        @click.stop="handleToggleTip($event, { ...day, title: day.isFuture ? 'روز پیش‌رو' : 'گزارش روزانه', type: 'daily' })"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'weekly'" class="fade-in">
        <div v-if="!weeklyStats.length" class="empty-range">در این بازه هفته‌ای وجود ندارد.</div>
        <div v-else class="weekly-view-grid">
          <div v-for="w in weeklyStats" :key="w.title" class="week-node" :class="{curr: w.isCurrent}" :style="{backgroundColor: palette.colors[w.level]}"
               @click.stop="handleToggleTip($event, {...w, type: 'weekly'})">
            <span class="week-pct-label" :style="{color: palette.labelColors[w.level]}">{{w.percent}}%</span>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'monthly'" class="fade-in">
        <div v-if="!monthlyStats.length" class="empty-range">در این بازه ماهی وجود ندارد.</div>
        <div v-else class="monthly-view-grid">
          <div v-for="m in monthlyStats" :key="m.title" class="month-node" :style="{borderBottomColor: palette.colors[m.level]}"
               @click.stop="handleToggleTip($event, {...m, title: `ماه ${m.title}`, type: 'monthly'})">
            <div class="mo-info">
              <span class="m-name">{{m.title}}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-30">
                <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </div>
            <div class="sparkline-box">
              <svg viewBox="0 0 100 30" class="sparkline-svg">
                <path :d="getSparklinePath(m.sparkPoints)" fill="none" :stroke="palette.colors[m.level]" stroke-width="1.5" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="mo-bar"><div :style="{width: m.percent+'%', backgroundColor: palette.colors[m.level]}"></div></div>
            <div class="mo-pct-footer" :style="{color: palette.textColors[m.level]}">{{m.percent}}% پیشرفت</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'goals'" class="fade-in">
        <div v-if="rankingLoading" class="loading-center">
          <Loader2 class="w-8 h-8 animate-spin text-primary"/>
        </div>

        <EmptyState
          v-else-if="rankingError"
          variant="error"
          compact
          :title="rankingError"
          description="اتصال اینترنت را بررسی کن و دوباره تلاش کن."
          action-label="تلاش دوباره"
          @action="retryGoalRanking"
        />

        <div v-else-if="!sortedRanking.length" class="empty-range">
          در این بازه هیچ هدفی کار ثبت‌شده‌ای ندارد.
        </div>

        <template v-else>
          <div class="ranking-head">
            <div class="ranking-head-text">
              <b>بازدهی اهداف در این بازه</b>
              <small v-if="rankingSummary">
                بهترین: {{ rankingSummary.best.title }} —
                ضعیف‌ترین: {{ rankingSummary.worst.title }}
              </small>
              <small v-else>فیلتر هدف روی این تب اثر ندارد؛ همه اهداف با هم مقایسه می‌شوند.</small>
            </div>
            <button type="button" class="ranking-sort" @click="toggleRankingOrder">
              <ArrowUpDown class="w-3.5 h-3.5"/>
              {{ rankingOrder === 'desc' ? 'از بیشترین' : 'از کمترین' }}
            </button>
          </div>

          <div class="ranking-list">
            <button
              v-for="(goal, index) in sortedRanking"
              :key="goal.id"
              type="button"
              class="ranking-row"
              :class="{ 'is-active': goal.id === goalFilter }"
              @click="toggleRankingGoal(goal.id)"
            >
              <span class="ranking-index">{{ toPersianNumber(index + 1) }}</span>
              <span class="ranking-body">
                <span class="ranking-title-row">
                  <span class="ranking-title">{{ goal.title }}</span>
                  <span class="ranking-count">
                    {{ toPersianNumber(goal.done) }} از {{ toPersianNumber(goal.total) }}
                  </span>
                </span>
                <span class="ranking-bar">
                  <span :style="{
                    width: goal.percent + '%',
                    backgroundColor: palette.colors[getLevel(goal.total, goal.done)]
                  }"></span>
                </span>
              </span>
              <span class="ranking-percent" :style="{ color: palette.textColors[getLevel(goal.total, goal.done)] }">
                {{ toPersianNumber(goal.percent) }}%
              </span>
            </button>
          </div>
        </template>
      </div>

      <div v-else-if="activeTab === 'pattern'" class="fade-in">
        <div v-if="!hasPastActivity" class="empty-range">
          در این بازه هنوز کاری ثبت نشده است.
        </div>

        <template v-else>
          <!-- زنجیره در سطح بازه -->
          <div class="streak-grid">
            <div class="streak-card">
              <span class="streak-icon is-best"><Trophy class="w-4 h-4"/></span>
              <span class="streak-body">
                <b>{{ toPersianNumber(streakStats.best.length) }} روز</b>
                <small>بلندترین زنجیره</small>
                <small v-if="streakStats.best.start" class="streak-dates">
                  {{ toPersianNumber(streakStats.best.start.dateStart) }}
                  تا
                  {{ toPersianNumber(streakStats.best.end.dateStart) }}
                </small>
              </span>
            </div>

            <div class="streak-card">
              <span class="streak-icon is-current"><Flame class="w-4 h-4"/></span>
              <span class="streak-body">
                <b>{{ toPersianNumber(streakStats.current) }} روز</b>
                <small>زنجیره فعلی</small>
                <small v-if="streakStats.currentStart" class="streak-dates">
                  از {{ toPersianNumber(streakStats.currentStart.dateStart) }}
                </small>
                <small v-else class="streak-dates">زنجیره‌ای در جریان نیست</small>
              </span>
            </div>

            <div class="streak-card">
              <span class="streak-icon is-break"><HeartCrack class="w-4 h-4"/></span>
              <span class="streak-body">
                <b v-if="streakStats.lastBreak">
                  {{ toPersianNumber(streakStats.lastBreak.dateStart) }}
                </b>
                <b v-else>—</b>
                <small>آخرین روز ناتمام</small>
                <small v-if="!streakStats.lastBreak" class="streak-dates">
                  در این بازه هیچ روزی ناتمام نمانده
                </small>
                <small v-else class="streak-dates">
                  {{ toPersianNumber(streakStats.lastBreak.done) }} از
                  {{ toPersianNumber(streakStats.lastBreak.total) }} کار
                </small>
              </span>
            </div>
          </div>

          <p class="pattern-note">روز بدون کار زنجیره را نمی‌شکند، ولی به آن هم اضافه نمی‌کند.</p>

          <!-- الگوی روزهای هفته -->
          <div class="pattern-head">
            <b>الگوی روزهای هفته</b>
            <small v-if="weekdayInsight">
              {{ pluralizeWeekday(weekdayInsight.best.label) }} قوی‌ترین روز توست،
              {{ pluralizeWeekday(weekdayInsight.worst.label) }} ضعیف‌ترین.
            </small>
            <small v-else>برای دیدن الگو، به داده بیشتری در این بازه نیاز است.</small>
          </div>

          <div class="weekday-chart">
            <div
              v-for="day in weekdayStats"
              :key="day.index"
              class="weekday-col"
              :class="{
                'is-best': weekdayInsight && day.index === weekdayInsight.best.index,
                'is-worst': weekdayInsight && day.index === weekdayInsight.worst.index,
              }"
            >
              <span class="weekday-value">{{ day.total ? toPersianNumber(day.percent) + '%' : '—' }}</span>
              <div class="weekday-track">
                <div
                  class="weekday-fill"
                  :style="{ height: day.percent + '%', backgroundColor: palette.colors[day.level] }"
                ></div>
              </div>
              <span class="weekday-name">{{ day.label }}</span>
              <span class="weekday-count">{{ toPersianNumber(day.done) }}/{{ toPersianNumber(day.total) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="legend-row">
      <span>کم فعالیت</span>

      <div class="legend-colors">
        <div
          v-for="(item, index) in legendItems"
          :key="index"
          class="legend-color-item"
          :style="{ backgroundColor: item.color }"
          tabindex="0"
          @mouseenter="showLegendTip(index)"
          @mouseleave="hideLegendTip"
          @focus="showLegendTip(index)"
          @blur="hideLegendTip"
          @click.stop="toggleLegendTip(index)"
        >
          <div
            v-if="legendTip.show && legendTip.index === index"
            class="legend-tooltip"
          >
            {{ item.label }}
          </div>
        </div>
      </div>

      <span>پر فعالیت</span>

      <button
        type="button"
        class="palette-btn"
        title="تنظیم رنگ‌ها و دامنه‌ها"
        @click.stop="showPalette = true"
      >
        <Palette class="w-3.5 h-3.5"/>
        <span>رنگ‌بندی</span>
      </button>
    </div>

    <!-- پنجره تنظیم رنگ‌بندی: همان کامپوننتی که در تب تنظیمات هم هست -->
    <Teleport to="body">
      <div v-if="showPalette" class="palette-overlay" :style="palette.cssVars" @click.self="showPalette = false">
        <div class="palette-modal custom-scroll" @click.stop>
          <div class="palette-modal-head">
            <span class="palette-modal-title">
              <Palette class="w-4 h-4"/>
              رنگ‌بندی نتایج
            </span>
            <button type="button" class="tip-close-x" @click="showPalette = false">
              <X class="w-4 h-4"/>
            </button>
          </div>

          <PaletteEditor @saved="showPalette = false" />
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tip.show" :class="['tip-root', { 'is-mobile': tip.isMobile }]"
           :style="[palette.cssVars, !tip.isMobile ? { left: tip.x+'px', top: tip.y+'px' } : {}]">
        <div class="tip-card-final shadow-2xl" ref="tooltipRef" @click.stop>
          <div class="tip-header">
            <div class="tip-status-dot" :style="{backgroundColor: palette.colors[tip.data.level]}"></div>
            <span class="tip-title-text">{{tip.data.title}}</span>
            <button @click="tip.show = false" class="tip-close-x"><X class="w-4 h-4"/></button>
          </div>

          <div class="tip-dates-area">
            <div class="date-row"><span>تاریخ شروع:</span> <b>{{tip.data.dateStart}}</b></div>
            <div v-if="tip.data.dateEnd" class="date-row"><span>تاریخ پایان:</span> <b>{{tip.data.dateEnd}}</b></div>
          </div>

          <div class="tip-stats-grid">
            <div class="stat-line"><span>همه کارها:</span> <b>{{ toPersianNumber(tip.data.total) }}</b></div>
            <div class="stat-line"><span>انجام‌شده:</span> <b>{{ toPersianNumber(tip.data.done) }}</b></div>
          </div>

          <template v-if="tip.data.isFuture">
            <div class="tip-future-note">این روز هنوز نرسیده است.</div>
          </template>
          <template v-else>
            <div class="tip-progress-container">
              <div class="tip-progress-fill" :style="{width: tip.data.percent+'%', backgroundColor: 'var(--color-primary)'}"></div>
            </div>
            <div class="tip-final-percent" :style="{color: palette.textColors[tip.data.level]}">{{tip.data.percent}}% بازدهی</div>
          </template>

          <button
              v-if="tip.data.type === 'daily' || tip.data.type === 'weekly' || tip.data.type === 'monthly'"
              @click="handleViewTasks(tip.data)"
              class="mt-4 w-full text-center text-xs font-bold text-primary py-2 border-t border-border hover:bg-primary/5 transition-colors rounded-b-xl"
          >
            مشاهده کارها
          </button>
        </div>
      </div>
    </Teleport>

    <!-- مودال جزئیات کارها -->
    <Teleport to="body">
      <div v-if="details.show" class="details-backdrop" :style="palette.cssVars" @click.self="closeDetails">
        <div role="dialog" aria-modal="true" class="details-card" @click.stop>
          <div class="details-header">
            <button @click="closeDetails" class="tip-close-x"><X class="w-5 h-5"/></button>
            <div class="details-title-box">
              <h3 class="details-title">{{ details.title }}</h3>
              <span class="details-subtitle">{{ details.subtitle }}</span>
            </div>
          </div>

          <div v-if="details.loading" class="loading-center">
            <Loader2 class="w-7 h-7 animate-spin text-primary"/>
          </div>

          <div v-else-if="details.error" class="details-empty">{{ details.error }}</div>

          <div v-else-if="!detailGroups.length" class="details-empty">
            کاری برای این بازه ثبت نشده است.
          </div>

          <template v-else>
            <div class="details-summary">
              <div class="summary-cell"><span>همه کارها</span><b>{{ toPersianNumber(detailSummary.total) }}</b></div>
              <div class="summary-cell"><span>انجام‌شده</span><b>{{ toPersianNumber(detailSummary.done) }}</b></div>
              <div class="summary-cell"><span>بازدهی</span><b>{{ toPersianNumber(detailSummary.percent) }}٪</b></div>
            </div>

            <div class="details-body custom-scroll">
              <div v-for="group in detailGroups" :key="group.day" class="details-group">
                <div class="details-group-head">
                  <span class="details-day">{{ group.label }}</span>
                  <span class="details-count">{{ toPersianNumber(group.done) }} از {{ toPersianNumber(group.total) }}</span>
                </div>
                <ul class="details-list">
                  <li v-for="task in group.tasks" :key="task.id" class="details-task">
                    <CheckCircle2 v-if="task.is_done" class="w-4 h-4 details-icon-done"/>
                    <Circle v-else class="w-4 h-4 details-icon-todo"/>
                    <div class="details-task-text">
                      <span class="details-task-title" :class="{ 'is-done': task.is_done }">
                        {{ task.title || task.goal_title || 'بدون عنوان' }}
                      </span>
                      <span v-if="task.goal_title" class="details-task-goal">{{ task.goal_title }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/*
 * رنگ‌های پالت به شکل درون‌خطی روی این چهار ریشه می‌نشینند (سه‌تای آخر
 * teleport شده‌اند و بیرون از صفحه‌اند). نسخه «متنی» هر رنگ همان‌جا ساخته
 * می‌شود: رنگ روشن روی پس‌زمینه روشن خوانده نمی‌شود، پس با رنگ متن تم آمیخته
 * می‌شود تا در تم روشن تیره‌تر و در تم تیره روشن‌تر شود.
 */
.stats-page, .tip-root, .details-backdrop, .palette-overlay {
  --activity-worst-text: color-mix(in srgb, var(--activity-worst) 74%, var(--color-text));
  --activity-mid-text: color-mix(in srgb, var(--activity-mid) 74%, var(--color-text));
  --activity-best-text: color-mix(in srgb, var(--activity-best) 74%, var(--color-text));
}

/*
 * Same content width, padding and rhythm as the `.page` class the other
 * signed-in pages use. The background and the full height belong to the
 * dashboard layout, so they are not repeated here.
 */
.stats-page { max-width: 72rem; margin-inline: auto; padding: 1rem; direction: rtl; color: var(--color-text); }
@media (min-width: 640px) { .stats-page { padding: 1.5rem; } }
.header-row { display: flex; justify-content: space-between; align-items: center; margin: 1.5rem 0 1rem; flex-wrap: wrap; gap: 1rem; }
.tab-box { display: flex; flex-wrap: wrap; gap: 2px; background: var(--color-background-soft); padding: 4px; border-radius: 12px; border: 1px solid var(--color-border); }
.t-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: bold; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; border: none; background: transparent; cursor: pointer; transition: 0.2s; }
.t-btn.active { background: var(--color-background); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.s-icon { width: 14px; height: 14px; }
.review-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  transition: 0.2s;
}
.review-link:hover { background: color-mix(in srgb, var(--color-primary) 18%, transparent); }

/* فیلترها */
.filters-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
.filter-item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.filter-label { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; color: var(--color-text-secondary); }
.custom-range :deep(input) { direction: rtl; }
.range-hint { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; font-weight: 700; color: var(--color-text-secondary); margin-bottom: 1.25rem; }
.range-hint-goal { color: var(--color-primary); }
.range-hint.is-empty { color: var(--color-danger); }

/* کارت جاماندگی */
.backlog-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: right;
  direction: rtl;
  margin-bottom: 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--activity-worst) 35%, transparent);
  background: color-mix(in srgb, var(--activity-worst) 8%, var(--color-background-soft));
  transition: transform 0.2s, box-shadow 0.2s;
}
.backlog-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px color-mix(in srgb, var(--activity-worst) 14%, transparent); }
.backlog-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--activity-worst) 14%, transparent);
  color: var(--activity-worst-text);
}
.backlog-text { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.backlog-text b { font-size: 13px; font-weight: 900; color: var(--color-heading); }
.backlog-text small { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
.backlog-cta { font-size: 11px; font-weight: 800; color: var(--activity-worst-text); flex-shrink: 0; }

/* بینش خودکار */
.insights-card {
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  border-radius: 18px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.5rem;
}
.insights-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}
.insights-list { display: flex; flex-direction: column; gap: 8px; }
.insight {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.9;
  color: var(--color-text);
}
.insight-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 9px;
  background: var(--color-text-secondary);
}
.insight.is-good .insight-dot { background: var(--activity-best); }
.insight.is-bad .insight-dot { background: var(--activity-worst); }
.insights-empty { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }

/* ✅ استایل کارت‌ها با پشتیبانی از تمام تم‌ها */
/* The card itself is now the shared StatCard; only the skeleton stays local. */
.stats-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.stat-card { border: 1px solid var(--color-border); border-radius: 16px; }

/* Skeleton Loading */
.pulse-bg { background: linear-gradient(90deg, var(--color-background-soft) 25%, var(--color-background-mute) 50%, var(--color-background-soft) 75%); background-size: 200% 100%; animation: pulse 1.5s infinite; height: 92px; }
@keyframes pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.main-panel { background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 16px; padding: 1rem; min-height: 300px; position: relative; }
@media (min-width: 640px) { .main-panel { padding: 1.5rem; } }
.loading-center { display: flex; justify-content: center; align-items: center; min-height: 200px; }
.empty-range { text-align: center; padding: 3rem 1rem; font-size: 13px; font-weight: 700; color: var(--color-text-secondary); }

/* Heatmap Logic */
.heatmap-scroll { overflow-x: auto; padding: 1rem 0; }
.heatmap-inner { display: flex; gap: 10px; min-width: max-content; padding-top: 25px; }
.days-labels { display: grid; grid-template-rows: repeat(7, 14px); gap: 2px; }
.days-labels span { font-size: 9px; color: var(--color-text-secondary); height: 14px; display: flex; align-items: center; font-weight: bold; }
.grid-container { position: relative; }
.months-row { position: absolute; top: -22px; left: 0; right: 0; }
.months-row span { font-size: 10px; font-weight: 800; color: var(--color-text-secondary); text-align: center; white-space: nowrap; }
.cell { width: 14px; height: 14px; border-radius: 3px; cursor: pointer; transition: transform 0.1s, opacity 0.2s; border: 1px solid rgba(0,0,0,0.05); }
.cell:hover { transform: scale(1.3); z-index: 5; }
.today-cell { outline: 2.5px solid var(--color-primary); outline-offset: 1.5px; }

/* روز پیش‌رو با روز بدون فعالیت اشتباه گرفته نشود */
.future-cell { background-color: transparent; border: 1px dashed var(--color-border); }
.planned-cell { background-color: color-mix(in srgb, var(--color-primary) 18%, transparent); }

/* روزهای خارج از بازه انتخاب‌شده کم‌رنگ می‌شوند */
.out-range { opacity: 0.18; }

/* Weekly Grid */
.weekly-view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(55px, 1fr)); gap: 12px; }
.week-node { aspect-ratio: 1; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.2s; }
.week-node:hover { transform: translateY(-3px); }
.week-pct-label { font-size: 11px; font-weight: 900; }
.week-node.curr { outline: 3px solid var(--color-primary); outline-offset: 2px; }

/* Monthly Cards */
.monthly-view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1.5rem; }
.month-node { background: var(--color-background); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--color-border); border-bottom: 5px solid transparent; cursor: pointer; transition: all 0.3s; }
.month-node:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.mo-info { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 8px; }
.sparkline-box { height: 35px; margin: 10px 0; }
.sparkline-svg { width: 100%; height: 100%; overflow: visible; }
.mo-bar { height: 8px; background: var(--color-background-soft); border-radius: 4px; overflow: hidden; }
.mo-bar div { height: 100%; transition: width 1s; }
.mo-pct-footer { font-size: 11px; font-weight: 900; margin-top: 10px; text-align: left; }

/* رتبه‌بندی اهداف */
.ranking-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 1.25rem; }
.ranking-head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ranking-head-text b { font-size: 13px; font-weight: 900; color: var(--color-heading); }
.ranking-head-text small { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
.ranking-sort {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  transition: color 0.2s, border-color 0.2s;
}
.ranking-sort:hover { color: var(--color-primary); border-color: var(--color-primary); }

.ranking-list { display: flex; flex-direction: column; gap: 10px; }
.ranking-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: right;
  direction: rtl;
  padding: 12px 14px;
  border-radius: 16px;
  cursor: pointer;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.ranking-row:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
.ranking-row.is-active { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-background)); }
.ranking-index {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 900;
  color: var(--color-text-secondary);
  background: var(--color-background-mute);
}
.ranking-body { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 0; }
.ranking-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.ranking-title { font-size: 12px; font-weight: 800; color: var(--color-heading); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ranking-count { font-size: 10px; font-weight: 700; color: var(--color-text-secondary); flex-shrink: 0; }
.ranking-bar { display: block; height: 8px; border-radius: 4px; overflow: hidden; background: var(--color-background-mute); }
.ranking-bar span { display: block; height: 100%; border-radius: 4px; transition: width 0.6s ease-out; }
.ranking-percent { font-size: 13px; font-weight: 900; flex-shrink: 0; min-width: 46px; text-align: left; }

/* زنجیره و الگوی روزهای هفته */
.streak-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.streak-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 1rem;
  border-radius: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}
.streak-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.streak-icon.is-best { background: color-mix(in srgb, var(--activity-best) 12%, transparent); color: var(--activity-best-text); }
.streak-icon.is-current { background: color-mix(in srgb, var(--activity-mid) 14%, transparent); color: var(--activity-mid-text); }
.streak-icon.is-break { background: color-mix(in srgb, var(--activity-worst) 12%, transparent); color: var(--activity-worst-text); }
.streak-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.streak-body b { font-size: 1.15rem; font-weight: 900; color: var(--color-heading); line-height: 1.3; }
.streak-body small { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
.streak-dates { font-size: 10px !important; font-weight: 600 !important; opacity: 0.85; }

.pattern-note { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); margin-top: 12px; }

.pattern-head { display: flex; flex-direction: column; gap: 4px; margin: 1.75rem 0 1rem; }
.pattern-head b { font-size: 13px; font-weight: 900; color: var(--color-heading); }
.pattern-head small { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }

.weekday-chart { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; align-items: end; }
.weekday-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.weekday-value { font-size: 10px; font-weight: 900; color: var(--color-text-secondary); }
.weekday-track {
  width: 100%;
  height: 130px;
  border-radius: 10px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: var(--color-background-mute);
}
.weekday-fill { width: 100%; border-radius: 10px 10px 0 0; transition: height 0.6s ease-out; min-height: 2px; }
.weekday-name { font-size: 10px; font-weight: 800; color: var(--color-text-secondary); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.weekday-count { font-size: 9px; font-weight: 600; color: var(--color-text-secondary); opacity: 0.7; }
.weekday-col.is-best .weekday-value, .weekday-col.is-best .weekday-name { color: var(--activity-best-text); }
.weekday-col.is-worst .weekday-value, .weekday-col.is-worst .weekday-name { color: var(--activity-worst-text); }

/* Legend */
.legend-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; font-size: 11px; font-weight: bold; color: var(--color-text-secondary); }
.legend-colors {
  display: flex;
  gap: 6px;
}

.legend-color-item {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.05);
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.legend-color-item:hover {
  transform: scale(1.18);
}

.legend-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-background);
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  z-index: 20;
}

.legend-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--color-border) transparent transparent transparent;
}

/* دکمه و پنجره رنگ‌بندی */
.palette-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text-secondary);
  font-size: 10.5px;
  font-weight: 800;
  transition: all 0.15s ease;
}
.palette-btn:hover { color: var(--color-primary); border-color: var(--color-primary); }

.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  direction: rtl;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
}

.palette-modal {
  width: 100%;
  max-width: 620px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 18px;
  border-radius: 22px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.palette-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.palette-modal-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 900;
  color: var(--color-heading);
}

/* Tooltip */
.tip-root { position: fixed; z-index: 9999; direction: rtl; pointer-events: none; }
.tip-root.is-mobile {
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  pointer-events: auto;
  background: rgba(0,0,0,0.2);
}
.tip-card-final {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 24px;
  min-width: 250px;
  pointer-events: auto;
  box-shadow: 0 30px 60px rgba(0,0,0,0.25);
  animation: popIn 0.2s ease-out;
}
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.tip-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.tip-status-dot { width: 12px; height: 12px; border-radius: 50%; }
.tip-title-text { font-weight: 900; font-size: 15px; color: var(--color-heading); flex-grow: 1; }
.tip-close-x { background: transparent; border: none; cursor: pointer; color: var(--color-text-secondary); }

.tip-dates-area { background: var(--color-background-soft); padding: 10px; border-radius: 12px; margin-bottom: 15px; border: 1px solid var(--color-border); }
.date-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
.date-row span { color: var(--color-text-secondary); }

.tip-stats-grid { margin-bottom: 15px; }
.stat-line { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px dashed var(--color-border); }
.stat-line:last-child { border-bottom: none; }

.tip-progress-container { height: 8px; background: var(--color-background-soft); border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
.tip-progress-fill { height: 100%; transition: width 0.6s ease-out; }
.tip-final-percent { text-align: left; font-size: 13px; font-weight: 900; }
.tip-future-note { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-align: center; }

/* مودال جزئیات */
.details-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  direction: rtl;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
}
.details-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  max-height: min(88dvh, 760px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 60px rgba(0,0,0,0.3);
  animation: popIn 0.2s ease-out;
}
.details-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px 12px; border-bottom: 1px solid var(--color-border); }
.details-title-box { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.details-title { font-size: 15px; font-weight: 900; color: var(--color-heading); }
.details-subtitle { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
.details-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 14px 20px; }
.summary-cell { background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 14px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.summary-cell span { font-size: 10px; font-weight: 700; color: var(--color-text-secondary); }
.summary-cell b { font-size: 15px; font-weight: 900; color: var(--color-heading); }
.details-body { overflow-y: auto; padding: 0 20px 20px; }
.details-group { margin-bottom: 14px; }
.details-group-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.details-day { font-size: 12px; font-weight: 900; color: var(--color-heading); }
.details-count { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); }
.details-list { display: flex; flex-direction: column; gap: 6px; }
.details-task { display: flex; align-items: center; gap: 8px; background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 12px; padding: 8px 10px; }
.details-icon-done { color: var(--activity-best-text); flex-shrink: 0; }
.details-icon-todo { color: var(--color-text-secondary); flex-shrink: 0; }
.details-task-text { display: flex; flex-direction: column; min-width: 0; }
.details-task-title { font-size: 12px; font-weight: 700; color: var(--color-text); }
.details-task-title.is-done { text-decoration: line-through; color: var(--color-text-secondary); }
.details-task-goal { font-size: 10px; font-weight: 600; color: var(--color-text-secondary); }
.details-empty { padding: 3rem 1rem; text-align: center; font-size: 13px; font-weight: 700; color: var(--color-text-secondary); }

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scroll::-webkit-scrollbar { height: 5px; width: 5px; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
