<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import jalaali from 'jalaali-js'
import api from '@/plugins/axios'
import { ListChecks, CheckCircle2, PercentCircle, Star, CalendarDays } from 'lucide-vue-next'
import BaseSelect from './UI/BaseSelect.vue' // مسیر را متناسب پروژه تنظیم کن

/* ===== اندازه‌ها ===== */
const CELL = 14   // px
const GAP  = 1    // px
const LABEL_H = 18 // ارتفاع نوار عنوان ماه‌ها (px)

/* ===== پالت شدت (0..5) ===== */
const LEVEL_COLORS = [
  'var(--color-background-mute)', // 0
  '#F87171', // 1 (red-400)
  '#F59E0B', // 2 (amber-500)
  '#86EFAC', // 3 (emerald-300)
  '#34D399', // 4 (emerald-400)
  '#10B981'  // 5 (emerald-500)
]

/* ===== State ===== */
const years = Array.from({ length: 10 }, (_, i) => 1400 + i)
const selectedYear = ref(1404)
const activitiesData = ref({}) // { '1404-1-1': { total, done } }

/* ===== Fetch ===== */
async function fetchActivities(year){
  try{
    const res = await api.get(`/activities/${year}`)
    activitiesData.value = res.data?.data || {}
  }catch(e){
    console.error('خطا در گرفتن داده:', e)
    activitiesData.value = {}
  }
}
watch(selectedYear, y => fetchActivities(y))
onMounted(() => fetchActivities(selectedYear.value))

/* ===== Labels ===== */
const weekDays   = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

/* ===== Year meta ===== */
function isLeapJalaaliYear(y){ return ((y * 8 + 29) % 33) < 8 }
const yearMeta = computed(() => {
  const year = selectedYear.value
  const daysInYear = isLeapJalaaliYear(year) ? 366 : 365
  const { gy, gm, gd } = jalaali.toGregorian(year, 1, 1)
  const startDate = new Date(gy, gm - 1, gd)
  const startWeekday = (startDate.getDay() + 1) % 7 // شنبه=0
  return { year, daysInYear, startDate, startWeekday }
})

/* ===== Heat level ===== */
function getLevel(total, done){
  if (!total) return 0
  const p = (done / total) * 100
  if (p === 0)  return 1
  if (p <= 25) return 2
  if (p <= 50) return 3
  if (p <= 75) return 4
  return 5
}

/* ===== Build days ===== */
const yearDays = computed(() => {
  const { daysInYear, startDate, startWeekday } = yearMeta.value
  const days = []
  for (let i = 0; i < daysInYear; i++){
    const rowIndex = (i + startWeekday) % 7
    const colIndex = Math.floor((i + startWeekday) / 7)
    const dateObj = new Date(startDate.getTime() + i * 86400000)
    const { jy, jm, jd } = jalaali.toJalaali(dateObj)
    const key = `${jy}-${jm}-${jd}`
    const total = activitiesData.value?.[key]?.total || 0
    const done  = activitiesData.value?.[key]?.done  || 0
    const level = getLevel(total, done)
    days.push({
      rowIndex, colIndex, jy, jm, jd, key, total, done, level,
      shamsiDate: `${jy}/${jm}/${jd}`
    })
  }
  return days
})

/* ===== ستون شروع هر ماه ===== */
const monthStarts = computed(() => {
  const { year, startDate, startWeekday } = yearMeta.value
  const res = []
  for (let m = 1; m <= 12; m++){
    const { gy, gm, gd } = jalaali.toGregorian(year, m, 1)
    const d = new Date(gy, gm - 1, gd)
    const diff = Math.round((d - startDate) / 86400000)
    const colIndex = Math.floor((diff + startWeekday) / 7)
    res.push({ name: monthNames[m - 1], colIndex })
  }
  return res
})

/* ===== تعداد ستون‌ها و span ماه‌ها ===== */
const columnsCount = computed(() => {
  if (!yearDays.value.length) return 0
  const maxCol = yearDays.value.reduce((mx, d) => Math.max(mx, d.colIndex), 0)
  return maxCol + 1
})
const monthSpans = computed(() => {
  const cols = columnsCount.value
  const starts = monthStarts.value
  return starts.map((m, i) => {
    const start = m.colIndex
    const end   = (i < starts.length - 1 ? starts[i+1].colIndex : cols)
    return { name: m.name, start, end }
  })
})

