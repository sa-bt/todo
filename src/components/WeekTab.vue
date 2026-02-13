<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import TaskStatsCard from '@/components/Days/Card.vue'
import Table from '@/components/Week/Table.vue'
import { getShamsiWeekRange } from '@/utils/jalali'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'
import { Lock } from 'lucide-vue-next'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue' // ✅ ایمپورت مدال تایید

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const loading = ref(true)
const showModal = ref(false)
const selectedGoalId = ref(null)
const selectedDays = ref([])
const isSubmitting = ref(false)

const modalRef = ref(null)
const goalSelectRef = ref(null)

const { start, end } = getShamsiWeekRange()
const weekDays = []
const dayNames = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
const startDate = new Date(start)
for (let i = 0; i < 7; i++) {
  const d = new Date(startDate)
  d.setDate(startDate.getDate() + i)
  weekDays.push({
    label: dayNames[i],
    date: d.toISOString().slice(0,10)
  })
}

const goalOptions = computed(() =>
    goalsStore.goals.map(g => ({ value: g.id, label: g.title }))
)

async function loadData() {
  loading.value = true
  await goalsStore.fetchGoals({ without_children: true })
  await tasksStore.fetchTasks({ start_date: start, end_date: end })
  loading.value = false
}

const weekTasks = computed(() =>
    tasksStore.tasks.filter(t => t.day >= start && t.day <= end)
)

const tasksRows = computed(() => {
  const map = new Map()
  tasksStore.tasks.forEach(t => {
    if (!map.has(t.goal_id)) {
      const goal = goalsStore.goals.find(g => g.id === t.goal_id)
      map.set(t.goal_id, {
        goal_id: t.goal_id,
        goal_title: goal ? goal.title : '---',
        weekTasks: {}
      })
    }
    map.get(t.goal_id).weekTasks[t.day] = t
  })
  return Array.from(map.values())
})

const completedCount = computed(() => weekTasks.value.filter(t => t.is_done).length)
const completedPercent = computed(() =>
    weekTasks.value.length ? (completedCount.value / weekTasks.value.length) * 100 : 0
)

const isTaskExisting = (day) => {
  return tasksStore.tasks.some(t => t.goal_id === selectedGoalId.value && t.day === day)
}

function openModal() {
  selectedGoalId.value = null
  selectedDays.value = []
  showModal.value = true
  nextTick(() => {
    goalSelectRef.value?.focusInput?.()
  })
}

function closeModal() {
  selectedGoalId.value = null
  selectedDays.value = []
  showModal.value = false
}

function toggleDay(day) {
  if (isTaskExisting(day)) return
  const index = selectedDays.value.indexOf(day)
  if (index === -1) selectedDays.value.push(day)
  else selectedDays.value.splice(index, 1)
}

async function addTask() {
  if (!selectedGoalId.value || !selectedDays.value.length || isSubmitting.value) return
  isSubmitting.value = true
  try {
    for (const day of selectedDays.value) {
      await tasksStore.addTask({ goal_id: selectedGoalId.value, day, is_done: 0 })
    }
    closeModal()
  } finally {
    isSubmitting.value = false
  }
}

async function toggleTask({ taskRow, day }) {
  const existingTask = taskRow.weekTasks[day]
  if (existingTask) {
    const newStatus = existingTask.is_done ? 0 : 1
    await tasksStore.updateTask(existingTask.id, { is_done: newStatus, day })
    existingTask.is_done = newStatus
  } else {
    const payload = { goal_id: taskRow.goal_id, day, is_done: 0 }
    const newTask = await tasksStore.addTask(payload)
    taskRow.weekTasks[day] = newTask
  }
}

// ✅ --- بخش مدیریت حذف ---
const showDeleteModal = ref(false)
const deletePayload = ref(null) // { type: 'daily' | 'weekly', data: ... }

// باز کردن مدال تایید برای حذف روزانه
function confirmDeleteDaily(taskId) {
  deletePayload.value = { type: 'daily', id: taskId }
  showDeleteModal.value = true
}

// باز کردن مدال تایید برای حذف هفتگی (کل ردیف)
function confirmDeleteWeekly(taskRow) {
  // جمع‌آوری تمام آی‌دی‌های تسک‌های این هدف در این هفته
  const ids = Object.values(taskRow.weekTasks).map(t => t.id).filter(Boolean)
  if (ids.length === 0) return

  deletePayload.value = {
    type: 'weekly',
    ids: ids,
    title: taskRow.goal_title
  }
  showDeleteModal.value = true
}

// اجرای حذف پس از تایید
async function performDelete() {
  if (!deletePayload.value) return

  if (deletePayload.value.type === 'daily') {
    await tasksStore.removeTask(deletePayload.value.id)
  } else if (deletePayload.value.type === 'weekly') {
    // حذف تمام تسک‌های این ردیف
    await Promise.all(deletePayload.value.ids.map(id => tasksStore.removeTask(id)))
  }

  showDeleteModal.value = false
  deletePayload.value = null
}
// ------------------------

