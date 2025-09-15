<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useGoalsStore } from '@/stores/goals'
import TaskStatsCard from '@/components/Days/Card.vue'
import Table from '@/components/Week/Table.vue'
import { getShamsiWeekRange } from '@/utils/jalali'

const tasksStore = useTasksStore()
const goalsStore = useGoalsStore()

const loading = ref(true)
const showModal = ref(false)
const selectedGoalId = ref<number | null>(null)
const selectedDays = ref<string[]>([])

const { start, end } = getShamsiWeekRange()
const weekDays: { label: string; date: string }[] = []
const startDate = new Date(start)
for (let i = 0; i < 7; i++) {
  const d = new Date(startDate)
  d.setDate(startDate.getDate() + i)
  weekDays.push({
    label: ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه'][i],
    date: d.toISOString().slice(0,10)
  })
}

async function loadData() {
  loading.value = true
  await goalsStore.fetchGoals({without_children:true})
  await tasksStore.fetchTasks({ start_date: start, end_date: end })
  loading.value = false
}

const weekTasks = computed(() => tasksStore.tasks.filter(t => t.day >= start && t.day <= end))

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
const completedPercent = computed(() => weekTasks.value.length ? (completedCount.value / weekTasks.value.length) * 100 : 0)

function openModal() {
  selectedGoalId.value = null
  selectedDays.value = []
  showModal.value = true
}

function closeModal() {
  selectedGoalId.value = null
  selectedDays.value = []
  showModal.value = false
}

function toggleDay(day: string) {
  if (tasksStore.tasks.some(t => t.goal_id === selectedGoalId && t.day === day)) return
  const index = selectedDays.value.indexOf(day)
  if (index === -1) selectedDays.value.push(day)
  else selectedDays.value.splice(index, 1)
}

async function addTask() {
  if (!selectedGoalId.value) return
  for (const day of selectedDays.value) {
    await tasksStore.addTask({ goal_id: selectedGoalId.value, day, is_done: 0 })
  }
  closeModal()
}

async function toggleTask({ taskRow, day }: { taskRow: any; day: string }) {
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

onMounted(() => loadData())
</script>

<template>
  <div class="p-4 min-h-screen">

    <!-- کارت‌ها -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <TaskStatsCard title="کل تسک‌ها" :value="weekTasks.length" icon="ListChecks" color="blue" />
      <TaskStatsCard title="انجام شده" :value="completedCount" icon="CheckCircle" color="green" :progress="completedPercent" />
      <TaskStatsCard title="باقی مانده" :value="weekTasks.length - completedCount" icon="XCircle" color="orange" :progress="100 - completedPercent" />
    </div>

    <!-- دکمه اضافه کردن تسک هفته -->
    <div class="mt-6 text-right">
      <button @click="openModal" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:scale-105 transform transition">
        ➕ اضافه کردن تسک هفته
      </button>
    </div>

    <!-- جدول تسک‌ها -->
    <div v-if="loading" class="text-center py-6 mt-10">
      <div class="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin mx-auto"></div>
    </div>
    <div v-else class="mt-6">
      <Table v-if="tasksRows.length" :weekDays="weekDays" :tasksRows="tasksRows" @toggle-task="toggleTask" />
      <div v-else class="text-gray-500 text-center py-10">هیچ تسکی برای این هفته ثبت نشده است</div>
    </div>

    <!-- مودال هفته -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-right">انتخاب هدف برای هفته</h3>
        <select v-model="selectedGoalId" class="w-full p-3 rounded-lg border text-right mb-4">
          <option :value="null">-- یک هدف انتخاب کنید --</option>
          <option v-for="g in goalsStore.goals" :key="g.id" :value="g.id">{{ g.title }}</option>
        </select>

        <div v-if="selectedGoalId" class="mb-4">
          <div class="flex gap-2 overflow-x-auto py-2">
            <div v-for="day in weekDays" :key="day.date" @click="toggleDay(day.date)"
              class="flex-shrink-0 w-16 sm:w-14 p-3 rounded-lg cursor-pointer transition-transform duration-200 transform flex flex-col items-center text-center"
              :class="[
                tasksStore.tasks.some(t => t.goal_id === selectedGoalId && t.day === day.date)
                  ? 'bg-gray-200 text-gray-400 line-through cursor-not-allowed'
                  : selectedDays.includes(day.date)
                    ? 'bg-indigo-500 text-white shadow-lg scale-105'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              ]"
            >
              <span v-if="tasksStore.tasks.some(t => t.goal_id === selectedGoalId && t.day === day.date)" class="mb-1">✅</span>
              <span class="text-sm font-medium">{{ day.label }}</span>
              <span class="text-xs text-gray-500 sm:hidden">{{ day.date.slice(5) }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button @click="closeModal" class="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">انصراف</button>
          <button @click="addTask" class="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600" :disabled="!selectedGoalId || !selectedDays.length">اضافه کردن</button>
        </div>
      </div>
    </div>

  </div>
</template>
