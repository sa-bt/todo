<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import TaskStatsCard from '@/components/Days/Card.vue'
import TaskItem from '@/components/Days/TaskItem.vue'
import AddTaskModal from '@/components/Days/AddTaskModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { getTodayShamsi, getTodayGregorian } from '@/utils/jalali'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const loading = ref(true)
const showModal = ref(false)

const todayApiDate = ref(getTodayGregorian())
const todayShamsiDate = ref(getTodayShamsi())

const showDeleteModal = ref(false)
const taskToDelete = ref(null)

const isTaskTogglePending = ref(false)
const pendingTaskId = ref(null)

const todayTasks = computed(() => {
  return tasksStore.tasks.filter(task => {
    const taskDay = task.day?.slice(0, 10)
    return taskDay === todayApiDate.value
  })
})

const completedCount = computed(() =>
  todayTasks.value.filter(task => task.is_done).length
)

const remainingCount = computed(() =>
  todayTasks.value.length - completedCount.value
)

const completedPercent = computed(() => {
  if (!todayTasks.value.length) return 0
  return Math.round((completedCount.value / todayTasks.value.length) * 100)
})

function openModal() {
  if (isTaskTogglePending.value) return
  showModal.value = true
}

async function addTask(goalId) {
  if (!goalId) return

  await tasksStore.addTask({
    goal_id: goalId,
    day: todayApiDate.value,
    is_done: false,
  })

  showModal.value = false
}

async function toggleDone(task) {
  if (isTaskTogglePending.value) return

  isTaskTogglePending.value = true
  pendingTaskId.value = task.id

  try {
    await tasksStore.toggleTaskStatus(task)
  } finally {
    isTaskTogglePending.value = false
    pendingTaskId.value = null
  }
}

function confirmRemove(id) {
  if (isTaskTogglePending.value) return

  taskToDelete.value = id
  showDeleteModal.value = true
}

async function performDelete() {
  if (!taskToDelete.value) return

  await tasksStore.removeTask(taskToDelete.value)

  showDeleteModal.value = false
  taskToDelete.value = null
}

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      goalsStore.fetchGoals({ without_children: 1 }),
      tasksStore.fetchTasks({
        start_date: todayApiDate.value,
        end_date: todayApiDate.value,
      }),
    ])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen surface text-[var(--color-text)] px-3 py-4 sm:p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-[var(--color-heading)] text-right">
            تسک‌های امروز
          </h2>
          <p class="text-sm text-text-secondary mt-1 text-right">
            امروز: {{ todayShamsiDate }}
          </p>
        </div>

        <button
          @click="openModal"
          :disabled="isTaskTogglePending"
          class="tap-target inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/30 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          :class="{ 'opacity-50 cursor-not-allowed': isTaskTogglePending }"
        >
          <span class="text-lg leading-none">➕</span>
          <span>افزودن تسک</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <TaskStatsCard
          title="کل تسک‌ها"
          :value="todayTasks.length"
          icon="ListChecks"
          color="blue"
        />

        <TaskStatsCard
          title="انجام شده"
          :value="completedCount"
          icon="CheckCircle"
          color="green"
          :progress="completedPercent"
        />

        <TaskStatsCard
          title="باقی مانده"
          :value="remainingCount"
          icon="XCircle"
          color="orange"
          :progress="100 - completedPercent"
        />
      </div>

      <div v-if="loading" class="text-center py-6 mt-10">
        <div class="w-12 h-12 border-4 border-[var(--color-primary)] border-dashed rounded-full animate-spin mx-auto"></div>
        <p class="mt-3 text-text-secondary">در حال بارگذاری تسک‌های امروز…</p>
      </div>

      <div v-else class="mt-6">
        <ul
          v-if="todayTasks.length"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start"
        >
          <TaskItem
            v-for="task in todayTasks"
            :key="task.id"
            :task="task"
            :disabled="isTaskTogglePending"
            :loading="pendingTaskId === task.id"
            @toggle="toggleDone"
            @remove="confirmRemove"
          />
        </ul>

        <div
          v-else
          class="text-text-secondary text-center py-12 surface-soft rounded-3xl border border-dashed border-token"
        >
          هیچ تسکی برای امروز ثبت نشده است
        </div>
      </div>
    </div>

    <AddTaskModal
      v-if="showModal"
      :goals="goalsStore.goals"
      :tasks="todayTasks"
      @close="showModal = false"
      @add="addTask"
    />

    <DeleteConfirmModal
      :show="showDeleteModal"
      title="حذف تسک"
      message="آیا از حذف این تسک اطمینان دارید؟"
      @close="showDeleteModal = false"
      @confirm="performDelete"
    />
  </div>
</template>