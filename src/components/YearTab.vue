<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue' 
import jalaali from 'jalaali-js'
import api from '@/plugins/axios'
import { ListChecks, CheckCircle2, Star, CalendarDays, Zap } from 'lucide-vue-next' 
import BaseSelect from './UI/BaseSelect.vue' 

/* ===== اندازه‌ها ===== */
const CELL = 14   // px
const GAP  = 1    // px
const LABEL_H = 18 // ارتفاع نوار عنوان ماه‌ها (px)

/* ===== پالت شدت جدید (0..7) ===== */
const LEVEL_COLORS = [
  'var(--color-background-mute)', // 0: بدون فعالیت یا روز آینده
  '#B91C1C', // 1: 0-20% (قرمز پررنگ / Red-700)
  '#DC2626', // 2: 20-30% (قرمز معمولی / Red-600)
  '#FCD34D', // 3: 30-45% (نارنجی روشن / Amber-300)
  '#F59E0B', // 4: 45-55% (نارنجی معمولی / Amber-500)
  '#86EFAC', // 5: 55-70% (سبز کمرنگ / Emerald-300)
  '#34D399', // 6: 70-85% (سبز معمولی / Emerald-400)
  '#059669'  // 7: 85-100% (سبز پررنگ / Emerald-600)
]

/* ===== راهنمای رنگ (Legend) ===== */
const LEVEL_LEGENDS = [
  { color: LEVEL_COLORS[1], label: '۰٪ تا ۲۰٪' },
  { color: LEVEL_COLORS[2], label: '۲۰٪ تا ۳۰٪' },
  { color: LEVEL_COLORS[3], label: '۳۰٪ تا ۴۵٪' },
  { color: LEVEL_COLORS[4], label: '۴۵٪ تا ۵۵٪' },
  { color: LEVEL_COLORS[5], label: '۵۵٪ تا ۷۰٪' },
  { color: LEVEL_COLORS[6], label: '۷۰٪ تا ۸۵٪' },
  { color: LEVEL_COLORS[7], label: '۸۵٪ تا ۱۰۰٪' },
  { color: LEVEL_COLORS[0], label: 'بدون فعالیت ' } 
]

/* ===== State & Refs ===== */
const years = Array.from({ length: 10 }, (_, i) => 1400 + i)
const selectedYear = ref(1404)
const activitiesData = ref({}) 
const perfectDaysCount  = ref(null) 
const avgCompletionPct  = ref(null) 
const inactiveDays      = ref(null) 
const totalTasksYTD     = ref(null) 

const heatmapContainer = ref(null) 
const yearViewContainer = ref(null) 

/* ===== Labels ===== */
const weekDays   = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

/* ===== Today's Key ===== */
const todayKey = computed(() => { 
  const { jy, jm, jd } = jalaali.toJalaali(new Date());
  return `${jy}-${jm}-${jd}`;
});

/* ===== Scroll Logic (Horizontal) ===== */
function scrollToToday() {
  // if (window.innerWidth >= 768) return; 

  if (!heatmapContainer.value) return;

  const todayCell = heatmapContainer.value.querySelector('.today-cell');

  if (todayCell) {
    todayCell.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest', 
      inline: 'center' 
    });
  }
}

/* ===== Auto Scroll Logic (Vertical & Timed Horizontal - Delay: 1200ms) ===== */
function autoScroll() {
  // if (window.innerWidth >= 768) return; 

  const currentJalaaliYear = jalaali.toJalaali(new Date()).jy;
  if (selectedYear.value !== currentJalaaliYear) return; 

  const heatmapEl = heatmapContainer.value;
  if (!heatmapEl) return;
  
  // مرحله ۱: اسکرول عمودی صفحه به بالای کانتینر هیت‌مپ
  window.scrollTo({
    top: heatmapEl.offsetTop,
    behavior: 'smooth'
  });

  // مرحله ۲: اجرای اسکرول افقی با تأخیر طولانی‌تر
  setTimeout(() => {
    scrollToToday(); 
  }, 1200); 
}

/* ===== Fetch and Stats Calculation ===== */
async function fetchActivities(year){
  try{
    const res = await api.get(`/activities/${year}`)
    const data = res.data?.data || {} 
    activitiesData.value = data
    
    // خواندن گزارش‌ها
    perfectDaysCount.value = res.data?.perfect_days_count || 0
    avgCompletionPct.value = res.data?.average_completion_percentage || 0 
    inactiveDays.value     = res.data?.inactive_days || 0 
    totalTasksYTD.value    = res.data?.total_tasks_year_to_date || 0 
    
    // فراخوانی AutoScroll 
    const currentJalaaliYear = jalaali.toJalaali(new Date()).jy;
    if (year === currentJalaaliYear) {
      nextTick(autoScroll); 
    }
    
  }catch(e){
    console.error('خطا در گرفتن داده:', e)
    activitiesData.value = {}
  }
}
watch(selectedYear, y => fetchActivities(y))
onMounted(() => fetchActivities(selectedYear.value))


/* ===== Year meta and other computed properties (بدون تغییر) ===== */
function isLeapJalaaliYear(y){ return ((y * 8 + 29) % 33) < 8 }

const yearMeta = computed(() => { 
  const year = selectedYear.value
  const daysInYear = isLeapJalaaliYear(year) ? 366 : 365
  const { gy, gm, gd } = jalaali.toGregorian(year, 1, 1)
  const startDate = new Date(gy, gm - 1, gd)
  const startWeekday = (startDate.getDay() + 1) % 7 
  return { year, daysInYear, startDate, startWeekday }
})


