<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ListChecks, CheckCircle, XCircle } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import { toPersianNumber } from '@/utils/number'
import { toPersianDate } from '@/utils/date'
import TaskStatsCard from '@/components/Days/Card.vue'
import TaskItem from '@/components/Days/TaskItem.vue'
import { getTodayShamsi } from '@/utils/jalali'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

// لودینگ
const loading = ref(true)

// مدال اضافه تسک
const showModal = ref(false)
const selectedGoalId = ref(null)

// تاریخ امروز
const today = ref(getTodayShamsi())

// تسک‌های امروز
const todayTasks = computed(() => tasksStore.tasks)

// شمارش انجام شده
const completedCount = computed(() => todayTasks.value.filter((t) => t.is_done).length)
const completedPercent = computed(() =>
  todayTasks.value.length ? (completedCount.value / todayTasks.value.length) * 100 : 0
)

// باز کردن مدال
function openModal() {
  selectedGoalId.value = null
  showModal.value = true
}

const availableGoals = computed(() => {
  const todayTaskGoalIds = todayTasks.value.map((t) => t.goal_id)
  return goalsStore.goals.filter((g) => !todayTaskGoalIds.includes(g.id))
})

// اضافه کردن تسک جدید
async function addTask() {
  if (!selectedGoalId.value) return
  const payload = {
    goal_id: selectedGoalId.value,
    day: today.value,
    is_done: 0,
  }
  await tasksStore.addTask(payload)
  showModal.value = false
}

// toggle انجام شد
async function toggleDone(task) {
  const updated = { ...task, is_done: task.is_done ? 0 : 1 }
  await tasksStore.updateTask(task.id, updated)
  const index = tasksStore.tasks.findIndex((t) => t.id === task.id)
  if (index !== -1) tasksStore.tasks[index] = updated
}

// لود اولیه
onMounted(async () => {
  await goalsStore.fetchGoals({ without_children: 1 })
  await tasksStore.fetchTasks({ start_date: today.value, end_date: today.value })
  loading.value = false
})

const displayedPercent = ref(0)
watch(
  () => completedPercent.value,
  (newVal) => {
    const step = () => {
      if (Math.abs(displayedPercent.value - newVal) < 0.1) {
        displayedPercent.value = newVal
        return
      }
      displayedPercent.value += (newVal - displayedPercent.value) * 0.1
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
)
</script>

<template>
  <div class="p-4 min-h-screen">
    <h2 class="text-2xl font-bold mb-4 text-right">تسک‌های امروز</h2>

    <!-- کارت‌ها -->
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
        :value="todayTasks.length - completedCount"
        icon="XCircle"
        color="orange"
        :progress="100 - completedPercent"
      />
    </div>

    <!-- دکمه اضافه کردن تسک -->
    <div class="mt-6 text-right">
      <button
        @click="openModal"
        class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:scale-105 transform transition"
      >
        ➕ اضافه کردن تسک
      </button>
    </div>

    <!-- لیست تسک‌ها -->
    <div v-if="loading" class="text-center py-6 mt-10">
      <div
        class="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin mx-auto"
      ></div>
    </div>
    <div v-else class="mt-6">
      <ul v-if="todayTasks.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 space-y-3">
        <TaskItem
          v-for="task in todayTasks"
          :key="task.id"
          :task="task"
          @toggle="toggleDone"
        />
      </ul>

      <div v-else class="text-gray-500 text-center py-10">هیچ تسکی برای امروز ثبت نشده است</div>
    </div>

    <!-- مدال انتخاب هدف -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-right">انتخاب هدف برای امروز</h3>

        <select v-model="selectedGoalId" class="w-full p-3 rounded-lg border text-right mb-4">
          <option :value="null">-- یک هدف انتخاب کنید --</option>
          <option v-for="g in availableGoals" :key="g.id" :value="g.id">{{ g.title }}</option>
        </select>

        <div class="flex justify-end gap-2">
          <button
            @click="showModal = false"
            class="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
          >
            انصراف
          </button>
          <button
            @click="addTask"
            class="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
          >
            اضافه کردن
          </button>
        </div>
      </div>
    </div>
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
