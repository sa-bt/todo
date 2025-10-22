<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGoalsStore } from '@/stores/goals'
import { useNotificationStore } from '@/stores/notification'
import GoalModal from '@/components/Goals/GoalModal.vue'
import AddTaskModal from '@/components/Goals/AddTaskModal.vue'
import GoalsList from '@/components/Goals/List.vue'

/* آیکون های Lucide */
import { Target, ListTree, CheckCircle2, Plus, Clock } from 'lucide-vue-next'

const store = useGoalsStore()
const notificationStore = useNotificationStore()

const showModal = ref(false)
const editingGoal = ref(null)
const showTaskModal = ref(false)
const selectedGoal = ref(null)

const goals = computed(() => store.goals)
const totalCount = computed(() => store.goals.length)
// تغییر به اهداف در حال انجام (In Progress)
const inProgressCount = computed(() => store.goals.filter(g => g.status === 'in_progress').length)
const completedCount = computed(() => store.goals.filter(g => g.status === 'completed').length)

onMounted(async () => {
  // فراخوانی ساده: منطق جلوگیری از فراخوانی‌های مکرر اکنون در Pinia Store مدیریت می‌شود.
  try {
    await store.fetchGoals({ without_children: false });
  } catch (error) {
    // error handling handled by store's action
    console.error('Initial goals fetch failed:', error);
  }
})

function openModal(goal = null) {
  editingGoal.value = goal ?? null
  showModal.value = true
}

function openTaskModal(goal) {
  selectedGoal.value = goal
  showTaskModal.value = true
}

async function handleSave(payload) {
  try {
    if (editingGoal.value) {
      await store.updateGoal(editingGoal.value.id, payload)
      notificationStore.displayMessage('هدف با موفقیت بروزرسانی شد!', 'success')
    } else {
      await store.addGoal(payload)
      notificationStore.displayMessage('هدف با موفقیت اضافه شد!', 'success')
    }
    showModal.value = false
  } catch (err) {
    console.error('Goal Save/Update failed:', err);
    notificationStore.handleApiError(err);
  }
}

/** تابع مدیریت حذف هدف و نمایش اعلان */
async function handleDeleteGoal(goalId) {
  try {
    await store.removeGoal(goalId)
    notificationStore.displayMessage('هدف با موفقیت حذف شد!', 'success')
  } catch (err) {
    console.error('Goal Deletion failed:', err);
    notificationStore.handleApiError(err);
  }
}

async function handleTaskSubmit(payload) {
  try {
    // فرض بر این است که addGoalTask در Store state هدف مربوطه را به‌روز می‌کند
    await store.addGoalTask(payload)

    notificationStore.displayMessage('تسک با موفقیت اضافه شد!', 'success')
    showTaskModal.value = false

    // فراخوانی store.fetchGoals() حذف شده است.
  } catch (err) {
    console.error('Task Submission failed:', err);
    notificationStore.handleApiError(err);
  }
}
</script>

<template>

  <div class="space-y-6">
    <!-- نمایش وضعیت بارگذاری (Skeletons) -->
    <!-- حالا فقط به store.loading اعتماد می‌کنیم -->
    <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-2xl card-bg border border-token p-6 animate-pulse h-32"></div>
      <div class="rounded-2xl card-bg border border-token p-6 animate-pulse h-32"></div>
      <div class="rounded-2xl card-bg border border-token p-6 animate-pulse h-32"></div>
    </div>

    <template v-else>
      <!-- کارت‌های آمار -->
      <!-- این تگ پایانی </div> برای این کانتینر در نسخه محلی شما احتمالا جا افتاده بود. -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-2xl p-6 card-bg border border-token shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                 :style="{ background: 'color-mix(in oklab, var(--color-primary) 15%, white)', color: 'var(--color-primary)' }">
              <Target class="w-6 h-6" />
            </div>
            <span class="text-text-secondary text-sm">تعداد کل اهداف</span>
          </div>
          <div class="mt-4 text-3xl font-bold">{{ totalCount }}</div>
        </div>

        <div class="rounded-2xl p-6 card-bg border border-token shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                 :style="{ background: 'color-mix(in oklab, var(--color-secondary) 15%, white)', color: 'var(--color-secondary)' }">
              <Clock class="w-6 h-6" />
            </div>
            <span class="text-text-secondary text-sm">اهداف در حال انجام</span>
          </div>
          <div class="mt-4 text-3xl font-bold">{{ inProgressCount }}</div>
        </div>

        <div class="rounded-2xl p-6 card-bg border border-token shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                 :style="{ background: 'color-mix(in oklab, var(--color-accent) 18%, white)', color: 'var(--color-accent)' }">
              <CheckCircle2 class="w-6 h-6" />
            </div>
            <span class="text-text-secondary text-sm">اهداف تکمیل شده</span>
          </div>
          <div class="mt-4 text-3xl font-bold">{{ completedCount }}</div>
        </div>
      </div> <!-- ✅ تگ پایانی کانتینر آمار -->

      <!-- هدر و دکمه افزودن -->
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-[var(--color-heading)]">مدیریت اهداف</h2>
        <button
            @click="openModal()"
            class="tap-target inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition ring-focus"
        >
          <Plus class="w-4 h-4" />
          افزودن هدف جدید
        </button>
      </div>

      <!-- حالت خالی -->
      <div v-if="goals.length === 0" class="card-bg border border-token rounded-2xl p-8 text-center space-y-3">
        <div class="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
             :style="{ background: 'color-mix(in oklab, var(--color-primary) 15%, white)', color: 'var(--color-primary)' }">
          <Target class="w-6 h-6" />
        </div>
        <div class="text-base font-semibold text-[var(--color-heading)]">هنوز هدفی ثبت نکردی</div>
        <p class="text-sm text-text-secondary">روی «افزودن هدف جدید» کلیک کن و اولین هدفت رو بساز.</p>
      </div>

      <!-- لیست اهداف -->
      <GoalsList
          v-else
          @onEdit="openModal"
          @onDelete="handleDeleteGoal"
          @onAddTask="openTaskModal"
      />
    </template>

    <!-- مودال‌های مدیریت هدف و تسک -->
    <GoalModal
        :show="showModal"
        :editingGoal="editingGoal"
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

<style scoped>
.card-bg { background-color: var(--color-background); }
.ring-focus:focus {
  outline: 3px solid color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
