<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import TaskStatsCard from '@/components/UI/StatCard.vue'
import Table from '@/components/Week/Table.vue'
import { getShamsiWeekRange } from '@/utils/jalali'
import { weightedPercent } from '@/utils/taskWeight'
import { progressToDate } from '@/utils/progressToDate'
import { toPersianNumber } from '@/utils/number'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import PageHeader from '@/components/UI/PageHeader.vue'
import EmptyState from '@/components/UI/EmptyState.vue'
import LoadingState from '@/components/UI/LoadingState.vue'
import { Lock, Plus, X, ListChecks, CheckCircle, XCircle, CalendarCheck } from 'lucide-vue-next'
import ConfirmDialog from '@/components/UI/ConfirmDialog.vue'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const loading = ref(true)
const showModal = ref(false)
const selectedGoalId = ref(null)
const selectedDays = ref([])
const isSubmitting = ref(false)

const modalRef = ref(null)
const goalSelectRef = ref(null)

const { start, end, shamsiStart, shamsiEnd } = getShamsiWeekRange()

const weekRangeLabel = `${shamsiStart} تا ${shamsiEnd}`
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

const loadError = ref(false)

async function loadData() {
  loading.value = true
  loadError.value = false
  try {
    await goalsStore.fetchGoals({ without_children: true })
    await tasksStore.fetchTasks({ start_date: start, end_date: end })
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
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
// شمارش بالا شمارش می‌ماند، درصد از اولویت هدف‌ها اثر می‌گیرد.
const completedPercent = computed(() => weightedPercent(weekTasks.value))

/*
 * سه کارت بالا کل هفته را می‌سنجند، یعنی روزهای نرسیده هم در مخرجشان هستند.
 * این کارت همان نسبت را فقط تا امروز می‌گیرد. قاعده‌هایش در پیمانه است.
 */
const weekToDate = computed(() => progressToDate(weekTasks.value, { start, end }))

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
    await tasksStore.addTask(payload)

    /*
     * خروجی این کنش پاکت پاسخ سرور است، نه خود تسک. قبلاً همان پاکت به‌عنوان
     * تسک در جدول می‌نشست، پس خانه ساخته‌شده شناسه نداشت و کلیک بعدی روی همان
     * خانه درخواست به‌روزرسانی با شناسه تهی می‌فرستاد.
     *
     * استور خودش تسک نرمال‌شده را در حالت می‌گذارد، پس از همان‌جا خوانده می‌شود.
     */
    taskRow.weekTasks[day] = tasksStore.tasks.find(
      (task) => task.goal_id === taskRow.goal_id && task.day === day,
    )
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
  <div class="page">

    <PageHeader title="کارهای این هفته" :subtitle="weekRangeLabel">
      <template #actions>
        <BaseButton @click="openModal">
          <Plus class="w-4 h-4" aria-hidden="true" />
          افزودن کار هفته
        </BaseButton>
      </template>
    </PageHeader>

    <div
        class="grid grid-cols-1 gap-4"
        :class="weekToDate.applicable ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'"
    >
      <TaskStatsCard title="همه کارها" :value="weekTasks.length" :icon="ListChecks" color="blue" />
      <TaskStatsCard title="انجام‌شده" :value="completedCount" :icon="CheckCircle" color="green" :progress="completedPercent" />
      <TaskStatsCard title="باقی‌مانده" :value="weekTasks.length - completedCount" :icon="XCircle" color="orange" :progress="100 - completedPercent" />
      <TaskStatsCard
          v-if="weekToDate.applicable"
          title="تا امروز"
          :value="`${toPersianNumber(weekToDate.done)} از ${toPersianNumber(weekToDate.total)}`"
          :icon="CalendarCheck"
          color="indigo"
          :progress="weekToDate.percent"
      />
    </div>

    <LoadingState v-if="loading" title="در حال بارگذاری کارهای این هفته…" />

    <EmptyState
        v-else-if="loadError"
        variant="error"
        title="دریافت کارهای این هفته ناموفق بود"
        description="اتصال اینترنت را بررسی کن و دوباره تلاش کن."
        action-label="تلاش دوباره"
        @action="loadData"
    />

    <!-- ✅ گوش دادن به ایونت‌های حذف -->
    <Table
        v-else-if="tasksRows.length"
        :weekDays="weekDays"
        :tasksRows="tasksRows"
        @toggle-task="toggleTask"
        @delete-daily-task="confirmDeleteDaily"
        @delete-weekly-tasks="confirmDeleteWeekly"
    />

    <EmptyState
        v-else
        variant="empty"
        title="هنوز کاری برای این هفته ثبت نشده است"
        description="یک هدف انتخاب کن و روزهای هفته را برایش مشخص کن."
        action-label="افزودن کار هفته"
        @action="openModal"
    />

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
        <!-- The close button used to render an empty box: it had no icon and no label. -->
        <button
            @click="closeModal"
            class="absolute top-4 left-4 p-1 rounded hover-surface-mute text-[var(--color-text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            type="button"
            aria-label="بستن"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
        <h3 id="week-modal-title" class="text-lg font-bold mb-4 text-right text-[var(--color-heading)]">انتخاب هدف برای هفته</h3>
        <BaseSelect v-model="selectedGoalId" :options="goalOptions" placeholder="یک هدف انتخاب کنید" :disabled="loading || !goalsStore.goals.length" align="auto" :maxHeight="280" ref="goalSelectRef" />
        <div v-if="selectedGoalId" class="mb-4 mt-3">
          <div class="flex gap-2 overflow-x-auto py-2 scroll-soft">
            <div v-for="day in weekDays" :key="day.date" @click="toggleDay(day.date)" @keydown.enter.prevent="toggleDay(day.date)" @keydown.space.prevent="toggleDay(day.date)" class="flex-shrink-0 w-16 sm:w-14 p-3 rounded-lg cursor-pointer transition-transform duration-200 transform flex flex-col items-center text-center outline-none border border-token relative" :tabindex="isTaskExisting(day.date) ? -1 : 0" :aria-pressed="selectedDays.includes(day.date)" :class="[ isTaskExisting(day.date) ? 'surface-mute text-text-secondary opacity-70 cursor-not-allowed' : selectedDays.includes(day.date) ? 'bg-[var(--color-primary)] text-white shadow-lg scale-105' : 'surface-soft text-[var(--color-primary)] hover-surface-mute' ]">
              <BaseTooltip v-if="isTaskExisting(day.date)" text="برای این هدف و این روز، کار ثبت شده است." placement="top" class="absolute top-2 left-2"><Lock class="w-3 h-3 text-[var(--color-text-secondary)]" aria-hidden="true" /></BaseTooltip>
              <span class="text-sm font-medium">{{ day.label }}</span>
              <span class="text-xs sm:hidden text-[var(--color-text-secondary)]">{{ day.date.slice(5) }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <BaseButton variant="ghost" @click="closeModal">انصراف</BaseButton>
          <!--
            The confirm button used to carry `is-disabled` unconditionally, so it
            looked disabled even when a goal and days were chosen.
          -->
          <BaseButton
              :disabled="!selectedGoalId || !selectedDays.length"
              :loading="isSubmitting"
              @click="addTask"
          >
            افزودن
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- ✅ مدال تایید حذف -->
    <ConfirmDialog
        :open="showDeleteModal"
        :title="deletePayload?.type === 'weekly' ? 'حذف کارهای هفته' : 'حذف کار'"
        :message="deletePayload?.type === 'weekly' ? `همه کارهای هدف «${deletePayload?.title}» در این هفته حذف شوند؟` : 'این کار حذف شود؟ این عمل قابل بازگشت نیست.'"
        confirm-label="حذف"
        variant="danger"
        @cancel="showDeleteModal = false"
        @confirm="performDelete"
    />

  </div>
</template>

<style scoped>
/* استایل‌های قبلی باقی می‌مانند */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
