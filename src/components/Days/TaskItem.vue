<script setup>
import { computed } from 'vue'
import { Check, Trash2, Loader2, Calendar, ChevronLeft } from 'lucide-vue-next'
import { useGoalsStore } from '@/stores/goals'

const props = defineProps({
  task: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'remove'])

const goalsStore = useGoalsStore()

const title = computed(() => {
  const goal = goalsStore.goals.find(g => g.id === props.task.goal_id)
  return goal ? goal.title : 'بدون هدف'
})

function handleToggle() {
  // وقتی هر تسکی در حال آپدیت است، هیچ کلیکی ثبت نشود
  if (props.disabled || props.loading) return

  emit('toggle', props.task)
}

function handleRemove() {
  // در زمان آپدیت تسک‌ها، حذف هم غیرفعال باشد
  if (props.disabled || props.loading) return

  emit('remove', props.task.id)
}
</script>

<template>
  <Transition name="fade-scale" appear>
    <li
      @click="handleToggle"
      class="goal-item h-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-token
             surface transition-all duration-300 select-none group relative"
      :class="{
          'cursor-pointer': !disabled && !loading,
          'cursor-not-allowed opacity-60': disabled && !loading,
          'cursor-wait opacity-80': loading,

          'hover:shadow-lg hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50':
            !task.is_done && !disabled && !loading,

          'opacity-70 scale-[0.99]': task.is_done && !loading,
        }"
      :aria-disabled="disabled || loading"
    >
      <!-- دایره وضعیت / لودر -->
      <div
        class="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0"
        :style="{
            backgroundColor: task.is_done && !loading ? 'var(--color-primary)' : 'transparent',
            border: `2px solid ${
              task.is_done && !loading
                ? 'var(--color-primary)'
                : 'var(--color-border-hover)'
            }`,
            boxShadow: task.is_done && !loading
              ? '0 0 0 3px color-mix(in oklab,var(--color-primary) 25%,white)'
              : 'none'
          }"
      >
        <Loader2
          v-if="loading"
          class="w-3.5 h-3.5 animate-spin"
          :style="{ color: 'var(--color-primary)' }"
        />

        <Check
          v-else-if="task.is_done"
          class="w-3.5 h-3.5 text-white transition-opacity duration-300"
        />
      </div>

      <!-- عنوان و تاریخ -->
      <div class="flex flex-col flex-1 overflow-hidden text-right">
        <span
          class="font-semibold text-base truncate transition-all duration-300"
          :class="task.is_done ? 'line-through' : ''"
          :style="{ color: task.is_done ? 'var(--color-text-secondary)' : 'var(--color-heading)' }"
        >
          {{ title }}
        </span>

        <span
          class="text-xs px-2 py-0.5 rounded-md font-medium mt-1 inline-block"
          :style="{
              background: 'color-mix(in oklab,var(--color-background-soft) 90%,white)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }"
        >
          <Calendar class="inline-block w-3 h-3 -mt-0.5 ml-1" aria-hidden="true" />{{ props.task.day }}
        </span>
      </div>

      <!-- بخش چپ: دکمه حذف و فلش -->
      <div class="flex items-center gap-1 flex-shrink-0">

        <!-- دکمه حذف -->
        <button
          @click.stop="handleRemove"
          :disabled="disabled || loading"
          type="button"
          class="tap-target p-2 rounded-full text-[var(--color-text-secondary)]
                   hover:text-[var(--color-danger)]
                   opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200
                   disabled:cursor-not-allowed disabled:opacity-30"
          title="حذف کار"
          aria-label="حذف کار"
        >
          <Trash2 class="w-4 h-4" />
        </button>

        <!-- فلش -->
        <div
          class="text-text-secondary p-1 transition-colors duration-200"
          :class="{
              'hover:text-[var(--color-heading)]': !disabled && !loading,
              'opacity-40': disabled || loading
            }"
        >
          <ChevronLeft class="w-5 h-5" aria-hidden="true" />
        </div>

      </div>
    </li>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active {
  transition: all 0.25s ease-out;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>