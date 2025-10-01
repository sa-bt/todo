<script setup>
import { getTodayShamsi } from '@/utils/jalali'
import { CirclePlus, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  weekDays: { type: Array, required: true },
  tasksRows: { type: Array, required: true }
})

const emit = defineEmits(['toggle-task'])
const todayShamsi = getTodayShamsi()

function toggleTask(taskRow, day) {
  emit('toggle-task', { taskRow, day })
}
</script>

<template>
  <div class="overflow-x-auto snap-x snap-mandatory overscroll-x-contain py-5"
       style="-webkit-overflow-scrolling:touch;scrollbar-gutter:stable both-edges;">
    <!-- Legend -->
    <div class="hidden sm:flex flex-wrap items-center gap-3 mb-3 text-sm">
      <span class="inline-flex items-center gap-2 px-2 py-1 rounded border border-[var(--color-border)] bg-yellow-50 text-[var(--color-text-secondary)]">
        <span class="w-3 h-3 rounded bg-yellow-300/60"></span>
        ثبت‌شده (انجام‌نشده)
      </span>
      <span class="inline-flex items-center gap-2 px-2 py-1 rounded border border-dashed border-[var(--color-border)]">
        <span class="w-3 h-3 rounded border border-dashed border-[var(--color-border)]"></span>
        تعریف‌نشده
      </span>
      <span class="inline-flex items-center gap-2 px-2 py-1 rounded border border-[var(--color-border)] bg-green-50 text-[var(--color-text-secondary)]">
        <span class="w-3 h-3 rounded bg-green-400"></span>
        انجام‌شده
      </span>
    </div>

    <div
        class="grid grid-cols-[200px_repeat(7,1fr)] gap-x-2 gap-y-1 text-[var(--color-text)]"
        role="grid"
        aria-label="جدول تسک‌های هفتگی"
    >
      <!-- هدر ستون عنوان -->
      <div
          class="font-bold text-right p-2 rounded-lg bg-[var(--color-background-soft)] border border-[var(--color-border)]
               sticky top-0 z-20 shadow-sm backdrop-blur snap-start"
          role="columnheader"
      >
        تسک‌ها
      </div>

      <!-- هدر روزها -->
      <div
          v-for="day in weekDays"
          :key="day.date"
          class="text-center font-bold rounded-lg p-2 border bg-[var(--color-background-soft)] border-[var(--color-border)]
               sticky top-0 z-20 shadow-sm backdrop-blur snap-start"
          :class="day.date === todayShamsi
          ? 'border-x-2 border-[var(--color-accent)] text-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/10'
          : ''"
          role="columnheader"
      >
        {{ day.label }}
        <div class="text-xs text-[var(--color-text-secondary)]">{{ day.date }}</div>
        <div v-if="day.date === todayShamsi" class="mt-1 text-[10px] font-normal text-[var(--color-accent)]">امروز</div>
      </div>

      <!-- ردیف‌ها -->
      <template v-for="task in tasksRows" :key="task.goal_id">
        <!-- ستون عنوان هدف -->
        <div
            class="p-2 text-right font-medium rounded-md bg-[var(--color-background-soft)] border border-[var(--color-border)]
                 sticky right-0 z-10 shadow-sm relative snap-start
                 after:absolute after:inset-y-0 after:-left-2 after:w-2 after:bg-gradient-to-l after:from-[var(--color-background)]/70 after:to-transparent"
            role="rowheader"
            :title="task.goal_title"
        >
          {{ task.goal_title }}
        </div>

        <!-- سلول‌های روز -->
        <div
            v-for="day in weekDays"
            :key="day.date"
            class="group relative rounded-xl border transition hover:shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-accent)] snap-start"
            role="gridcell"
            :aria-label="`${task.goal_title} — ${day.label}`"
            :class="[
            day.date === todayShamsi
              ? 'border-x-2 border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/10'
              : '',
            task.weekTasks[day.date]?.is_done
              ? 'bg-green-50 border-green-200'
              : (task.weekTasks[day.date]
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-dashed border-[var(--color-border)]')
          ]"
        >
          <button
              type="button"
              class="w-full h-full min-h-10 flex items-center justify-center tap-target outline-none py-1.5 sm:py-2"
              :aria-label="`تغییر وضعیت ${task.goal_title} در ${day.label}`"
              :aria-pressed="task.weekTasks[day.date]?.is_done ? 'true' : 'false'"
              @click="toggleTask(task, day.date)"
              @keydown.enter.prevent="toggleTask(task, day.date)"
              @keydown.space.prevent="toggleTask(task, day.date)"
          >
            <CheckCircle
                v-if="task.weekTasks[day.date]?.is_done"
                class="w-5 h-5 sm:w-6 sm:h-6 task-bounce text-green-600"
            />
            <XCircle
                v-else-if="task.weekTasks[day.date]"
                class="w-5 h-5 sm:w-6 sm:h-6 task-bounce text-red-500"
            />
            <CirclePlus
                v-else
                class="w-5 h-5 sm:w-6 sm:h-6 task-bounce text-indigo-400 opacity-90 group-hover:opacity-100"
            />
          </button>

          <!-- Tooltip سفارشی -->
          <span
              class="pointer-events-none whitespace-nowrap px-2 py-1 text-xs rounded-md
                   bg-[var(--color-heading)] text-white/95 shadow-sm
                   absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                   transition-opacity duration-150 z-30"
          >
            {{
              task.weekTasks[day.date]?.is_done
                  ? 'انجام‌شده'
                  : (task.weekTasks[day.date] ? 'ثبت‌شده (انجام‌نشده)' : 'افزودن تسک')
            }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounceScale {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
.task-bounce {
  animation: bounceScale 0.2s ease-out;
}
</style>
