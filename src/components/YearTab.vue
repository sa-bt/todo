<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import jalaali from 'jalaali-js'
import api from '@/plugins/axios'

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

// تبدیل اعداد انگلیسی به فارسی
function toFarsiNumber(n: number | string) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

// انتخاب سال
const years = Array.from({ length: 10 }, (_, i) => 1400 + i)
const selectedYear = ref(1404)

// داده فعالیت‌ها از بک‌اند
const activitiesData = ref<Record<string, { total: number; done: number }>>({})

// گرفتن داده از سرور
async function fetchActivities(year: number) {
  try {
    const res = await api.get(`/activities/${year}`)
    activitiesData.value = res.data.data
  } catch (err) {
    console.error("خطا در گرفتن داده:", err)
  }
}

watch(selectedYear, (newYear) => fetchActivities(newYear))
onMounted(() => fetchActivities(selectedYear.value))

const weekDays = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

function isLeapJalaaliYear(year: number) {
  return ((year * 8 + 29) % 33) < 8
}

function getColorByPercent(total: number, done: number) {
  if (total === 0) return '#ebedf0'
  const percent = (done / total) * 100
  if (percent === 0) return '#f87171'
  if (percent <= 25) return '#facc15'
  if (percent <= 50) return '#9be9a8'
  if (percent <= 75) return '#40c463'
  return '#30a14e'
}

// آرایه روزهای سال
const yearDays = computed(() => {
  const year = selectedYear.value
  const daysInYear = isLeapJalaaliYear(year) ? 366 : 365
  const { gy, gm, gd } = jalaali.toGregorian(year, 1, 1)
  const startDate = new Date(gy, gm - 1, gd)
  const startWeekday = (startDate.getDay() + 1) % 7

  return Array.from({ length: daysInYear }, (_, i) => {
    const rowIndex = (i + startWeekday) % 7
    const colIndex = Math.floor((i + startWeekday) / 7)
    const dateObj = new Date(startDate.getTime() + i * 86400000)
    const { jy, jm, jd } = jalaali.toJalaali(dateObj)

    const shamsiKey = `${jy}-${jm}-${jd}`
    const shamsiDate = `${toFarsiNumber(jy)}-${toFarsiNumber(jm)}-${toFarsiNumber(jd)}`

    const total = activitiesData.value?.[shamsiKey]?.total || 0
    const done  = activitiesData.value?.[shamsiKey]?.done  || 0
    const color = getColorByPercent(total, done)

    return { rowIndex, colIndex, shamsiDate, total, done, color }
  })
})

// کارت‌ها
const totalTasks = computed(() =>
  Object.values(activitiesData.value).reduce((sum, day) => sum + day.total, 0)
)
const doneTasks = computed(() =>
  Object.values(activitiesData.value).reduce((sum, day) => sum + day.done, 0)
)
const completionPercent = computed(() =>
  totalTasks.value ? Math.round((doneTasks.value / totalTasks.value) * 100) : 0
)
const busiestDay = computed(() => {
  if (!Object.keys(activitiesData.value).length) return null
  return Object.entries(activitiesData.value).sort((a,b)=>b[1].total-a[1].total)[0][0]
})

// Tooltip JS محور
function showTooltip(event: MouseEvent, day: any) {
  const container = (event.currentTarget as HTMLElement).closest('.grid')
  if (!container) return
  const rect = container.getBoundingClientRect()

  tooltip.value.visible = true
  tooltip.value.content = `
    <div class="font-bold mb-1 text-sm">${day.shamsiDate}</div>
    <div class="text-xs">کل: ${toFarsiNumber(day.total)} | انجام: ${toFarsiNumber(day.done)}</div>
    <div class="relative h-2 w-20 bg-gray-300 rounded mt-1">
      <div class="h-2 rounded" style="width:${day.total ? (day.done / day.total * 100) : 0}%; background-color:${day.total ? getColorByPercent(day.total, day.done) : '#ebedf0'}"></div>
    </div>
    <div class="text-[10px] text-right mt-0.5">(٪${toFarsiNumber(Math.round(day.total ? (day.done / day.total) * 100 : 0))})</div>
  `
  tooltip.value.x = event.clientX - rect.left + 10
  tooltip.value.y = event.clientY - rect.top + 10
}
function hideTooltip() {
  tooltip.value.visible = false
}
</script>

