<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getTodayShamsi } from '@/utils/jalali'
import { Check, Circle, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-vue-next' // ✅ اضافه کردن Trash2
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  weekDays: { type: Array, required: true },
  tasksRows: { type: Array, required: true }
})

// ✅ اضافه کردن ایونت‌های جدید
const emit = defineEmits(['toggle-task', 'delete-daily-task', 'delete-weekly-tasks'])

const todayShamsi = getTodayShamsi()
const expandedDays = ref({})

onMounted(() => {
  if (getDayTaskCount(todayShamsi) > 0) {
    expandedDays.value[todayShamsi] = true;
  }
  nextTick(() => {
    const todayElement = document.querySelector(`.day-card-${todayShamsi}`)
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

function toggleTask(taskRow, day) {
  emit('toggle-task', { taskRow, day })
}

function calculatePercentage(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function getDayTaskCount(dayDate) {
  return props.tasksRows.filter(row => row && row.weekTasks?.[dayDate]).length;
}

function getDayCompletedCount(dayDate) {
  return props.tasksRows.filter(row => row && row.weekTasks?.[dayDate]?.is_done).length;
}

function getDayProgress(dayDate) {
  const completed = getDayCompletedCount(dayDate);
  const total = getDayTaskCount(dayDate);
  return calculatePercentage(completed, total);
}

function getRowsForDay(dayDate) {
  if (!props.tasksRows || props.tasksRows.length === 0) return [];
  return props.tasksRows.filter(row => row && row.weekTasks?.[dayDate]);
}

function getCardClasses(task) {
  const baseClasses = 'shadow-sm hover:shadow-md transition-all duration-300 relative group' // ✅ اضافه کردن group و relative

  if (!task) return `${baseClasses} bg-surface-soft border border-dashed border-token/60 hover:bg-surface-accent/10`
  if (task.is_done) return `${baseClasses} bg-green-50 dark:bg-green-800/40 border border-green-200/50 hover:border-green-400/50`
  return `${baseClasses} bg-yellow-50 dark:bg-yellow-800/40 border border-yellow-200/50 hover:border-yellow-400/50`
}

const TaskIcon = (task) => {
  if (!task) return Plus
  return task.is_done ? Check : Circle
}

function toggleDayExpansion(dayDate) {
  expandedDays.value[dayDate] = !expandedDays.value[dayDate]
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl">

    <!-- نمای دسکتاپ -->
    <div class="hidden sm:block">
      <div class="min-w-full flex flex-col divide-y divide-token">

        <div class="grid grid-cols-[250px_repeat(7,1fr)] bg-surface-soft sticky top-0 z-20 shadow-lg px-2 pt-4 pb-2">
          <div class="text-right text-sm font-bold text-[var(--color-heading)] px-3 py-1">اهداف هفته</div>

          <div v-for="day in weekDays" :key="day.date" class="text-center text-xs font-bold text-[var(--color-text-secondary)] tracking-wider px-1" :class="{ 'text-[var(--color-accent)]': day.date === todayShamsi }">
            <span class="text-lg">{{ day.label }}</span>
            <div class="text-[10px] font-normal opacity-70 mb-2">{{ day.date.slice(5) }}</div>
            <div class="mt-1 w-full flex items-center gap-1.5 px-1">
              <div class="w-full bg-surface-soft rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500" :style="{ width: getDayProgress(day.date) + '%' }" :class="getDayProgress(day.date) === 100 ? 'bg-green-500 shadow-green-400/50 shadow-md' : 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/50 shadow-md'"></div>
              </div>
              <span class="text-[10px] text-[var(--color-text-secondary)] font-mono flex-shrink-0">{{ toPersianNumber(getDayProgress(day.date)) }}٪</span>
            </div>
          </div>
        </div>

        <div v-for="(row, index) in tasksRows" :key="row?.goal_id || index" class="py-4 border-b border-token/50">
          <div class="grid grid-cols-[250px_repeat(7,1fr)] gap-3 items-start">

            <!-- ✅ سلول عنوان هدف با دکمه حذف هفتگی -->
            <div class="px-3 text-sm font-medium text-[var(--color-heading)] sticky left-0 z-10 bg-surface flex items-center justify-between h-full group/title">
              <span class="truncate">{{ row.goal_title }}</span>
              <button
                  @click.stop="emit('delete-weekly-tasks', row)"
                  class="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover/title:opacity-100 transition-all"
                  title="حذف تمام تسک‌های این هدف در هفته"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <!-- سلول‌های روزانه -->
            <div
                v-for="day in weekDays"
                :key="day.date"
                class="rounded-xl relative flex items-center justify-center p-1.5 sm:p-2 cursor-pointer tap-target"
                :class="[
                            getCardClasses(row.weekTasks?.[day.date]),
                            { 'ring-2 ring-[var(--color-accent)]/50': day.date === todayShamsi }
                        ]"
                @click="toggleTask(row, day.date)"
                role="button"
                tabindex="0"
            >
              <component
                  :is="TaskIcon(row.weekTasks?.[day.date])"
                  :class="[
                                'w-6 h-6 task-bounce',
                                row.weekTasks?.[day.date]?.is_done
                                    ? 'text-green-600 dark:text-green-400'
                                    : (row.weekTasks?.[day.date]
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-[var(--color-text-secondary)] opacity-60')
                            ]"
                  aria-hidden="true"
              ></component>

              <!-- ✅ دکمه حذف روزانه (ظاهر شونده با هاور) -->
              <button
                  v-if="row.weekTasks?.[day.date]"
                  @click.stop="emit('delete-daily-task', row.weekTasks[day.date].id)"
                  class="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="حذف این تسک"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- نمای موبایل -->
    <div class="sm:hidden mt-2 divide-y divide-token/50">

      <div v-for="day in weekDays" :key="day.date" class="surface rounded-lg shadow-md mb-3 overflow-hidden border border-token" :class="`day-card-${day.date}`">
        <button @click="toggleDayExpansion(day.date)" class="w-full p-3 flex justify-between items-center text-right tap-target" :class="{ 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]': day.date === todayShamsi }">
          <div class="flex flex-col items-start w-full">
                    <span class="font-bold text-xl" :class="day.date === todayShamsi ? 'text-[var(--color-accent)]' : 'text-[var(--color-heading)]'">
                        {{ day.label }}
                        <span class="text-sm font-normal opacity-70 mr-2">{{ day.date.slice(5) }}</span>
                    </span>
            <div class="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              {{ toPersianNumber(getDayCompletedCount(day.date)) }} از {{ toPersianNumber(getDayTaskCount(day.date)) }} تسک انجام شد
            </div>
            <div class="mt-2 w-full flex items-center gap-1.5 pr-2">
              <div class="w-full bg-surface-soft rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500" :style="{ width: getDayProgress(day.date) + '%' }" :class="getDayProgress(day.date) === 100 ? 'bg-green-500 shadow-green-400/50 shadow-md' : 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/50 shadow-md'"></div>
              </div>
              <span class="text-xs text-[var(--color-text-secondary)] font-mono flex-shrink-0">{{ toPersianNumber(getDayProgress(day.date)) }}٪</span>
            </div>
          </div>
          <component :is="expandedDays[day.date] ? ChevronUp : ChevronDown" class="w-6 h-6 flex-shrink-0" :class="day.date === todayShamsi ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'"></component>
        </button>

        <Transition name="fade-slide">
          <div v-if="expandedDays[day.date]" class="p-3 border-t border-token/50 bg-surface-soft">
            <div v-for="row in getRowsForDay(day.date)" :key="row.goal_id" class="flex items-center justify-between py-3 border-b border-token/30 last:border-b-0 tap-target" @click="toggleTask(row, day.date)">
              <div class="flex flex-col items-start w-full">
                <span class="text-sm font-medium text-[var(--color-heading)]">{{ row.goal_title }}</span>
                <span v-if="row.weekTasks?.[day.date]" class="text-[10px] text-[var(--color-text-secondary)] mt-1">وضعیت: {{ row.weekTasks?.[day.date]?.is_done ? 'انجام شد' : 'منتظر' }}</span>
              </div>

              <div class="flex items-center gap-2">
                <!-- ✅ دکمه حذف در موبایل -->
                <button
                    v-if="row.weekTasks?.[day.date]"
                    @click.stop="emit('delete-daily-task', row.weekTasks[day.date].id)"
                    class="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>

                <component :is="TaskIcon(row.weekTasks?.[day.date])" class="w-6 h-6 flex-shrink-0" :class="[ row.weekTasks?.[day.date]?.is_done ? 'text-green-600' : (row.weekTasks?.[day.date] ? 'text-yellow-600' : 'text-indigo-400 opacity-60') ]"></component>
              </div>
            </div>

            <div v-if="getDayTaskCount(day.date) === 0" class="text-center py-2 text-sm text-text-secondary">
              هیچ تسکی برای این روز تعریف نشده است.
            </div>
          </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* انیمیشن و استایل‌های قبلی */
@keyframes bounceScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
.task-bounce { animation: bounceScale 0.2s ease-out; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease-in-out; max-height: 500px; opacity: 1; }
.fade-slide-enter-from, .fade-slide-leave-to { max-height: 0; opacity: 0; padding-top: 0 !important; padding-bottom: 0 !important; }
.sticky.left-0 { background-color: var(--color-background); box-shadow: 2px 0 5px -2px var(--color-shadow); }
</style>
