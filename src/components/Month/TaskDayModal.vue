<script setup>
import { ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import { Check, X, Plus, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  dayData: {
    type: Object,
    required: true,
  },
  dayLabel: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'task-updated'])

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const isAdding = ref(false)
const newGoalId = ref(null)
const isSubmitting = ref(false)
const togglingTaskId = ref(null)

const isToggling = computed(() => togglingTaskId.value !== null)
const isBusy = computed(() => isSubmitting.value || isToggling.value)

const dayTasks = computed(() => {
  return tasksStore.tasks.filter(task => {
    const taskDay = task.day?.slice(0, 10)
    return taskDay === props.dayData.isoDate
  })
})

const goalOptions = computed(() =>
  goalsStore.goals.map(goal => ({
    value: goal.id,
    label: goal.title,
  }))
)

const existingGoalIds = computed(() =>
  dayTasks.value.map(task => task.goal_id)
)

const availableGoalOptions = computed(() =>
  goalOptions.value.filter(option => !existingGoalIds.value.includes(option.value))
)

function startAdding() {
  if (isBusy.value) return

  isAdding.value = true
  newGoalId.value = null
}

function cancelAdding() {
  if (isBusy.value) return

  isAdding.value = false
  newGoalId.value = null
}

function closeModal() {
  if (isBusy.value) return
  emit('close')
}

async function handleAddTask() {
  if (!newGoalId.value || isSubmitting.value || isToggling.value) return

  isSubmitting.value = true

  try {
    await tasksStore.addTask({
      goal_id: newGoalId.value,
      day: props.dayData.isoDate,
      is_done: false,
    })

    isAdding.value = false
    newGoalId.value = null

    emit('task-updated')
  } finally {
    isSubmitting.value = false
  }
}

async function toggleTaskStatus(task) {
  if (!task?.id) return

  // قفل سراسری: تا وقتی یک تسک در حال آپدیت است، هیچ تسک دیگری قابل کلیک نیست.
  if (isToggling.value) return

  togglingTaskId.value = task.id

  try {
    await tasksStore.toggleTaskStatus(task)
    emit('task-updated')
  } finally {
    togglingTaskId.value = null
  }
}

function getGoalTitle(task) {
  if (task.goal_title) return task.goal_title

  const goal = goalsStore.goals.find(goal => goal.id === task.goal_id)
  return goal ? goal.title : 'هدف حذف شده'
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    aria-modal="true"
    role="dialog"
  >
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <div
      class="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-token surface-soft outline-none max-h-[88vh] overflow-y-auto"
      tabindex="-1"
    >
      <div
        v-if="isToggling"
        class="absolute inset-0 z-20 rounded-t-3xl sm:rounded-3xl bg-black/5 backdrop-blur-[1px] pointer-events-none"
      ></div>

      <div class="flex justify-between items-start gap-3 mb-5 border-b border-token pb-4">
        <div>
          <h3 class="text-lg sm:text-xl font-black text-[var(--color-heading)]">
            تسک‌های روز {{ dayData.dayOfMonth }} {{ dayLabel }}
          </h3>
          <p class="text-xs sm:text-sm text-text-secondary mt-1">
            برای تغییر وضعیت، روی کارت تسک کلیک کن.
          </p>
        </div>

        <button
          @click="closeModal"
          :disabled="isBusy"
          class="w-9 h-9 flex items-center justify-center rounded-full hover:surface-mute text-text-secondary tap-target"
          :class="{ 'opacity-50 cursor-not-allowed': isBusy }"
          aria-label="بستن"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div v-if="dayTasks.length" class="space-y-3">
        <button
          v-for="task in dayTasks"
          :key="task.id"
          type="button"
          @click="toggleTaskStatus(task)"
          :disabled="isToggling"
          class="w-full p-3.5 rounded-2xl surface flex items-center justify-between gap-3 text-right border border-token transition-all duration-200 hover:shadow-md tap-target"
          :class="{
            'opacity-80 bg-green-500/10 border-green-500/20': task.is_done,
            'opacity-55 cursor-not-allowed': isToggling && togglingTaskId !== task.id,
            'cursor-wait ring-2 ring-[var(--color-primary)]/30': togglingTaskId === task.id,
          }"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span
              class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-token"
              :class="{
                'bg-green-500 text-white border-green-500': task.is_done,
                'bg-token text-text-secondary': !task.is_done,
              }"
            >
              <Loader2
                v-if="togglingTaskId === task.id"
                class="w-4 h-4 animate-spin"
              />
              <Check
                v-else-if="task.is_done"
                class="w-4 h-4"
              />
              <X
                v-else
                class="w-4 h-4"
              />
            </span>

            <div class="min-w-0">
              <p
                class="text-sm sm:text-base font-bold truncate"
                :class="{ 'line-through text-text-secondary': task.is_done }"
              >
                {{ getGoalTitle(task) }}
              </p>

              <p class="text-xs text-text-secondary mt-1">
                {{ task.is_done ? 'انجام شده' : 'در انتظار انجام' }}
              </p>
            </div>
          </div>

          <span
            class="hidden sm:inline-flex text-xs px-2 py-1 rounded-full"
            :class="{
              'bg-green-500/10 text-green-600': task.is_done,
              'bg-orange-500/10 text-orange-500': !task.is_done,
            }"
          >
            {{ task.is_done ? 'Done' : 'Pending' }}
          </span>
        </button>
      </div>

      <div
        v-else
        class="text-center py-8 text-text-secondary surface-mute rounded-2xl border border-dashed border-token"
      >
        تسک فعالی برای این روز ثبت نشده است.
      </div>

      <div class="mt-6 pt-4 border-t border-token">
        <button
          v-if="!isAdding && availableGoalOptions.length > 0"
          @click="startAdding"
          :disabled="isBusy"
          class="btn btn-ghost w-full justify-center tap-target text-[var(--color-primary)]"
          :class="{ 'opacity-50 cursor-not-allowed': isBusy }"
        >
          <Plus class="w-5 h-5 ml-2" />
          اضافه کردن تسک جدید
        </button>

        <p
          v-else-if="!isAdding && availableGoalOptions.length === 0"
          class="text-sm text-red-500 text-center"
        >
          تمام اهداف موجود قبلاً برای این روز تسک دارند.
        </p>

        <div v-if="isAdding" class="space-y-3">
          <p class="text-sm text-text-secondary">
            یک هدف را برای اضافه کردن به این روز انتخاب کنید:
          </p>

          <BaseSelect
            v-model="newGoalId"
            :options="availableGoalOptions"
            placeholder="انتخاب هدف"
            :disabled="isBusy"
          />

          <div class="flex justify-end gap-2">
            <button
              @click="cancelAdding"
              :disabled="isBusy"
              class="btn btn-ghost tap-target"
              :class="{ 'opacity-50 cursor-not-allowed': isBusy }"
            >
              انصراف
            </button>

            <button
              @click="handleAddTask"
              :disabled="!newGoalId || isBusy"
              class="btn btn-primary tap-target"
              :class="{ 'opacity-50 cursor-not-allowed': !newGoalId || isBusy }"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin ml-2" />
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>