<template>
  <div class="w-full min-h-screen flex flex-col items-center justify-start p-4 bg-gray-50">

    <!-- انتخاب سال -->
    <select v-model="selectedYear" class="mb-4 p-1 border rounded shadow-sm text-sm">
      <option v-for="y in years" :key="y" :value="y">{{ toFarsiNumber(y) }}</option>
    </select>

    <!-- کارت‌ها -->
    <div class="w-full flex flex-wrap gap-4 mb-4 justify-center">
      <div class="bg-gradient-to-br from-blue-100 to-blue-200 shadow-md rounded-xl p-5 flex flex-col items-center w-44 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
        <div class="text-3xl font-bold text-blue-800 mb-1">{{ totalTasks }}</div>
        <div class="flex items-center gap-1 text-sm text-blue-700 font-semibold">
          <i class="fa fa-tasks"></i> <span>تعداد کل تسک‌ها</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-green-100 to-green-200 shadow-md rounded-xl p-5 flex flex-col items-center w-44 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
        <div class="text-3xl font-bold text-green-800 mb-1">{{ doneTasks }}</div>
        <div class="flex items-center gap-1 text-sm text-green-700 font-semibold">
          <i class="fa fa-check-circle"></i> <span>تسک‌های انجام‌شده</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-md rounded-xl p-5 flex flex-col items-center w-44 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
        <div class="text-3xl font-bold text-yellow-800 mb-1">{{ completionPercent }}%</div>
        <div class="flex items-center gap-1 text-sm text-yellow-700 font-semibold">
          <i class="fa fa-chart-line"></i> <span>درصد تکمیل کل سال</span>
        </div>
      </div>
      <div v-if="busiestDay" class="bg-gradient-to-br from-purple-100 to-purple-200 shadow-md rounded-xl p-5 flex flex-col items-center w-44 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
        <div class="text-2xl font-bold text-purple-800 mb-1">{{ busiestDay }}</div>
        <div class="flex items-center gap-1 text-sm text-purple-700 font-semibold">
          <i class="fa fa-star"></i> <span>روز پرکار</span>
        </div>
      </div>
    </div>

    <!-- نام ماه‌ها -->
    <div class="flex gap-12 mb-2">
      <div></div>
      <div v-for="(month, index) in monthNames" :key="index" class="flex-1 text-center text-xs font-bold text-gray-700">
        <span>{{ month }}</span>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="flex items-start gap-2 w-full overflow-auto py-10 mx-auto">
      <!-- ستون روزهای هفته -->
      <div class="grid grid-rows-7 gap-0.5 ml-6 flex-shrink-0">
        <div v-for="(day, index) in weekDays" :key="index" class="w-6 h-4 flex items-center justify-start text-xs font-bold text-gray-700">
          {{ day }}
        </div>
      </div>

      <!-- گرید روزهای سال -->
      <div class="relative flex items-center pb-15">
        <div class="grid grid-rows-7 gap-0.5 w-max relative">
          <div
            v-for="day in yearDays"
            :key="day.shamsiDate"
            class="w-4 h-4 rounded transition-transform duration-200 relative cursor-pointer"
            :style="{ gridRow: day.rowIndex + 1, gridColumn: day.colIndex + 1, backgroundColor: day.color }"
            @mouseenter="showTooltip($event, day)"
            @mouseleave="hideTooltip"
          ></div>

          <!-- Tooltip JS محور -->
          <div
            v-if="tooltip.visible"
            class="absolute z-50 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg text-xs font-sans pointer-events-none whitespace-nowrap"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            v-html="tooltip.content"
          ></div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
div.w-4:hover {
  transform: scale(1.2);
  z-index: 20;
  cursor: pointer;
}
</style>
