<script setup>
import { getTodayShamsi } from '@/utils/jalali';
import { CirclePlus, CheckCircle, XCircle } from 'lucide-vue-next';

const props = defineProps({
  weekDays: { type: Array, required: true },
  tasksRows: { type: Array, required: true }
});

const emit = defineEmits(['toggle-task']);

const todayShamsi = getTodayShamsi();

function toggleTask(taskRow, day) {
  emit('toggle-task', { taskRow, day });
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="grid grid-cols-[200px_repeat(7,1fr)] gap-x-2 gap-y-1">
      <!-- هدر ستون تسک‌ها -->
      <div class="font-bold text-right p-2 bg-gray-50 rounded-lg">
        تسک‌ها
      </div>
      <!-- هدر روزها -->
      <div
        v-for="day in weekDays"
        :key="day.date"
        class="text-center font-bold bg-gray-50 rounded-lg p-2"
        :class="day.date === todayShamsi ? 'border-2 border-blue-300' : ''"
      >
        {{ day.label }}
        <div class="text-xs text-gray-500">{{ day.date }}</div>
      </div>

      <!-- ردیف تسک‌ها -->
      <template v-for="task in tasksRows" :key="task.goal_id">
        <!-- ستون عنوان تسک -->
        <div class="p-2 text-right font-medium">
          {{ task.goal_title }}
        </div>
        <!-- ستون روزها -->
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="flex justify-center items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition"
          @click="toggleTask(task, day.date)"
        >
          <CheckCircle
            v-if="task.weekTasks[day.date]?.is_done"
            class="w-6 h-6 text-green-600 task-bounce"
          />
          <XCircle
            v-else-if="task.weekTasks[day.date]"
            class="w-6 h-6 text-red-500 task-bounce"
          />
          <CirclePlus
            v-else
            class="w-6 h-6 text-indigo-600 task-bounce"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounceScale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.task-bounce {
  animation: bounceScale 0.3s ease-in-out;
}
</style>