/* ===== Cards ===== */
const totalTasks = computed(() =>
    Object.values(activitiesData.value).reduce((s, v) => s + (v?.total || 0), 0)
)
const doneTasks = computed(() =>
    Object.values(activitiesData.value).reduce((s, v) => s + (v?.done || 0), 0)
)
const completionPercent = computed(() =>
    totalTasks.value ? Math.round((doneTasks.value / totalTasks.value) * 100) : 0
)
const busiestDay = computed(() => {
  const entries = Object.entries(activitiesData.value || {})
  if (!entries.length) return null
  const [key] = entries.sort((a,b) => (b[1]?.total || 0) - (a[1]?.total || 0))[0]
  return key
})

/* ===== Tooltip (fixed) ===== */
const tip = ref({ show:false, x:0, y:0, day:null })
function positionTip(clientX, clientY){
  const pad = 10, W = 220, H = 96
  let x = clientX + 12
  let y = clientY - H - 12
  if (y < pad) y = clientY + 12
  x = Math.max(pad, Math.min(x, window.innerWidth  - W - pad))
  y = Math.max(pad, Math.min(y, window.innerHeight - H - pad))
  return { x, y }
}
function showTooltip(e, day){
  tip.value.day = day
  const { x, y } = positionTip(e.clientX, e.clientY)
  tip.value.x = x; tip.value.y = y; tip.value.show = true
}
function moveTooltip(e){
  if (!tip.value.show) return
  const { x, y } = positionTip(e.clientX, e.clientY)
  tip.value.x = x; tip.value.y = y
}
function hideTooltip(){ tip.value.show = false; tip.value.day = null }

/* ===== Select options ===== */
const yearOptions = years.map(y => ({ value:y, label: String(y) }))
</script>

