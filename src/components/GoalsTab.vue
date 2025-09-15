<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGoalsStore } from '@/stores/goals'
import GoalModal from '@/components/Goals/GoalModal.vue'
import { toPersianNumber } from '@/utils/number'
import { toPersianDate } from '@/utils/date'
import AddTaskModal from '@/components/Goals/AddTaskModal.vue'
import { useNotificationStore } from '@/stores/toast'
import NotificationToast from '@/components/ToastNotification.vue'
import GoalsList from '@/components/Goals/List.vue'

// state
const showTaskModal = ref(false)
const selectedGoal = ref(null)
const loading = ref(true)

const notificationStore = useNotificationStore()
const store = useGoalsStore()

// باز کردن مدال تسک
function openTaskModal(goal) {
  selectedGoal.value = goal
  showTaskModal.value = true
}

// ذخیره تسک
async function handleTaskSubmit(payload) {
  try {
    const res = await store.addGoalTask(payload)
    console.log('تسک ذخیره شد:', res)
    notificationStore.setNotification('تسک با موفقیت اضافه شد!', 'success')
    showTaskModal.value = false
  } catch (err) {
    console.error('خطا در ذخیره تسک:', err)
    notificationStore.setNotification('خطا در ذخیره تسک!', 'error')
  }
}

// مدال اهداف
const showModal = ref(false)
const editingGoal = ref(null)
const goals = computed(() => store.goals)

// فرم
const title = ref('')
const description = ref('')
const priority = ref('medium')
const status = ref('pending')
const parentId = ref(null)

// option ها
const priorities = [
  { value: 'low', label: 'کم' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'زیاد' },
]
const statuses = [
  { value: 'pending', label: 'در انتظار' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل شده' },
]

// بارگذاری اهداف
onMounted(async () => {
  await store.fetchGoals()
  loading.value = false
})

// باز کردن مدال
function openModal(goal = null) {
  if (goal) {
    editingGoal.value = goal
    title.value = goal.title
    description.value = goal.description
    priority.value = goal.priority
    status.value = goal.status
    parentId.value = goal.parent_id
  } else {
    editingGoal.value = null
    title.value = ''
    description.value = ''
    priority.value = 'medium'
    status.value = 'pending'
    parentId.value = null
  }
  showModal.value = true
}

// ذخیره هدف
async function handleSave(payload) {
  try {
    if (editingGoal.value) {
      await store.updateGoal(editingGoal.value.id, payload)
      notificationStore.setNotification('هدف با موفقیت بروزرسانی شد!', 'success')
    } else {
      await store.addGoal(payload)
      notificationStore.setNotification('هدف با موفقیت اضافه شد!', 'success')
    }
    showModal.value = false
  } catch (err) {
    notificationStore.setNotification('خطا در عملیات هدف!', 'error')
  }
}
</script>

<template>
  <NotificationToast />

  <div>
    <div v-if="store.loading" class="text-center text-gray-500 py-6">در حال بارگذاری...</div>
    <div v-else>
      <!-- گزارش‌ها -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- کارت تعداد کل اهداف -->
        <div
          class="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 text-center"
        >
          <i class="fas fa-bullseye text-3xl mb-2"></i>
          <p class="text-lg font-semibold">تعداد کل اهداف</p>
          <h3 class="text-3xl font-bold">{{ toPersianNumber(store.goals.length) }}</h3>
        </div>

        <!-- کارت اهداف بدون والد -->
        <div
          class="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 text-center"
        >
          <i class="fas fa-sitemap text-3xl mb-2"></i>
          <p class="text-lg font-semibold">اهداف بدون والد</p>
          <h3 class="text-3xl font-bold">
            {{ toPersianNumber(store.goals.filter((g) => !g.parent_id).length) }}
          </h3>
        </div>

        <!-- کارت اهداف تکمیل شده -->
        <div
          class="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 text-center"
        >
          <i class="fas fa-check-circle text-3xl mb-2"></i>
          <p class="text-lg font-semibold">اهداف تکمیل شده</p>
          <h3 class="text-3xl font-bold">
            {{ toPersianNumber(store.goals.filter((g) => g.status === 'completed').length) }}
          </h3>
        </div>
      </div>

      <!-- دکمه افزودن هدف -->
      <div class="text-right mb-4">
        <button
          @click="openModal()"
          class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-2 rounded-xl"
        >
          افزودن هدف جدید
        </button>
      </div>

      <!-- لیست اهداف -->
      <GoalsList
        :goals="goals"
        :onEdit="openModal"
        :onDelete="store.removeGoal"
        :onAddTask="openTaskModal"
      />
    </div>

    <GoalModal
      :show="showModal"
      :editingGoal="editingGoal"
      :priorities="priorities"
      :statuses="statuses"
      :goals="store.goals"
      @close="showModal = false"
      @save="handleSave"
    />
    <AddTaskModal
      :show="showTaskModal"
      :goal="selectedGoal"
      @close="showTaskModal = false"
      @taskCreated="handleTaskSubmit"
    />
  </div>
</template>
