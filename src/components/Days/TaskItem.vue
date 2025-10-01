<script setup>
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { useGoalsStore } from '@/stores/goals'

const props = defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['toggle'])
const goalsStore = useGoalsStore()

const title = computed(() => {
  const goal = goalsStore.goals.find(g => g.id === props.task.goal_id)
  return goal ? goal.title : 'بدون هدف'
})
</script>

<template>
  <Transition name="fade-scale" appear>
    <li
        @click="emit('toggle', task)"
        class="flex items-center justify-between p-4 rounded-xl shadow-md border-token surface transition-all duration-300 cursor-pointer"
        :class="{
        'hover:shadow-lg hover:-translate-y-0.5': !task.is_done, // افکت هاور برای کارهای ناتمام
        'opacity-70': task.is_done // کمرنگ‌تر شدن برای کارهای انجام شده
      }"
    >
      <div
          class="w-5 h-5 ml-4 flex items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0"
          :style="{
          // استفاده از bg-primary و border-primary برای هماهنگی با تم
          backgroundColor: task.is_done ? 'var(--color-primary)' : 'var(--color-background-mute)',
          border: `2px solid ${task.is_done ? 'var(--color-primary)' : 'var(--color-border-hover)'}`,
        }"
      >
        <Check
            v-if="task.is_done"
            class="w-3.5 h-3.5 text-white transition-opacity duration-300"
        />
      </div>

      <div class="flex flex-col flex-1 gap-1 overflow-hidden">

        <span
            class="font-semibold text-base truncate transition-colors duration-300"
            :class="task.is_done ? 'text-text-secondary line-through' : 'text-heading'"
            :style="{ color: task.is_done ? 'var(--color-text-secondary)' : 'var(--color-heading)' }"
        >
          {{ title }}
        </span>

        <span
            class="badge surface-soft self-start font-medium transition-colors duration-300"
            :style="{ color: 'var(--color-text-secondary)' }"
        >
          📅 {{ props.task.day }}
        </span>
      </div>

      <div
          class="text-text-secondary hover:text-heading p-1 mr-1 flex-shrink-0 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
      </div>

    </li>
  </Transition>
</template><style scoped>
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1);
}
.fade-scale-enter-active {
  transition: all 0.2s ease-out;
}
</style>