<template>
  <div class="w-full min-h-screen p-6 bg-[var(--color-background)] text-[var(--color-text)]" @mousemove="moveTooltip">
    <!-- سال -->
    <div class="w-full flex justify-end mb-4">
      <BaseSelect v-model="selectedYear" :options="yearOptions" class="w-40" placeholder="انتخاب سال" />
    </div>

    <!-- کارت‌ها -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><ListChecks class="w-5 h-5"/></div>
        <div class="stat-value">{{ totalTasks }}</div>
        <div class="stat-label">کل تسک‌ها</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-[var(--color-accent)]/10 text-[var(--color-accent)]"><CheckCircle2 class="w-5 h-5"/></div>
        <div class="stat-value">{{ doneTasks }}</div>
        <div class="stat-label">انجام‌شده</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]"><PercentCircle class="w-5 h-5"/></div>
        <div class="stat-value">{{ completionPercent }}%</div>
        <div class="stat-label">درصد تکمیل سال</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Star class="w-5 h-5"/></div>
        <div class="stat-value text-sm sm:text-base">{{ busiestDay ? busiestDay : '—' }}</div>
        <div class="stat-label">پُرکارترین روز</div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-3">
      شدت فعالیت:
      <span v-for="(c,idx) in LEVEL_COLORS" :key="idx"
            class="inline-block rounded-[4px] border border-[var(--color-border)] hover:scale-[1.06] transition-transform"
            :style="{ width:'14px', height:'14px', backgroundColor:c }"
            :title="idx === 0 ? 'بدون فعالیت' : `سطح ${idx}`"></span>
    </div>

    <!-- Heatmap -->
    <div class="w-full overflow-auto">
      <div class="relative w-max mx-auto" :style="{ paddingTop: `${LABEL_H}px` }">
        <div class="flex items-start gap-3">
          <!-- روزهای هفته -->
          <div class="grid grid-rows-7 flex-shrink-0" :style="{ gap: `${GAP}px` }">
            <div
                v-for="(d,i) in weekDays" :key="i"
                class="text-[11px] font-medium text-[var(--color-text-secondary)]"
                :style="{ height:`${CELL}px`, lineHeight:`${CELL}px` }"
            >
              {{ d }}
            </div>
          </div>

          <!-- گرید + لایهٔ ماه‌ها -->
          <div class="relative">
            <!-- ماه‌ها: span روی بازه هر ماه -->
            <div class="absolute left-0 right-0"
                 :style="{ top: `-${LABEL_H}px`, height: LABEL_H + 'px' }">
              <div
                  class="grid items-end"
                  :style="{
                  gridTemplateColumns: `repeat(${columnsCount}, ${CELL}px)`,
                  columnGap: `${GAP}px`,
                  height: '100%'
                }"
              >
                <div
                    v-for="m in monthSpans" :key="m.name"
                    class="text-[10px] font-semibold text-[var(--color-text-secondary)] text-center select-none"
                    :style="{ gridColumn: `${m.start + 1} / ${m.end + 1}` }"
                >
                  {{ m.name }}
                </div>
              </div>
            </div>

            <!-- گرید اصلی روزها -->
            <div class="grid relative"
                 role="grid"
                 :style="{
                   gridTemplateRows: `repeat(7, ${CELL}px)`,
                   gridAutoColumns: `${CELL}px`,
                   gap: `${GAP}px`
                 }">
              <button
                  v-for="day in yearDays" :key="day.key" type="button"
                  class="hm-cell rounded-[3px] border border-[var(--color-border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  :style="{
                  gridRow: day.rowIndex + 1,
                  gridColumn: day.colIndex + 1,
                  backgroundColor: LEVEL_COLORS[day.level]
                }"
                  :aria-label="`${day.shamsiDate} — کل ${day.total} / انجام ${day.done}`"
                  @mouseenter="showTooltip($event, day)"
                  @mouseleave="hideTooltip"
                  @focus="(e)=>showTooltip(e, day)"
                  @blur="hideTooltip"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
        v-if="tip.show && tip.day"
        class="tip-box fixed z-50 text-xs pointer-events-none"
        :style="{ left: tip.x+'px', top: tip.y+'px', width:'220px' }"
    >
      <div class="tip-inner">
        <div class="flex items-center gap-2 mb-1">
          <div class="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <CalendarDays class="w-4 h-4" />
          </div>
          <div class="font-bold text-sm text-[var(--color-heading)]">{{ tip.day.shamsiDate }}</div>
        </div>
        <div class="text-[11px] mb-2 text-[var(--color-text-secondary)]">
          کل: <span class="font-semibold text-[var(--color-heading)]">{{ tip.day.total }}</span>
          &nbsp;|&nbsp;
          انجام: <span class="font-semibold text-[var(--color-heading)]">{{ tip.day.done }}</span>
        </div>
        <div class="h-2 w-full rounded bg-[var(--color-border)] overflow-hidden">
          <div class="h-2 rounded progress-fill"
               :style="{ width: (tip.day.total ? Math.round((tip.day.done / tip.day.total)*100) : 0) + '%' }"></div>
        </div>
      </div>
      <div class="tip-arrow"></div>
    </div>
  </div>
</template>

<style scoped>
/* کارت‌ها */
.stat-card{
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto;
  gap: .35rem;
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease;
}
.stat-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 26px rgba(0,0,0,.06);
  border-color: var(--color-border-hover);
}
.stat-icon{
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  margin: 0 auto .25rem auto;
}
.stat-value{ color: var(--color-heading); font-weight: 800; font-size: 1.2rem; }
.stat-label{ font-size: .75rem; color: var(--color-text-secondary); }

/* سلول‌های هیت‌مپ – انیمیشن ظریف */
.hm-cell{
  transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
  will-change: transform, filter;
}
.hm-cell:hover{
  transform: scale(1.08);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.08));
}
.hm-cell:active{
  transform: scale(0.98);
}

/* Tooltip */
.tip-inner{
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
}
.tip-arrow{
  width: 10px; height: 10px;
  background: #fff;
  border-left: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  transform: rotate(45deg);
  margin: -5px auto 0 auto;
  box-shadow: -3px -3px 15px rgba(0,0,0,.03);
}

/* Progress Fill (gradient) */
.progress-fill{
  background-image: linear-gradient(90deg, #34D399, #10B981);
}

/* کاهش حرکت */
@media (prefers-reduced-motion: reduce){
  *{ transition-duration:.01ms !important; animation-duration:.01ms !important; }
}
</style>
