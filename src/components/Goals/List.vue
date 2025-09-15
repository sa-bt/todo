<script setup>
import { ref, computed, defineProps } from 'vue'
import { toPersianDate } from '@/utils/date'
import { Pencil, Trash2, Plus, Clock, CheckCircle, Zap, AlertCircle, Target } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/toast'
import { toPersianNumber } from '@/utils/number'

const notification = useNotificationStore()

// props ساده JS بدون TypeScript
const props = defineProps({
  goals: Array,
  onEdit: Function,
  onDelete: Function,
  onAddTask: Function
})

// جستجو و فیلتر
const search = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')

// استایل اولویت‌ها
const priorityStyles = {
  high: { color: 'text-red-600', border: '#f87171' },
  medium: { color: 'text-yellow-600', border: '#facc15' },
  low: { color: 'text-green-600', border: '#34d399' },
}

// متن فارسی وضعیت و اولویت
const statusLabels = {
  pending: 'در انتظار',
  in_progress: 'در حال انجام',
  completed: 'تکمیل شده',
}

const statusIcons = {
  pending: Clock,
  in_progress: Zap,
  completed: CheckCircle,
}

const priorityLabels = {
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
}

const priorityIcons = {
  high: Target,
  medium: Zap,
  low: AlertCircle,
}

// فیلتر اهداف
const filteredGoals = computed(() =>
  props.goals.filter((goal) => {
    const query = search.value.toLowerCase().trim()
    const title = (goal.title || '').toLowerCase()
    const description = (goal.description || '').toLowerCase()

    const matchSearch = !query || title.includes(query) || description.includes(query)
    const matchStatus = statusFilter.value === 'all' || goal.status === statusFilter.value
    const matchPriority = priorityFilter.value === 'all' || goal.priority === priorityFilter.value

    return matchSearch && matchStatus && matchPriority
  })
)

// مدال تایید حذف
const showConfirm = ref(false)
const selectedGoalId = ref(null)

function confirmDelete(goalId) {
  selectedGoalId.value = goalId
  showConfirm.value = true
}

function cancelDelete() {
  selectedGoalId.value = null
  showConfirm.value = false
}

function proceedDelete() {
  if (selectedGoalId.value !== null) {
    props.onDelete(selectedGoalId.value)
    notification.setNotification('هدف با موفقیت حذف شد', 'success')
  }
  cancelDelete()
}
</script>

<template>
  <div class="bg-gray-50 p-6 rounded-2xl">
    <!-- فیلتر و جستجو -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="🔍 جستجو در اهداف..."
        class="w-full md:w-1/3 p-2 rounded-xl border border-gray-300 focus:ring focus:ring-indigo-200 focus:outline-none"
      />
      <div class="flex flex-wrap gap-3 justify-end">
        <select v-model="statusFilter" class="p-2 rounded-xl border text-sm">
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="in_progress">در حال انجام</option>
          <option value="completed">تکمیل شده</option>
        </select>
        <select v-model="priorityFilter" class="p-2 rounded-xl border text-sm">
          <option value="all">همه اولویت‌ها</option>
          <option value="high">بالا</option>
          <option value="medium">متوسط</option>
          <option value="low">پایین</option>
        </select>
      </div>
    </div>

    <!-- لیست اهداف -->
    <div v-if="filteredGoals.length === 0" class="text-gray-400 text-center py-6">
      هیچ هدفی پیدا نشد
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="goal in filteredGoals"
        :key="goal.id"
        class="relative p-6 rounded-2xl border shadow-sm flex flex-col justify-between bg-white transition-transform duration-300 transform hover:-translate-y-2 hover:shadow-2xl group"
        :style="{ borderColor: priorityStyles[goal.priority]?.border || '#e5e7eb' }"
      >
        <!-- عنوان و badge والد -->
        <div class="space-y-3 text-right">
          <h3 class="font-semibold text-gray-800 flex items-center gap-2 justify-end text-lg">
            <component :is="priorityIcons[goal.priority]" class="w-4 h-4 text-red-500" />
            {{ goal.title }}
            <span
              v-if="goal.children && goal.children.length > 0"
              class="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium"
            >
              والد
            </span>
          </h3>

          <p class="text-sm text-gray-600 leading-relaxed">
            {{ goal.description }}
          </p>

          <!-- وضعیت و اولویت -->
          <div class="flex flex-wrap justify-end gap-2 text-xs">
            <span class="flex items-center gap-1 font-semibold">
              <component :is="priorityIcons[goal.priority]" class="w-4 h-4 text-red-500" />
              {{ priorityLabels[goal.priority] }}
            </span>
            <span class="flex items-center gap-1 bg-gray-100 text-gray-700 font-medium px-2 py-1 rounded-full">
              <component :is="statusIcons[goal.status]" class="w-4 h-4 text-gray-700" />
              {{ statusLabels[goal.status] }}
            </span>
          </div>

          <!-- تاریخ‌ها -->
          <p class="text-xs text-gray-400">📅 ایجاد: {{ toPersianDate(goal.created_at) }}</p>
          <p class="text-xs text-gray-400" v-if="goal.updated_at">✏️ آخرین تغییر: {{ toPersianDate(goal.updated_at) }}</p>
        </div>

        <!-- دکمه‌ها -->
        <div class="flex flex-wrap gap-2 justify-end mt-5 pt-3 border-t border-gray-200">
          <button
            @click="props.onEdit(goal)"
            class="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition transform hover:scale-105 text-sm font-medium cursor-pointer"
          >
            <Pencil class="w-4 h-4" />
            ویرایش
          </button>

          <!-- حذف فقط برای اهداف بدون بچه -->
          <button
            v-if="!goal.children || goal.children.length === 0"
            @click="confirmDelete(goal.id)"
            class="flex items-center gap-1 text-gray-500 hover:text-red-500 transition transform hover:scale-105 text-sm font-medium cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            حذف
          </button>

          <button
            @click="props.onAddTask(goal)"
            class="flex items-center gap-1 text-gray-500 hover:text-indigo-700 transition transform hover:scale-105 text-sm font-medium cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            تسک
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal تایید حذف -->
  <transition name="fade-scale">
    <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div class="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-lg text-right transform transition-transform">
        <h3 class="text-lg font-semibold mb-4">تایید حذف</h3>
        <p class="mb-6">آیا از حذف این هدف مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
        <div class="flex justify-end gap-3">
          <button
            @click="cancelDelete"
            class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            لغو
          </button>
          <button
            @click="proceedDelete"
            class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
