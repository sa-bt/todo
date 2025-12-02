<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getTodayShamsi } from '@/utils/jalali'
import { Check, Circle, Plus, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { toPersianNumber } from '@/utils/number' 

const props = defineProps({
  weekDays: { type: Array, required: true },
  tasksRows: { type: Array, required: true }
})

const emit = defineEmits(['toggle-task'])

const todayShamsi = getTodayShamsi()
const expandedDays = ref({}) 

// باز کردن امروز به صورت پیش‌فرض و اسکرول به آن
onMounted(() => {
    expandedDays.value[todayShamsi] = true;
    
    nextTick(() => {
        const todayElement = document.querySelector(`.day-card-${todayShamsi}`)
        if (todayElement) {
            // اسکرول نرم به بالای کارت روز جاری
            todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    })
})

function toggleTask(taskRow, day) {
  emit('toggle-task', { taskRow, day })
}

// تابع کمکی برای محاسبه درصد
function calculatePercentage(completed, total) {
    if (total === 0) return 0; // اگر تسکی تعریف نشده باشد، 0٪
    return Math.round((completed / total) * 100);
}

// تعداد کل تسک‌های تعریف شده برای یک روز
function getDayTaskCount(dayDate) {
    return props.tasksRows.filter(row => row.weekTasks[dayDate]).length;
}

// تعداد تسک‌های تکمیل شده برای یک روز
function getDayCompletedCount(dayDate) {
    return props.tasksRows.filter(row => row.weekTasks[dayDate]?.is_done).length;
}

// محاسبه Progress برای روز (استفاده در Progress Bar روزانه)
function getDayProgress(dayDate) {
    const completed = getDayCompletedCount(dayDate);
    const total = getDayTaskCount(dayDate);
    return calculatePercentage(completed, total);
}

function getCardClasses(task) {
  const baseClasses = 'shadow-sm hover:shadow-md transition-all duration-300'
  
  if (!task) {
    return `${baseClasses} bg-surface-soft border border-dashed border-token/60 hover:bg-surface-accent/10`
  }
  
  if (task.is_done) {
    return `${baseClasses} bg-green-50 dark:bg-green-800/40 border border-green-200/50 hover:border-green-400/50`
  } else {
    return `${baseClasses} bg-yellow-50 dark:bg-yellow-800/40 border border-yellow-200/50 hover:border-yellow-400/50`
  }
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
    
    <div class="hidden sm:block">
        <div class="min-w-full flex flex-col divide-y divide-token">
            
            <div class="grid grid-cols-[250px_repeat(7,1fr)] bg-surface-soft sticky top-0 z-20 shadow-lg px-2 pt-4 pb-2">
                <div class="text-right text-sm font-bold text-[var(--color-heading)] px-3 py-1">اهداف هفته</div>
                
                <div
                v-for="day in weekDays"
                :key="day.date"
                class="text-center text-xs font-bold text-[var(--color-text-secondary)] tracking-wider px-1"
                :class="{ 'text-[var(--color-accent)]': day.date === todayShamsi }"
                >
                <span class="text-lg">{{ day.label }}</span>
                <div class="text-[10px] font-normal opacity-70 mb-2">{{ day.date.slice(5) }}</div>
                
                <div class="mt-1 w-full flex items-center gap-1.5 px-1">
                    <div class="w-full bg-surface-soft rounded-full h-2">
                        <div
                            class="h-2 rounded-full transition-all duration-500"
                            :style="{ width: getDayProgress(day.date) + '%' }"
                            :class="getDayProgress(day.date) === 100 ? 'bg-green-500 shadow-green-400/50 shadow-md' : 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/50 shadow-md'"
                        ></div>
                    </div>
                    <span class="text-[10px] text-[var(--color-text-secondary)] font-mono flex-shrink-0">{{ toPersianNumber(getDayProgress(day.date)) }}٪</span>
                </div>
                </div>
            </div>

            <div 
                v-for="row in tasksRows" 
                :key="row.goal_id" 
                class="py-4 border-b border-token/50"
            >
                <div class="grid grid-cols-[250px_repeat(7,1fr)] gap-3 items-start">
                    
                    <div class="px-3 text-sm font-medium text-[var(--color-heading)] sticky left-0 z-10 bg-surface flex items-center h-full">
                        <span class="truncate">{{ row.goal_title }}</span>
                    </div>

                    <div
                        v-for="day in weekDays"
                        :key="day.date"
                        class="rounded-xl relative flex items-center justify-center p-1.5 sm:p-2 cursor-pointer tap-target"
                        :class="[
                            getCardClasses(row.weekTasks[day.date]),
                            { 'ring-2 ring-[var(--color-accent)]/50': day.date === todayShamsi } 
                        ]"
                        @click="toggleTask(row, day.date)"
                        role="button"
                        tabindex="0"
                    >
                        <component 
                            :is="TaskIcon(row.weekTasks[day.date])" 
                            :class="[
                                'w-6 h-6 task-bounce',
                                row.weekTasks[day.date] && row.weekTasks[day.date].is_done 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : (row.weekTasks[day.date]
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-[var(--color-text-secondary)] opacity-60')
                            ]"
                            aria-hidden="true"
                        />
                    </div>

                </div>
            </div>
        </div>
    </div>

    <div class="sm:hidden mt-2 divide-y divide-token/50">
        
        <div 
            v-for="day in weekDays" 
            :key="day.date" 
            class="surface rounded-lg shadow-md mb-3 overflow-hidden border border-token"
            :class="`day-card-${day.date}`"
        >
            <button 
                @click="toggleDayExpansion(day.date)"
                class="w-full p-3 flex justify-between items-center text-right tap-target"
                :class="{ 
                    'bg-[var(--color-accent)]/10 text-[var(--color-accent)]': day.date === todayShamsi 
                }"
            >
                <div class="flex flex-col items-start w-full">
                    <span class="font-bold text-xl" 
                        :class="day.date === todayShamsi ? 'text-[var(--color-accent)]' : 'text-[var(--color-heading)]'"
                    >
                        {{ day.label }}
                        <span class="text-sm font-normal opacity-70 mr-2">{{ day.date.slice(5) }}</span>
                    </span>
                    
                    <div class="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                        {{ toPersianNumber(getDayCompletedCount(day.date)) }} از {{ toPersianNumber(getDayTaskCount(day.date)) }} تسک انجام شد
                    </div>

                    <div class="mt-2 w-full flex items-center gap-1.5 pr-2">
                        <div class="w-full bg-surface-soft rounded-full h-2">
                            <div
                                class="h-2 rounded-full transition-all duration-500"
                                :style="{ width: getDayProgress(day.date) + '%' }"
                                :class="getDayProgress(day.date) === 100 ? 'bg-green-500 shadow-green-400/50 shadow-md' : 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/50 shadow-md'"
                            ></div>
                        </div>
                        <span class="text-xs text-[var(--color-text-secondary)] font-mono flex-shrink-0">{{ toPersianNumber(getDayProgress(day.date)) }}٪</span>
                    </div>
                </div>
                
                <component 
                    :is="expandedDays[day.date] ? ChevronUp : ChevronDown" 
                    class="w-6 h-6 flex-shrink-0" 
                    :class="day.date === todayShamsi ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'"
                />
            </button>
            
            <Transition name="fade-slide">
                <div v-if="expandedDays[day.date]" class="p-3 border-t border-token/50 bg-surface-soft">
                    <div 
                        v-for="row in tasksRows"
                        :key="row.goal_id"
                        class="flex items-center justify-between py-3 border-b border-token/30 last:border-b-0 tap-target"
                        @click="toggleTask(row, day.date)"
                    >
                        <div class="flex flex-col items-start w-full">
                            <span class="text-sm font-medium text-[var(--color-heading)]">
                                {{ row.goal_title }}
                            </span>
                            <span v-if="row.weekTasks[day.date]" class="text-[10px] text-[var(--color-text-secondary)] mt-1">
                                وضعیت: {{ row.weekTasks[day.date]?.is_done ? 'انجام شد' : 'منتظر' }}
                            </span>
                        </div>
                        
                        <component 
                            :is="TaskIcon(row.weekTasks[day.date])" 
                            class="w-6 h-6 flex-shrink-0"
                            :class="[
                                row.weekTasks[day.date] && row.weekTasks[day.date].is_done 
                                    ? 'text-green-600' 
                                    : (row.weekTasks[day.date]
                                        ? 'text-yellow-600'
                                        : 'text-indigo-400 opacity-60') 
                            ]"
                        />
                    </div>
                </div>
            </Transition>
        </div>
    </div>

  </div>
</template>

<style scoped>
/* انیمیشن پالس برای بازخورد بصری بهتر */
@keyframes bounceScale {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
.task-bounce {
  animation: bounceScale 0.2s ease-out;
}

/* استایل‌های انیمیشن Collapsible در موبایل */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 500px; 
  opacity: 1;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* استایل Sticky برای دسکتاپ */
.sticky.left-0 {
    background-color: var(--color-background); 
    box-shadow: 2px 0 5px -2px var(--color-shadow);
}
</style>