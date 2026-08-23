<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import { Plus, ListChecks, CheckCircle, XCircle } from 'lucide-vue-next'
import TaskStatsCard from '@/components/UI/StatCard.vue'
import TaskItem from '@/components/Days/TaskItem.vue'
import AddTaskModal from '@/components/Days/AddTaskModal.vue'
import ConfirmDialog from '@/components/UI/ConfirmDialog.vue'
import PageHeader from '@/components/UI/PageHeader.vue'
import EmptyState from '@/components/UI/EmptyState.vue'
import LoadingState from '@/components/UI/LoadingState.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import { getTodayShamsi, getTodayGregorian } from '@/utils/jalali'
import { weightedPercent } from '@/utils/taskWeight'

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

// دو کارت بالای صفحه شمارش نشان می‌دهند و نوار پیشرفتشان درصد. شمارش‌ها بالا
// دست‌نخورده‌اند و فقط این درصد از اولویت هدف‌ها اثر می‌گیرد.
const completedPercent = computed(() => weightedPercent(todayTasks.value))

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

const loadError = ref(false)

async function loadData() {
  loading.value = true
  loadError.value = false

  try {
    await Promise.all([
      goalsStore.fetchGoals({ without_children: 1 }),
      tasksStore.fetchTasks({
        start_date: todayApiDate.value,
        end_date: todayApiDate.value,
      }),
    ])
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <PageHeader title="کارهای امروز" :subtitle="`امروز: ${todayShamsiDate}`">
      <template #actions>
        <BaseButton :disabled="isTaskTogglePending" @click="openModal">
          <Plus class="w-4 h-4" aria-hidden="true" />
          افزودن کار
        </BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <TaskStatsCard
        title="همه کارها"
        :value="todayTasks.length"
        :icon="ListChecks"
        color="blue"
      />

      <TaskStatsCard
        title="انجام‌شده"
        :value="completedCount"
        :icon="CheckCircle"
        color="green"
        :progress="completedPercent"
      />

      <TaskStatsCard
        title="باقی‌مانده"
        :value="remainingCount"
        :icon="XCircle"
        color="orange"
        :progress="100 - completedPercent"
      />
    </div>

    <LoadingState v-if="loading" title="در حال بارگذاری کارهای امروز…" />

    <EmptyState
      v-else-if="loadError"
      variant="error"
      title="دریافت کارهای امروز ناموفق بود"
      description="اتصال اینترنت را بررسی کن و دوباره تلاش کن."
      action-label="تلاش دوباره"
      @action="loadData"
    />

    <ul
      v-else-if="todayTasks.length"
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

    <EmptyState
      v-else
      variant="empty"
      title="هنوز کاری برای امروز ثبت نشده است"
      description="یکی از اهدافت را انتخاب کن تا اولین کار امروز ساخته شود."
      action-label="افزودن کار"
      @action="openModal"
    />

    <AddTaskModal
      v-if="showModal"
      :goals="goalsStore.goals"
      :tasks="todayTasks"
      @close="showModal = false"
      @add="addTask"
    />

    <ConfirmDialog
      :open="showDeleteModal"
      title="حذف کار"
      message="این کار حذف شود؟ این عمل قابل بازگشت نیست."
      confirm-label="حذف"
      variant="danger"
      @cancel="showDeleteModal = false"
      @confirm="performDelete"
    />
  </div>
</template>