/* ===== Heat level ===== */
function getLevel(key, total, done) {
    const [jy, jm, jd] = key.split('-').map(Number);
    const todayJalaali = jalaali.toJalaali(new Date());
    const dayNumeric = jy * 10000 + jm * 100 + jd;
    const todayNumeric = todayJalaali.jy * 10000 + todayJalaali.jm * 100 + todayJalaali.jd;
    if (dayNumeric > todayNumeric) return 0; 
    if (!total) return 0; 
    const p = (done / total) * 100;
    if (p <= 20) return 1; 
    if (p <= 30) return 2; 
    if (p <= 45) return 3; 
    if (p <= 55) return 4; 
    if (p <= 70) return 5; 
    if (p <= 85) return 6; 
    return 7; 
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
    const level = getLevel(key, total, done) 
    days.push({
      rowIndex, colIndex, jy, jm, jd, key, total, done, level,
      shamsiDate: `${jy}/${jm}/${jd}`
    })
  }
  return days
})


/* ===== ستون شروع هر ماه و ستون‌ها ===== */
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


/* ===== Tooltip ===== */
const tip = ref({ show:false, x:0, y:0, day:null })

const currentTipTasks = computed(() => { 
    if (!tip.value.day || !tip.value.day.key) return { total: 0, done: 0, percent: 0 };
    const data = activitiesData.value?.[tip.value.day.key] || {};
    return {
        total: data.total || 0,
        done: data.done || 0,
        percent: data.total ? Math.round((data.done / data.total) * 100) : 0
    };
});


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
  tip.value.day = { ...day } 
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
  <div class="w-full min-h-screen p-6 bg-[var(--color-background)] text-[var(--color-text)]" 
       @mousemove="moveTooltip" 
       ref="yearViewContainer">
    <div class="w-full flex justify-end mb-4">
      <BaseSelect v-model="selectedYear"
       :options="yearOptions" 
       class="w-full max-w-[160px] md:w-40" 
        name="year" 
        placeholder="انتخاب سال" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><ListChecks class="w-5 h-5"/></div>
        <div class="stat-value">{{ totalTasksYTD !== null ? totalTasksYTD : '—' }}</div>
        <div class="stat-label">کل تسک‌های تعریف‌شده (تا امروز)</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-green-500/10 text-green-500"><CheckCircle2 class="w-5 h-5"/></div>
        <div class="stat-value">{{ perfectDaysCount !== null ? perfectDaysCount : '—' }}</div>
        <div class="stat-label">روزهای کمال (تکمیل ۱۰۰٪)</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-orange-500/10 text-orange-500"><Star class="w-5 h-5"/></div>
        <div class="stat-value">{{ avgCompletionPct !== null ? avgCompletionPct : '—' }}%</div>
        <div class="stat-label">میانگین درصد تکمیل</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-red-500/10 text-red-500"><Zap class="w-5 h-5"/></div>
        <div class="stat-value">{{ inactiveDays !== null ? inactiveDays : '—' }}</div>
        <div class="stat-label">روزهای بدون فعالیت</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-x-2 gap-y-2 text-xs text-[var(--color-text-secondary)] mb-3 border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-background-soft)] sm:flex sm:flex-wrap sm:gap-x-4">
      <span v-for="(item,idx) in LEVEL_LEGENDS" :key="idx"
            class="inline-flex items-center gap-1 rounded-[4px]"
            :title="item.label"
      >
        <span class="inline-block rounded-[4px] border border-[var(--color-border)] hover:scale-[1.06] transition-transform"
            :style="{ width:'14px', height:'14px', backgroundColor:item.color }"
        ></span>
        <span>
            {{ item.label }}
        </span>
      </span>
    </div>

    <div class="w-full overflow-auto" ref="heatmapContainer">
      <div class="relative w-max mx-auto" :style="{ paddingTop: `${LABEL_H}px` }">
        <div class="flex items-start gap-3">
          <div class="grid grid-rows-7 flex-shrink-0" :style="{ gap: `${GAP}px` }">
            <div
                v-for="(d,i) in weekDays" :key="i"
                class="text-[11px] font-medium text-[var(--color-text-secondary)]"
                :style="{ height:`${CELL}px`, lineHeight:`${CELL}px` }"
            >
              {{ d }}
            </div>
          </div>

          <div class="relative">
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
                  :class="{'today-cell': day.key === todayKey}" 
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
            کل: <span class="font-semibold text-[var(--color-heading)]">{{ currentTipTasks.total }}</span>
            &nbsp;|&nbsp;
            انجام: <span class="font-semibold text-[var(--color-heading)]">{{ currentTipTasks.done }}</span>
        </div>
        
        <div class="h-2 w-full rounded bg-[var(--color-border)] overflow-hidden">
          <div class="h-2 rounded progress-fill"
               :style="{ 
                 width: currentTipTasks.percent + '%' 
               }"></div>
        </div>
      </div>
      <div class="tip-arrow"></div>
    </div>
  </div>
</template>

<style scoped>
/* ... استایل‌ها بدون تغییر ... */
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

/* ⬅️ نشانگر بصری برای روز جاری */
.today-cell {
  box-shadow: 0 0 0 2px var(--color-primary); 
}


/* Tooltip */
.tip-box{
  background: var(--color-background);
  color: var(--color-text);
}
.tip-inner{
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
}
.tip-arrow{
  width: 10px; height: 10px;
  background: var(--color-background-soft);
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