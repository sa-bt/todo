<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import {
  getShamsiMonthInfo,
  getPreviousMonth,
  getNextMonth,
} from '@/utils/jalali'
import { ChevronLeft, ChevronRight, ListChecks, CheckCircle, Clock } from 'lucide-vue-next'
import TaskDayModal from './Month/TaskDayModal.vue'

// Stores
const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

// State
const currentDate = ref(new Date())
const showModal = ref(false)
const selectedDay = ref(null)

// Computed: اطلاعات ماه جاری
const monthInfo = computed(() => getShamsiMonthInfo(currentDate.value))

// Computed: پارامترهای API (داینامیک)
const fetchParams = computed(() => ({
  start_date: monthInfo.value.startDate,
  end_date: monthInfo.value.endDate,
}))

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return '';
  const [, month] = selectedDay.value.isoDate.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  const SHAMSI_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return SHAMSI_MONTH_NAMES[monthIndex];
});

async function loadData() {
  await goalsStore.fetchGoals();
  await tasksStore.fetchTasks(fetchParams.value);
}

function goToPreviousMonth() {
  currentDate.value = getPreviousMonth(currentDate.value)
}

function goToNextMonth() {
  currentDate.value = getNextMonth(currentDate.value)
}

const calendarGrid = computed(() => {
  const { grid, startDate, endDate } = monthInfo.value

  const tasksMap = new Map()
  tasksStore.tasks.forEach(task => {
    if (!tasksMap.has(task.day)) {
      tasksMap.set(task.day, [])
    }
    if (task.day >= startDate && task.day <= endDate) {
      tasksMap.get(task.day).push(task)
    }
  })

  return grid.map(week =>
      week.map(day => {
        if (!day) return null

        const tasks = tasksMap.get(day.isoDate) || []

        return {
          ...day,
          tasks: tasks,
          hasTasks: tasks.length > 0,
          completedCount: tasks.filter(t => t.is_done).length
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
  showModal.value = false;
  selectedDay.value = null;
  loadData();
}

onMounted(() => {
  loadData()
})

watch(currentDate, () => {
  loadData()
})
</script>

<template>
  <div class="p-6 min-h-screen surface text-[var(--color-text)]">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-extrabold text-[var(--color-heading)] flex items-center gap-2">
        <ListChecks class="w-5 h-5 text-[var(--color-primary)]"/>
        تقویم تسک‌ها
      </h2>
    </div>

    <div class="flex justify-between items-center mb-6 max-w-sm mx-auto p-2">
      <button @click="goToPreviousMonth" class="btn-icon p-1 rounded-full hover:bg-[var(--color-background-soft)] text-[var(--color-primary)] tap-target" aria-label="ماه قبل">
        <ChevronRight class="w-4 h-4" />
      </button>

      <h3 class="text-lg font-bold text-[var(--color-heading)] transition-colors duration-300">
        {{ monthInfo.monthName }} {{ monthInfo.year }}
      </h3>

      <button @click="goToNextMonth" class="btn-icon p-1 rounded-full hover:bg-[var(--color-background-soft)] text-[var(--color-primary)] tap-target" aria-label="ماه بعد">
        <ChevronLeft class="w-4 h-4" />
      </button>
    </div>
    <div class="grid grid-cols-7 text-center">
      <div v-for="dayName in monthInfo.dayNames" :key="dayName" class="py-2 font-extrabold text-sm text-[var(--color-accent)] mb-1">
        {{ dayName }}
      </div>

      <template v-for="(week, index) in calendarGrid" :key="index">
        <div
            v-for="(dayData, dayIndex) in week"
            :key="dayIndex"
            @click="openDayModal(dayData)"
            class="min-h-20 relative p-1 transition-all duration-150 group"
            :class="{
            'cursor-default': !dayData,
            'cursor-pointer': dayData && dayData.isCurrentMonth,
            'text-[var(--color-text-secondary)] opacity-60': dayData && !dayData.isCurrentMonth,
          }"
        >
          <div v-if="dayData" class="flex flex-col h-full rounded-lg transition-all duration-150 p-1.5"
               :class="{
              'bg-[var(--color-primary)] text-white shadow-xl shadow-[var(--color-primary)]/20 z-10': dayData.isToday && dayData.isCurrentMonth,
              'bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)]': dayData.isCurrentMonth && !dayData.isToday,
            }"
          >
            <div
                class="text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ml-auto"
                :class="{
                'text-[var(--color-text)] bg-transparent': !dayData.isToday,
                'bg-white/30 text-white': dayData.isToday
              }"
            >
              {{ dayData.dayOfMonth }}
            </div>

            <div class="flex-1 text-xs mt-1 flex flex-col justify-end items-end">
              <div v-if="dayData.hasTasks" class="flex items-center gap-1">
                <CheckCircle
                    v-if="dayData.completedCount === dayData.tasks.length"
                    class="w-4 h-4 text-green-500"
                    :class="{ 'text-white': dayData.isToday }"
                />
                <Clock
                    v-else
                    class="w-4 h-4 text-[var(--color-primary)]"
                    :class="{ 'text-white': dayData.isToday, 'text-[var(--color-accent)]': !dayData.isToday }"
                />

                <span class="font-semibold text-xs" :class="{ 'text-white': dayData.isToday, 'text-[var(--color-text)]': !dayData.isToday }">
                    {{ dayData.completedCount }}/{{ dayData.tasks.length }}
                </span>
              </div>
              <span v-else-if="dayData.isCurrentMonth && !dayData.isToday" class="text-[var(--color-text-secondary)] opacity-50 text-xs mt-2">
                خالی
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <TaskDayModal
          v-if="showModal && selectedDay"
          :dayData="selectedDay"
          :dayLabel="selectedDayLabel"
          @close="closeModal"
      />
    </Teleport>

    <div v-if="tasksStore.loading || goalsStore.loading" class="fixed inset-0 z-50 flex items-center justify-center surface-soft/90">
      <div class="w-16 h-16 border-4 border-[var(--color-primary)] border-dashed rounded-full animate-spin"></div>
    </div>
  </div>
</template>
