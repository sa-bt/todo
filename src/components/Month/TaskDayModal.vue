<script setup>
import { ref, computed } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import { useGoalsStore } from '@/stores/goals';
import BaseSelect from '@/components/UI/BaseSelect.vue';
import { Check, X, Plus } from 'lucide-vue-next';

const props = defineProps({
  // dayData شامل isoDate و dayOfMonth است.
  dayData: {
    type: Object,
    required: true,
  },
  dayLabel: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const tasksStore = useTasksStore();
const goalsStore = useGoalsStore();

// ----------------------------------------------------------------------
// اصلاح حیاتی: خواندن تسک‌ها مستقیماً از Store برای واکنش‌پذیری
// ----------------------------------------------------------------------

const dayTasks = computed(() => {
  // تسک‌ها را مستقیماً از Pinia می‌خوانیم و فیلتر می‌کنیم
  return tasksStore.tasks.filter(t => t.day === props.dayData.isoDate);
});


// --- منطق افزودن تسک جدید ---
const isAdding = ref(false);
const newGoalId = ref(null);
const isSubmitting = ref(false);

const goalOptions = computed(() =>
    goalsStore.goals.map(g => ({ value: g.id, label: g.title }))
);

const existingGoalIds = computed(() =>
    // استفاده از dayTasks اصلاح شده
    dayTasks.value.map(t => t.goal_id)
);

const availableGoalOptions = computed(() =>
    goalOptions.value.filter(option => !existingGoalIds.value.includes(option.value))
);

function startAdding() {
  isAdding.value = true;
  newGoalId.value = null;
}

async function handleAddTask() {
  if (!newGoalId.value || isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const payload = {
      goal_id: newGoalId.value,
      day: props.dayData.isoDate,
      is_done: 0
    };
    // وقتی addTask فراخوانی می‌شود، tasksStore.tasks آپدیت می‌شود و dayTasks واکنش نشان می‌دهد
    await tasksStore.addTask(payload);
    isAdding.value = false;
    newGoalId.value = null;
  } finally {
    isSubmitting.value = false;
  }
}

// --- منطق مدیریت تسک‌های موجود (Done/Undone) ---
async function toggleTaskStatus(task) {
  const newStatus = task.is_done ? 0 : 1;

  // >>> اصلاح بر اساس متد Week View: استفاده از کل شیء task <<<
  // یک کپی از تسک می‌گیریم تا is_done را تغییر دهیم
  const payload = {
    ...task,
    is_done: newStatus
  };

  // فراخوانی اکشن Store با payload کامل
  await tasksStore.updateTask(task.id, payload);
}

// توابع کمکی UI
function getGoalTitle(goalId) {
  const goal = goalsStore.goals.find(g => g.id === goalId);
  return goal ? goal.title : 'هدف حذف شده';
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
    <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>

    <div
        class="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-token surface-soft outline-none max-h-[90vh] overflow-y-auto"
        tabindex="-1"
    >
      <div class="flex justify-between items-center mb-6 border-b border-token pb-3">
        <h3 class="text-xl font-bold text-[var(--color-heading)]">
          تسک‌های روز {{ dayData.dayOfMonth }} {{ dayLabel }}
        </h3>
        <button @click="$emit('close')" class="p-2 rounded-full hover:surface-mute text-text-secondary tap-target">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div v-if="dayTasks.length" class="space-y-3">
        <div
            v-for="task in dayTasks"
            :key="task.id"
            class="p-3 rounded-xl surface flex items-center justify-between transition-all duration-200"
            :class="{ 'opacity-70 bg-green-500/10': task.is_done }"
        >
          <span class="text-base font-medium" :class="{ 'line-through text-text-secondary': task.is_done }">
            {{ getGoalTitle(task.goal_id) }}
          </span>

          <button
              @click="toggleTaskStatus(task)"
              class="w-8 h-8 rounded-full border border-token flex items-center justify-center transition tap-target"
              :class="{
                'bg-green-500 text-white hover:bg-green-600': task.is_done, // Done
                'bg-token hover:bg-token-hover text-text-secondary': !task.is_done // Undone
            }"
              aria-label="تغییر وضعیت تسک"
          >
            <Check v-if="task.is_done" class="w-4 h-4" />
            <X v-else class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-else class="text-center py-4 text-text-secondary surface-mute rounded-xl">
        تسک فعالی برای این روز ثبت نشده است.
      </div>

      <div class="mt-6 pt-4 border-t border-token">
        <button v-if="!isAdding && availableGoalOptions.length > 0" @click="startAdding" class="btn btn-ghost w-full justify-center tap-target text-[var(--color-primary)]">
          <Plus class="w-5 h-5 ml-2" /> اضافه کردن تسک جدید
        </button>

        <p v-else-if="!isAdding && availableGoalOptions.length === 0" class="text-sm text-red-500 text-center">
          تمام اهداف موجود قبلاً برای این روز تسک دارند.
        </p>

        <div v-if="isAdding" class="space-y-3">
          <p class="text-sm text-text-secondary">یک هدف را برای اضافه کردن به این روز انتخاب کنید:</p>

          <BaseSelect
              v-model="newGoalId"
              :options="availableGoalOptions"
              placeholder="انتخاب هدف"
              :disabled="isSubmitting"
          />

          <div class="flex justify-end gap-2">
            <button @click="isAdding = false" class="btn btn-ghost tap-target">انصراف</button>
            <button
                @click="handleAddTask"
                :disabled="!newGoalId || isSubmitting"
                class="btn btn-primary tap-target is-disabled"
            >
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
