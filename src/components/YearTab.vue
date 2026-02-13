<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import jalaali from 'jalaali-js'
import api from '@/plugins/axios'
import {
  ListChecks, CheckCircle2, Star, CalendarDays, Zap, LayoutGrid, Hash, Calendar, X, Loader2,
  Moon, TrendingUp // ✅ آیکون‌های جدید اضافه شدند
} from 'lucide-vue-next'
import BaseSelect from './UI/BaseSelect.vue'

/* ===== تنظیمات ظاهری ===== */
const CELL = 14
const GAP  = 2
const LEVEL_COLORS = [
  'var(--color-background-mute)',
  '#B91C1C', '#DC2626', '#FCD34D', '#F59E0B', '#86EFAC', '#34D399', '#059669'
]

const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
const weekDaysShort = ['ش','ی','د','س','چ','پ','ج']

/* ===== وضعیت (State) ===== */
const selectedYear = ref(1404)
const years = Array.from({ length: 10 }, (_, i) => 1400 + i)
const activitiesData = ref({})
const stats = ref({ total: 0, perfect: 0, avg: 0, inactive: 0 })
const activeTab = ref('yearly')
const heatmapContainer = ref(null)
const isLoading = ref(true)
const tip = ref({ show: false, x: 0, y: 0, data: null, isMobile: false })
const tooltipRef = ref(null)
const emit = defineEmits(['view-tasks'])

/* ===== تشخیص زمان ===== */
const todayObj = jalaali.toJalaali(new Date())
const todayNumeric = todayObj.jy * 10000 + todayObj.jm * 100 + todayObj.jd
const todayKey = computed(() => `${todayObj.jy}-${todayObj.jm}-${todayObj.jd}`)

const getLevel = (total, done, isFuture = false) => {
  if (isFuture || !total) return 0;
  const p = (done / total) * 100;
  if (p <= 20) return 1;
  if (p <= 30) return 2;
  if (p <= 45) return 3;
  if (p <= 55) return 4;
  if (p <= 70) return 5;
  if (p <= 85) return 6;
  return 7;
}

