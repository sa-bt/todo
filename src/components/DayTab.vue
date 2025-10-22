<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ListChecks, CheckCircle, XCircle } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import TaskStatsCard from '@/components/Days/Card.vue'
import TaskItem from '@/components/Days/TaskItem.vue'
import AddTaskModal from '@/components/Days/AddTaskModal.vue'
import { getTodayShamsi } from '@/utils/jalali'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const loading = ref(true)
const showModal = ref(false)
const today = ref(getTodayShamsi())

// تسک‌های امروز
const todayTasks = computed(() => tasksStore.tasks)

// آمار تسک‌ها
const completedCount = computed(() => todayTasks.value.filter(t => t.is_done).length)
const completedPercent = computed(() =>
    todayTasks.value.length ? (completedCount.value / todayTasks.value.length) * 100 : 0
)

// باز کردن مدال
function openModal() {
  showModal.value = true
}

// اضافه کردن تسک جدید
async function addTask(goalId) {
  if (!goalId) return
  const payload = { goal_id: goalId, day: today.value, is_done: 0 }
  await tasksStore.addTask(payload)
  showModal.value = false
}

// toggle انجام شدن
async function toggleDone(task) {
  const updated = { ...task, is_done: task.is_done ? 0 : 1 }
  await tasksStore.updateTask(task.id, updated)
  const index = tasksStore.tasks.findIndex(t => t.id === task.id)
  if (index !== -1) tasksStore.tasks[index] = updated
}

// لود اولیه
onMounted(async () => {
  await goalsStore.fetchGoals({ without_children: 1 })
  await tasksStore.fetchTasks({ start_date: today.value, end_date: today.value })
  loading.value = false
})

// انیمیشن درصد
const displayedPercent = ref(0)
watch(() => completedPercent.value, (newVal) => {
  const step = () => {
    if (Math.abs(displayedPercent.value - newVal) < 0.1) {
      displayedPercent.value = newVal
      return
    }
    displayedPercent.value += (newVal - displayedPercent.value) * 0.1
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
})
</script>

<template>
  <div class="p-4 min-h-screen">
    <h2 class="text-2xl font-bold mb-4 text-right">تسک‌های امروز</h2>

    <!-- کارت‌های آمار -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <TaskStatsCard title="کل تسک‌ها" :value="todayTasks.length" icon="ListChecks" color="blue" />
      <TaskStatsCard title="انجام شده" :value="completedCount" icon="CheckCircle" color="green" :progress="completedPercent" />
      <TaskStatsCard title="باقی مانده" :value="todayTasks.length - completedCount" icon="XCircle" color="orange" :progress="100 - completedPercent" />
    </div>

    <!-- دکمه اضافه کردن -->
    <div class="mt-6 text-right">
      <button
          @click="openModal"
          class="tap-target inline-flex items-center justify-center gap-2 px-5 py-3
         rounded-2xl font-semibold text-white text-sm
         bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
         shadow-lg shadow-[var(--color-primary)]/30
         transition-all duration-200 ease-out
         hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <span class="text-lg leading-none">➕</span>
        <span>افزودن تسک</span>
      </button>

    </div>

    <!-- Loader -->
    <div v-if="loading" class="text-center py-6 mt-10">
      <div class="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin mx-auto"></div>
    </div>

    <!-- لیست تسک‌ها -->
    <div v-else class="mt-6">
      <ul v-if="todayTasks.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
        <TaskItem v-for="task in todayTasks" :key="task.id" :task="task" @toggle="toggleDone" />
      </ul>

      <div v-else class="text-gray-500 text-center py-10">
        هیچ تسکی برای امروز ثبت نشده است
      </div>
    </div>

    <!-- کامپوننت مدال -->
    <AddTaskModal
        v-if="showModal"
        :goals="goalsStore.goals"
        :tasks="todayTasks"
        @close="showModal = false"
        @add="addTask"
    />
  </div>
</template>

<style scoped>
@keyframes bounceOnChange {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.animate-bounce-on-change {
  animation: bounceOnChange 0.8s ease-in-out;
}
</style>
