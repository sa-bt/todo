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
      class="flex items-center justify-between p-4 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white"
    >
      <!-- بخش اطلاعات -->
      <div class="flex flex-col flex-1 gap-1 overflow-hidden mr-4">
        <span
          class="font-semibold text-sm truncate"
          :class="task.is_done ? 'line-through text-gray-500' : 'text-gray-800'"
        >
          {{ title }}
        </span>
        <span
          class="text-xs px-2 py-1 rounded-full self-start font-medium truncate"
          :class="task.is_done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
        >
          {{ props.task.day }}
        </span>
      </div>

      <!-- دکمه وضعیت -->
      <button
        class="w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-out"
        :class="task.is_done
          ? 'bg-green-500 border-green-600 text-white'
          : 'bg-white border-gray-300 hover:border-gray-500 text-gray-400'"
      >
        <Check v-if="task.is_done" class="w-5 h-5 transition-transform duration-300 transform scale-100" />
      </button>
    </li>
  </Transition>
</template>

<style scoped>
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