/* ===== Logic: Fetch & Scroll ===== */
async function fetchActivities(year){
  isLoading.value = true;
  try{
    const res = await api.get(`/activities/${year}`)
    activitiesData.value = res.data?.data || {}
    stats.value = {
      total: res.data?.total_tasks_year_to_date || 0,
      perfect: res.data?.perfect_days_count || 0,
      avg: res.data?.average_completion_percentage || 0,
      inactive: res.data?.inactive_days || 0
    }
    if (year === todayObj.jy) {
      nextTick(autoScroll);
    }
  }catch(e){
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

function autoScroll() {
  const el = heatmapContainer.value?.querySelector('.today-cell');
  if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function handleViewTasks(payload) {
  emit('view-tasks', payload);
  tip.value.show = false;
}

/* ===== محاسبات تقویم ===== */
const isLeap = (y) => ((y * 8 + 29) % 33) < 8
const yearMeta = computed(() => {
  const year = selectedYear.value
  const daysInYear = isLeap(year) ? 366 : 365
  const { gy, gm, gd } = jalaali.toGregorian(year, 1, 1)
  const startDate = new Date(gy, gm - 1, gd)
  const startWeekday = (startDate.getDay() + 1) % 7
  return { year, daysInYear, startDate, startWeekday }
})

const yearDays = computed(() => {
  const { daysInYear, startDate, startWeekday } = yearMeta.value
  return Array.from({ length: daysInYear }, (_, i) => {
    const dateObj = new Date(startDate.getTime() + i * 86400000)
    const { jy, jm, jd } = jalaali.toJalaali(dateObj)
    const key = `${jy}-${jm}-${jd}`
    const d = activitiesData.value[key] || { total: 0, done: 0 }
    const dayNum = jy * 10000 + jm * 100 + jd
    const isFuture = dayNum > todayNumeric

    return {
      rowIndex: (i + startWeekday) % 7, colIndex: Math.floor((i + startWeekday) / 7),
      key, jy, jm, jd, total: d.total, done: d.done,
      level: getLevel(d.total, d.done, isFuture),
      dateStart: `${jy}/${jm}/${jd}`, isFuture
    }
  })
})

const monthSpans = computed(() => {
  const { year, startDate, startWeekday } = yearMeta.value
  const cols = yearDays.value.length ? Math.max(...yearDays.value.map(d => d.colIndex)) + 1 : 0
  const res = []
  for (let m = 1; m <= 12; m++){
    const { gy: mGy, gm: mGm, gd: mGd } = jalaali.toGregorian(year, m, 1)
    const diff = Math.round((new Date(mGy, mGm - 1, mGd) - startDate) / 86400000)
    res.push({ name: monthNames[m - 1], colIndex: Math.floor((diff + startWeekday) / 7) })
  }
  return res.map((m, i) => ({
    name: m.name, start: m.colIndex, end: (i < res.length - 1 ? res[i+1].colIndex : cols)
  }))
})

const weeklyStats = computed(() => {
  const weeks = []
  for (let i = 0; i < yearDays.value.length; i += 7) {
    const chunk = yearDays.value.slice(i, i + 7)
    const total = chunk.reduce((s, d) => s + d.total, 0)
    const done = chunk.reduce((s, d) => s + d.done, 0)
    const isFuture = chunk[0].jy * 10000 + chunk[0].jm * 100 + chunk[0].jd > todayNumeric
    weeks.push({
      title: `هفته ${Math.floor(i / 7) + 1}`,
      dateStart: chunk[0].dateStart, dateEnd: chunk[chunk.length-1].dateStart,
      total, done, percent: total ? Math.round((done / total) * 100) : 0,
      level: getLevel(total, done, isFuture), isCurrent: chunk.some(d => d.key === todayKey.value)
    })
  }
  return weeks
})

const monthlyStats = computed(() => {
  return monthNames.map((name, i) => {
    const days = yearDays.value.filter(d => d.jm === i + 1)
    if (!days.length) return { title: name, level: 0, percent: 0, sparkPoints: [] };
    const total = days.reduce((s, d) => s + d.total, 0)
    const done = days.reduce((s, d) => s + d.done, 0)
    const isFuture = (selectedYear.value * 100 + (i + 1)) > (todayObj.jy * 100 + todayObj.jm)
    return {
      title: name, dateStart: days[0].dateStart, dateEnd: days[days.length - 1].dateStart,
      total, done, percent: total ? Math.round((done / total) * 100) : 0,
      level: getLevel(total, done, isFuture),
      sparkPoints: days.map(d => (d.total && !d.isFuture) ? Math.round((d.done / d.total) * 100) : 0)
    }
  })
})

/* ===== Tooltip & Global Click Handling ===== */
function handleToggleTip(e, data) {
  e.stopPropagation();
  tip.value.isMobile = window.innerWidth < 768
  tip.value.data = data
  tip.value.show = true
  if (!tip.value.isMobile) {
    tip.value.x = Math.min(e.clientX + 15, window.innerWidth - 250)
    tip.value.y = e.clientY - 180
  }
}

const closeGlobal = (e) => {
  if (!tip.value.show) return;
  if (tooltipRef.value && !tooltipRef.value.contains(e.target)) {
    tip.value.show = false;
  }
};

onMounted(() => {
  fetchActivities(selectedYear.value);
  window.addEventListener('click', closeGlobal);
});

onUnmounted(() => {
  window.removeEventListener('click', closeGlobal);
});

watch(selectedYear, y => fetchActivities(y))

function getSparklinePath(points) {
  if (!points || points.length < 2) return ''
  const width = 100; const height = 30
  const step = width / (points.length - 1)
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (p * height / 100)}`).join(' ')
}

// ✅ تعریف کارت‌ها با آیکون‌ها (بدون رنگ ثابت - رنگ از تم گرفته میشود)
const statCards = computed(() => [
  { label: 'کل تسک', value: stats.value.total, icon: ListChecks },
  { label: 'روز طلایی', value: stats.value.perfect, icon: Star },
  { label: 'بازدهی', value: stats.value.avg + '%', icon: TrendingUp },
  { label: 'استراحت', value: stats.value.inactive, icon: Moon }
])
</script>

<template>
  <div class="stats-page">

    <div class="header-row">
      <div class="tab-box">
        <button v-for="t in ['yearly','weekly','monthly']" :key="t" @click="activeTab = t"
                :class="['t-btn', {active: activeTab === t}]">
          <LayoutGrid v-if="t==='yearly'" class="s-icon"/>
          <Hash v-if="t==='weekly'" class="s-icon"/>
          <Calendar v-if="t==='monthly'" class="s-icon"/>
          <span>{{ t === 'yearly' ? 'سالانه' : t === 'weekly' ? 'هفتگی' : 'ماهانه' }}</span>
        </button>
      </div>
      <BaseSelect v-model="selectedYear" name="year-select" :options="years.map(y=>({value:y, label:String(y)}))" class="year-sel" />
    </div>

    <!-- کارت‌های آمار -->
    <div v-if="isLoading" class="stats-cards-grid">
      <div v-for="i in 4" :key="i" class="stat-card pulse-bg"></div>
    </div>

    <div v-else class="stats-cards-grid">
      <div v-for="(card, i) in statCards" :key="i" class="stat-card group">
        <div class="flex items-center justify-between w-full gap-3">
          <!-- بخش آیکون (چپ چین) - رنگ از متغیرهای تم -->
          <div class="icon-box">
            <component :is="card.icon" class="w-5 h-5" />
          </div>
          <!-- بخش متن (راست چین) -->
          <div class="flex flex-col items-end flex-1 min-w-0">
            <div class="stat-v">{{ card.value }}</div>
            <div class="stat-l">{{ card.label }}</div>
          </div>



        </div>
      </div>
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
              <div class="months-row" :style="{ display: 'grid', gridTemplateColumns: `repeat(${yearDays.length ? Math.max(...yearDays.map(d => d.colIndex)) + 1 : 0}, ${CELL}px)`, gap: `${GAP}px` }">
                <span v-for="m in monthSpans" :key="m.name" :style="{ gridColumn: `${m.start + 1} / ${m.end + 1}` }">{{m.name}}</span>
              </div>
              <div class="cells-body" :style="{ display: 'grid', gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoFlow: 'column', gap: `${GAP}px` }">
                <button v-for="day in yearDays" :key="day.key"
                        class="cell" :class="{'today-cell': day.key === todayKey}"
                        :style="{ backgroundColor: LEVEL_COLORS[day.level], gridRow: day.rowIndex + 1, gridColumn: day.colIndex + 1 }"
                        @click.stop="handleToggleTip($event, { title: 'گزارش روزانه', type: 'daily', ...day })"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'weekly'" class="fade-in weekly-view-grid">
        <div v-for="w in weeklyStats" :key="w.title" class="week-node" :class="{curr: w.isCurrent}" :style="{backgroundColor: LEVEL_COLORS[w.level]}"
             @click.stop="handleToggleTip($event, {type: 'weekly', ...w})">
          <span class="week-pct-label">{{w.percent}}%</span>
        </div>
      </div>

      <div v-else-if="activeTab === 'monthly'" class="fade-in monthly-view-grid">
        <div v-for="m in monthlyStats" :key="m.title" class="month-node" :style="{borderBottomColor: LEVEL_COLORS[m.level]}"
             @click.stop="handleToggleTip($event, {title: `ماه ${m.title}`, type: 'monthly', ...m})">
          <div class="mo-info">
            <span class="m-name">{{m.title}}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-30">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <div class="sparkline-box">
            <svg viewBox="0 0 100 30" class="sparkline-svg">
              <path :d="getSparklinePath(m.sparkPoints)" fill="none" :stroke="LEVEL_COLORS[m.level]" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="mo-bar"><div :style="{width: m.percent+'%', backgroundColor: LEVEL_COLORS[m.level]}"></div></div>
          <div class="mo-pct-footer" :style="{color: LEVEL_COLORS[m.level]}">{{m.percent}}% پیشرفت</div>
        </div>
      </div>
    </div>

    <div class="legend-row">
      <span>کم فعالیت</span>
      <div class="legend-colors">
        <div v-for="c in LEVEL_COLORS.slice(1)" :key="c" :style="{backgroundColor: c}"></div>
      </div>
      <span>پر فعالیت</span>
    </div>

    <Teleport to="body">
      <div v-if="tip.show" :class="['tip-root', { 'is-mobile': tip.isMobile }]"
           :style="!tip.isMobile ? { left: tip.x+'px', top: tip.y+'px' } : {}">
        <div class="tip-card-final shadow-2xl" ref="tooltipRef" @click.stop>
          <div class="tip-header">
            <div class="tip-status-dot" :style="{backgroundColor: LEVEL_COLORS[tip.data.level]}"></div>
            <span class="tip-title-text">{{tip.data.title}}</span>
            <button @click="tip.show = false" class="tip-close-x"><X class="w-4 h-4"/></button>
          </div>

          <div class="tip-dates-area">
            <div class="date-row"><span>تاریخ شروع:</span> <b>{{tip.data.dateStart}}</b></div>
            <div v-if="tip.data.dateEnd" class="date-row"><span>تاریخ پایان:</span> <b>{{tip.data.dateEnd}}</b></div>
          </div>

          <div class="tip-stats-grid">
            <div class="stat-line"><span>کل تسک‌ها:</span> <b>{{tip.data.total}}</b></div>
            <div class="stat-line"><span>انجام شده:</span> <b>{{tip.data.done}}</b></div>
          </div>

          <div class="tip-progress-container">
            <div class="tip-progress-fill" :style="{width: tip.data.percent+'%', backgroundColor: 'var(--color-primary)'}"></div>
          </div>
          <div class="tip-final-percent" :style="{color: LEVEL_COLORS[tip.data.level]}">{{tip.data.percent}}% بازدهی</div>

          <button
              v-if="tip.data.type === 'daily' || tip.data.type === 'weekly' || tip.data.type === 'monthly'"
              @click="handleViewTasks(tip.data)"
              class="mt-4 w-full text-center text-xs font-bold text-primary py-2 border-t border-border hover:bg-primary/5 transition-colors rounded-b-xl"
          >
            مشاهده جزئیات تسک‌ها
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.stats-page { background-color: var(--color-background); min-height: 100vh; padding: 1.5rem; direction: rtl; color: var(--color-text); }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.tab-box { display: flex; background: var(--color-background-soft); padding: 4px; border-radius: 12px; border: 1px solid var(--color-border); }
.t-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: bold; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; border: none; background: transparent; cursor: pointer; transition: 0.2s; }
.t-btn.active { background: var(--color-background); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.s-icon { width: 14px; height: 14px; }

/* ✅ استایل کارت‌ها با پشتیبانی از تمام تم‌ها */
.stats-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.stat-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  padding: 1.25rem;
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
}
.stat-v { font-size: 1.5rem; font-weight: 900; color: var(--color-heading); line-height: 1.2; }
.stat-l { font-size: 11px; color: var(--color-text-secondary); font-weight: 600; margin-top: 4px; }

/* ✅ باکس آیکون: استفاده از color-mix برای سازگاری با تم */
.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* ترکیب 10% رنگ اصلی با 90% شفافیت/پس‌زمینه */
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary); /* رنگ خود آیکون */
}

/* Skeleton Loading */
.pulse-bg { background: linear-gradient(90deg, var(--color-background-soft) 25%, var(--color-background-mute) 50%, var(--color-background-soft) 75%); background-size: 200% 100%; animation: pulse 1.5s infinite; height: 88px; }
@keyframes pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.main-panel { background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 24px; padding: 1.5rem; min-height: 300px; position: relative; }
.loading-center { display: flex; justify-content: center; align-items: center; min-height: 200px; }

/* Heatmap Logic */
.heatmap-scroll { overflow-x: auto; padding: 1rem 0; }
.heatmap-inner { display: flex; gap: 10px; min-width: max-content; padding-top: 25px; }
.days-labels { display: grid; grid-template-rows: repeat(7, 14px); gap: 2px; }
.days-labels span { font-size: 9px; color: var(--color-text-secondary); height: 14px; display: flex; align-items: center; font-weight: bold; }
.grid-container { position: relative; }
.months-row { position: absolute; top: -22px; left: 0; right: 0; }
.months-row span { font-size: 10px; font-weight: 800; color: var(--color-text-secondary); text-align: center; white-space: nowrap; }
.cell { width: 14px; height: 14px; border-radius: 3px; border: none; cursor: pointer; transition: transform 0.1s; border: 1px solid rgba(0,0,0,0.05); }
.cell:hover { transform: scale(1.3); z-index: 5; }
.today-cell { outline: 2.5px solid var(--color-primary); outline-offset: 1.5px; }

/* Weekly Grid */
.weekly-view-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(55px, 1fr)); gap: 12px; }
.week-node { aspect-ratio: 1; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.2s; }
.week-node:hover { transform: translateY(-3px); }
.week-pct-label { font-size: 11px; font-weight: 900; color: rgba(0,0,0,0.4); }
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

/* Legend */
.legend-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; font-size: 11px; font-weight: bold; color: var(--color-text-secondary); }
.legend-colors { display: flex; gap: 4px; }
.legend-colors div { width: 12px; height: 12px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.05); }

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

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scroll::-webkit-scrollbar { height: 5px; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
