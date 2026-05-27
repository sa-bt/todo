<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import {
  getShamsiMonthInfo,
  getPreviousMonth,
  getNextMonth,
} from '@/utils/jalali'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  CalendarDays,
} from 'lucide-vue-next'
import TaskDayModal from './Month/TaskDayModal.vue'
import TaskStatsCard from '@/components/Days/Card.vue'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const currentDate = ref(new Date())
const showModal = ref(false)
const selectedDay = ref(null)
const isRefreshing = ref(false)

const monthInfo = computed(() => getShamsiMonthInfo(currentDate.value))

const fetchParams = computed(() => ({
  start_date: monthInfo.value.apiStartDate,
  end_date: monthInfo.value.apiEndDate,
}))

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return monthInfo.value.monthName
})

const monthTasks = computed(() => {
  const start = monthInfo.value.apiStartDate
  const end = monthInfo.value.apiEndDate

  return tasksStore.tasks.filter(task => {
    const taskDay = task.day?.slice(0, 10)
    return taskDay && taskDay >= start && taskDay <= end
  })
})

const completedCount = computed(() =>
  monthTasks.value.filter(task => task.is_done).length
)

const remainingCount = computed(() =>
  monthTasks.value.length - completedCount.value
)

const completedPercent = computed(() => {
  if (!monthTasks.value.length) return 0
  return Math.round((completedCount.value / monthTasks.value.length) * 100)
})

async function loadData() {
  isRefreshing.value = true

  try {
    await Promise.all([
      goalsStore.fetchGoals(),
      tasksStore.fetchTasks(fetchParams.value),
    ])
  } finally {
    isRefreshing.value = false
  }
}

function goToPreviousMonth() {
  currentDate.value = getPreviousMonth(currentDate.value)
}

function goToNextMonth() {
  currentDate.value = getNextMonth(currentDate.value)
}

const calendarGrid = computed(() => {
  const { grid, apiStartDate, apiEndDate } = monthInfo.value

  const tasksMap = new Map()

  tasksStore.tasks.forEach(task => {
    const taskDay = task.day?.slice(0, 10)

    if (!taskDay) return
    if (taskDay < apiStartDate || taskDay > apiEndDate) return

    if (!tasksMap.has(taskDay)) {
      tasksMap.set(taskDay, [])
    }

    tasksMap.get(taskDay).push(task)
  })

  return grid.map(week =>
    week.map(day => {
      if (!day) return null

      const tasks = tasksMap.get(day.isoDate) || []

      return {
        ...day,
        tasks,
        hasTasks: tasks.length > 0,
        completedCount: tasks.filter(task => task.is_done).length,
      }
    })
  )
})

function openDayModal(dayData) {
  if (!dayData || !dayData.isCurrentMonth) return

  selectedDay.value = dayData
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedDay.value = null
}

function handleTaskUpdated() {
  // Store خودش آپدیت می‌شود؛ نیازی به fetch دوباره نیست.
}

onMounted(async () => {
  await loadData()
})

watch(currentDate, async () => {
  await loadData()
})
</script>