function onKeydown(e) {
  if (e.key === 'Escape' && showModal.value) {
    e.stopPropagation()
    closeModal()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="p-4 min-h-screen surface text-[var(--color-text)]">

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <TaskStatsCard title="کل تسک‌ها" :value="weekTasks.length" icon="ListChecks" color="blue" />
      <TaskStatsCard title="انجام شده" :value="completedCount" icon="CheckCircle" color="green" :progress="completedPercent" />
      <TaskStatsCard title="باقی مانده" :value="weekTasks.length - completedCount" icon="XCircle" color="orange" :progress="100 - completedPercent" />
    </div>

    <div class="mt-6 text-right">
      <button
          @click="openModal"
          class="btn btn-primary tap-target"
      >
        ➕ اضافه کردن تسک هفته
      </button>
    </div>

    <div v-if="loading" class="text-center py-6 mt-10">
      <div class="w-12 h-12 border-4 border-[var(--color-accent)] border-dashed rounded-full animate-spin mx-auto"></div>
      <p class="mt-3 text-text-secondary">در حال بارگذاری تسک‌های این هفته…</p>
    </div>
    <div v-else class="mt-6">
      <!-- ✅ گوش دادن به ایونت‌های حذف -->
      <Table
          v-if="tasksRows.length"
          :weekDays="weekDays"
          :tasksRows="tasksRows"
          @toggle-task="toggleTask"
          @delete-daily-task="confirmDeleteDaily"
          @delete-weekly-tasks="confirmDeleteWeekly"
      />
      <div v-else class="text-center py-10 text-text-secondary">
        هیچ تسکی برای این هفته ثبت نشده است
      </div>
    </div>

    <!-- مدال افزودن -->
    <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-labelledby="week-modal-title"
        aria-modal="true"
        role="dialog"
    >
      <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
      <div ref="modalRef" class="relative w-full max-w-md rounded-2xl p-6 shadow-xl border border-token surface-soft outline-none" tabindex="-1">
        <button @click="closeModal" class="absolute top-4 left-4 p-1 rounded hover:surface-mute text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"></button>
        <h3 id="week-modal-title" class="text-lg font-bold mb-4 text-right text-[var(--color-heading)]">انتخاب هدف برای هفته</h3>
        <BaseSelect v-model="selectedGoalId" :options="goalOptions" placeholder="-- یک هدف انتخاب کنید --" :disabled="loading || !goalsStore.goals.length" align="auto" :maxHeight="280" ref="goalSelectRef" />
        <div v-if="selectedGoalId" class="mb-4 mt-3">
          <div class="flex gap-2 overflow-x-auto py-2 scroll-soft">
            <div v-for="day in weekDays" :key="day.date" @click="toggleDay(day.date)" @keydown.enter.prevent="toggleDay(day.date)" @keydown.space.prevent="toggleDay(day.date)" class="flex-shrink-0 w-16 sm:w-14 p-3 rounded-lg cursor-pointer transition-transform duration-200 transform flex flex-col items-center text-center outline-none border border-token relative" :tabindex="isTaskExisting(day.date) ? -1 : 0" :aria-pressed="selectedDays.includes(day.date)" :class="[ isTaskExisting(day.date) ? 'surface-mute text-text-secondary opacity-70 cursor-not-allowed' : selectedDays.includes(day.date) ? 'bg-[var(--color-primary)] text-white shadow-lg scale-105' : 'surface-soft text-[var(--color-primary)] hover:surface-mute' ]">
              <BaseTooltip v-if="isTaskExisting(day.date)" text="تسک قبلاً برای این هدف و روز ثبت شده است." placement="top" class="absolute top-2 left-2"><Lock class="w-3 h-3 text-[var(--color-text-secondary)]" aria-hidden="true" /></BaseTooltip>
              <span class="text-sm font-medium">{{ day.label }}</span>
              <span class="text-xs sm:hidden text-[var(--color-text-secondary)]">{{ day.date.slice(5) }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="closeModal" class="btn btn-ghost border border-token">انصراف</button>
          <button @click="addTask" :disabled="!selectedGoalId || !selectedDays.length || isSubmitting" class="btn btn-primary tap-target is-disabled">اضافه کردن</button>
        </div>
      </div>
    </div>

    <!-- ✅ مدال تایید حذف -->
    <DeleteConfirmModal
        :show="showDeleteModal"
        :title="deletePayload?.type === 'weekly' ? 'حذف تسک‌های هفته' : 'حذف تسک'"
        :message="deletePayload?.type === 'weekly' ? `آیا تمام تسک‌های هدف «${deletePayload?.title}» در این هفته حذف شوند؟` : 'آیا این تسک حذف شود؟'"
        @close="showDeleteModal = false"
        @confirm="performDelete"
    />

  </div>
</template>

<style scoped>
/* استایل‌های قبلی باقی می‌مانند */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
