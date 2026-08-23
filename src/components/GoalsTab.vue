<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGoalsStore } from '@/stores/goals'
import GoalModal from '@/components/Goals/GoalModal.vue'
import AddTaskModal from '@/components/Goals/AddTaskModal.vue'
import GoalsList from '@/components/Goals/List.vue'
import PageHeader from '@/components/UI/PageHeader.vue'
import StatCard from '@/components/UI/StatCard.vue'
import EmptyState from '@/components/UI/EmptyState.vue'
import BaseButton from '@/components/UI/BaseButton.vue'

/* آیکون‌های Lucide */
import { Target, CheckCircle2, Plus, Clock } from 'lucide-vue-next'

const store = useGoalsStore()

const showModal = ref(false)
const editingGoal = ref(null)
const showTaskModal = ref(false)
const selectedGoal = ref(null)

const goals = computed(() => store.goals)
const totalCount = computed(() => store.goals?.length || 0)
const inProgressCount = computed(() => store.goals.filter(g => g.status === 'in_progress').length)
const completedCount = computed(() => store.goals.filter(g => g.status === 'completed').length)

onMounted(async () => {
  try {
    await store.fetchGoals({ without_children: false })
  } catch (error) {
    console.error('Initial goals fetch failed:', error)
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
  if (editingGoal.value) {
    await store.updateGoal(editingGoal.value.id, payload)
  } else {
    await store.addGoal(payload)
  }
closeModal(); 
}
function closeModal() {
  showModal.value = false;
  // ✅ این خط کلیدی است: پس از بسته شدن، مرجع را قطع می‌کند.
  editingGoal.value = null; 
}

async function handleDeleteGoal(goalId) {
  await store.removeGoal(goalId)
}

async function handleTaskSubmit(payload) {
  await store.addGoalTask(payload)
  showTaskModal.value = false
}
</script>

<template>
  <div class="page">
    <PageHeader title="اهداف من" subtitle="هر کار به یکی از همین اهداف وصل می‌شود.">
      <template #actions>
        <BaseButton @click="openModal()">
          <Plus class="w-4 h-4" aria-hidden="true" />
          افزودن هدف
        </BaseButton>
      </template>
    </PageHeader>

    <!-- حالت بارگذاری -->
    <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-2xl surface border border-token p-6 animate-pulse h-24"></div>
      <div class="rounded-2xl surface border border-token p-6 animate-pulse h-24"></div>
      <div class="rounded-2xl surface border border-token p-6 animate-pulse h-24"></div>
    </div>

    <template v-else>
      <!-- کارت‌های آمار -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="همه اهداف" :value="totalCount" :icon="Target" color="blue" />
        <StatCard title="در حال انجام" :value="inProgressCount" :icon="Clock" color="orange" />
        <StatCard title="انجام‌شده" :value="completedCount" :icon="CheckCircle2" color="green" />
      </div>

      <!-- حالت خالی -->
      <EmptyState
        v-if="goals.length === 0"
        variant="empty"
        title="هنوز هدفی ثبت نکرده‌ای"
        description="اولین هدفت را بساز تا بتوانی برایش کار تعریف کنی."
        action-label="افزودن هدف"
        :icon="Target"
        @action="openModal()"
      />

      <!-- لیست اهداف -->
      <GoalsList
          v-else
          @onEdit="openModal"
          @onDelete="handleDeleteGoal"
          @onAddTask="openTaskModal"
      />
    </template>

    <!-- مودال‌ها -->
    <GoalModal
        :show="showModal"
        :editingGoal="editingGoal"
        @close="closeModal"
        @save="handleSave"
    />
    <AddTaskModal
        v-if="selectedGoal"
        :show="showTaskModal"
        :goal="selectedGoal"
        @close="showTaskModal = false"
@save="handleTaskSubmit"    />
  </div>
</template>