<template>
  <div class="min-h-screen surface text-[var(--color-text)] px-3 py-4 sm:p-6">
    <div class="max-w-6xl mx-auto space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2">
            <CalendarDays class="w-6 h-6 text-[var(--color-primary)]" />
            تقویم تسک‌ها
          </h2>

          <p class="text-sm text-text-secondary mt-1">
            برای مدیریت تسک‌های هر روز، روی همان روز کلیک کن.
          </p>
        </div>

        <div class="flex items-center justify-between sm:justify-center gap-3 rounded-2xl surface-soft border border-token px-3 py-2 shadow-sm">
          <button
            @click="goToPreviousMonth"
            class="btn-icon w-9 h-9 rounded-full hover:bg-[var(--color-background-soft)] text-[var(--color-primary)] tap-target"
            aria-label="ماه قبل"
          >
            <ChevronRight class="w-5 h-5" />
          </button>

          <h3 class="min-w-32 text-center text-base sm:text-lg font-bold text-[var(--color-heading)]">
            {{ monthInfo.monthName }} {{ monthInfo.year }}
          </h3>

          <button
            @click="goToNextMonth"
            class="btn-icon w-9 h-9 rounded-full hover:bg-[var(--color-background-soft)] text-[var(--color-primary)] tap-target"
            aria-label="ماه بعد"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TaskStatsCard
          title="کل تسک‌ها"
          :value="monthTasks.length"
          icon="ListChecks"
          color="blue"
        />

        <TaskStatsCard
          title="انجام شده"
          :value="completedCount"
          icon="CheckCircle"
          color="green"
          :progress="completedPercent"
        />

        <TaskStatsCard
          title="باقی مانده"
          :value="remainingCount"
          icon="XCircle"
          color="orange"
          :progress="100 - completedPercent"
        />
      </div>

      <div class="rounded-3xl surface-soft border border-token shadow-sm overflow-hidden">
        <div class="grid grid-cols-7 text-center bg-[var(--color-background-soft)]/70 border-b border-token">
          <div
            v-for="dayName in monthInfo.dayNames"
            :key="dayName"
            class="py-2 sm:py-3 font-extrabold text-xs sm:text-sm text-[var(--color-accent)]"
          >
            {{ dayName }}
          </div>
        </div>

        <div class="grid grid-cols-7">
          <template v-for="(week, weekIndex) in calendarGrid" :key="weekIndex">
            <button
              v-for="(dayData, dayIndex) in week"
              :key="dayData ? dayData.isoDate : `${weekIndex}-${dayIndex}`"
              type="button"
              @click="openDayModal(dayData)"
              class="min-h-[58px] sm:min-h-[112px] lg:min-h-[128px] p-1 sm:p-2 text-right border-l border-b border-token transition-all duration-150"
              :class="{
                'cursor-default bg-transparent': !dayData,
                'cursor-pointer hover:bg-[var(--color-background-soft)]': dayData && dayData.isCurrentMonth,
                'opacity-50': dayData && !dayData.isCurrentMonth,
              }"
              :disabled="!dayData || !dayData.isCurrentMonth"
            >
              <div
                v-if="dayData"
                class="h-full rounded-xl sm:rounded-2xl p-1.5 sm:p-3 flex flex-col justify-between transition-all duration-150"
                :class="{
                  'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25':
                    dayData.isToday && dayData.isCurrentMonth,
                  'surface hover:shadow-md':
                    dayData.isCurrentMonth && !dayData.isToday,
                }"
              >
                <div class="flex items-start justify-between gap-1">
                  <span
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-black"
                    :class="{
                      'bg-white/25 text-white': dayData.isToday,
                      'bg-[var(--color-background-soft)] text-[var(--color-heading)]': !dayData.isToday,
                    }"
                  >
                    {{ dayData.dayOfMonth }}
                  </span>

                  <span
                    v-if="dayData.hasTasks"
                    class="hidden sm:inline-flex text-[10px] sm:text-xs px-2 py-1 rounded-full"
                    :class="{
                      'bg-white/20 text-white': dayData.isToday,
                      'bg-[var(--color-background-soft)] text-text-secondary': !dayData.isToday,
                    }"
                  >
                    {{ dayData.tasks.length }} تسک
                  </span>
                </div>

                <div class="flex items-center justify-end gap-1 mt-1 sm:hidden">
                  <span
                    v-if="dayData.hasTasks"
                    class="w-1.5 h-1.5 rounded-full"
                    :class="dayData.completedCount === dayData.tasks.length ? 'bg-green-500' : 'bg-orange-500'"
                  ></span>

                  <span
                    v-if="dayData.tasks.length > 1"
                    class="text-[10px] font-bold"
                    :class="{ 'text-white': dayData.isToday, 'text-text-secondary': !dayData.isToday }"
                  >
                    {{ dayData.tasks.length }}
                  </span>
                </div>

                <div class="hidden sm:flex mt-3 flex-col items-end gap-2">
                  <div
                    v-if="dayData.hasTasks"
                    class="flex items-center gap-1.5 rounded-full px-2 py-1"
                    :class="{
                      'bg-white/20': dayData.isToday,
                      'bg-[var(--color-background-soft)]': !dayData.isToday,
                    }"
                  >
                    <CheckCircle
                      v-if="dayData.completedCount === dayData.tasks.length"
                      class="w-4 h-4"
                      :class="{
                        'text-white': dayData.isToday,
                        'text-green-500': !dayData.isToday,
                      }"
                    />

                    <Clock
                      v-else
                      class="w-4 h-4"
                      :class="{
                        'text-white': dayData.isToday,
                        'text-[var(--color-accent)]': !dayData.isToday,
                      }"
                    />

                    <span
                      class="font-bold text-xs sm:text-sm"
                      :class="{
                        'text-white': dayData.isToday,
                        'text-[var(--color-heading)]': !dayData.isToday,
                      }"
                    >
                      {{ dayData.completedCount }}/{{ dayData.tasks.length }}
                    </span>
                  </div>

                  <span
                    v-else-if="dayData.isCurrentMonth && !dayData.isToday"
                    class="text-[10px] sm:text-xs text-text-secondary opacity-60"
                  >
                    خالی
                  </span>
                </div>
              </div>
            </button>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <TaskDayModal
        v-if="showModal && selectedDay"
        :dayData="selectedDay"
        :dayLabel="selectedDayLabel"
        @close="closeModal"
        @task-updated="handleTaskUpdated"
      />
    </Teleport>

    <div
      v-if="tasksStore.loading || goalsStore.loading || isRefreshing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <div class="surface-soft border border-token rounded-2xl px-6 py-5 shadow-xl flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-[var(--color-primary)] border-dashed rounded-full animate-spin"></div>
        <p class="text-sm text-text-secondary">در حال بارگذاری...</p>
      </div>
    </div>
  </div>
</template>