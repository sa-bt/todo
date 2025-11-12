<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { toPersianDate } from '@/utils/date'
import { useGoalsStore } from '@/stores/goals'

import {
  Pencil,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  Zap,
  Target,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  ListTree,
  Info,
  Hash,
} from 'lucide-vue-next'
import BaseSelect from '../UI/BaseSelect.vue'
import ConfirmDeleteModal from './ConfirmDeleteGoalModal.vue'
import GoalStatsModal from './GoalStatsModal.vue'




const store = useGoalsStore()
const emit = defineEmits(['onEdit', 'onDelete', 'onAddTask'])

// ---------------- UX: دیبونس جستجو + نرمال‌سازی فارسی ----------------
const search = ref('')
const searchDebounced = ref('')
let t = null
watch(search, (v) => {
  clearTimeout(t)
  t = setTimeout(() => (searchDebounced.value = v), 300)
})
function normFa(s = '') {
  return s
    .toString()
    .replace(/\u200c/g, ' ')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

watch(
  () => store.goals.length,
  async () => {
    await nextTick()
    // 🔹 رفرش نرم pseudo-element ها
    document.querySelectorAll('.has-tip').forEach(el => {
      // ترفند: تغییر سبک جزئی باعث reflow می‌شود
      el.style.willChange = 'auto'
      void el.offsetHeight
      el.style.willChange = ''
    })
  }
)

// ---------------- برچسب‌ها و آیکن‌ها ----------------
const statusLabels = { pending: 'در انتظار', in_progress: 'در حال انجام', completed: 'تکمیل شده' }
const statusIcons = { pending: Clock, in_progress: Loader2, completed: CheckCircle }
const priorityLabels = { high: 'بالا', medium: 'متوسط', low: 'پایین' }
const priorityIcons = { high: Zap, medium: Clock, low: Target }
const priorityColorClasses = {
  high: 'text-[var(--color-heading)]',
  medium: 'text-[var(--color-heading)]/80',
  low: 'text-[var(--color-heading)]/70',
}

function calculateProgress(stats) {
  if (!stats || stats.total === 0 || stats.total == null) return 0
  return Math.round((stats.done / stats.total) * 100)
}
function progressColor(percentage) {
  if (percentage >= 80) return 'color-mix(in oklab, var(--color-primary) 70%, white)'
  if (percentage >= 40) return 'color-mix(in oklab, var(--color-accent) 55%, white)'
  return 'color-mix(in oklab, var(--color-secondary) 60%, white)'
}

// ---------------- فیلتر اهداف ----------------
const statusFilter = ref('all')
const priorityFilter = ref('all')
const statusFilterOptions = [
  { value: 'all', label: 'همه وضعیت‌ها' },
  { value: 'pending', label: statusLabels.pending },
  { value: 'in_progress', label: statusLabels.in_progress },
  { value: 'completed', label: statusLabels.completed },
]
const priorityFilterOptions = [
  { value: 'all', label: 'همه اولویت‌ها' },
  { value: 'high', label: priorityLabels.high },
  { value: 'medium', label: priorityLabels.medium },
  { value: 'low', label: priorityLabels.low },
]

const filteredGoals = computed(() =>
  (store.goals || []).filter((g) => {
    const q = normFa(searchDebounced.value)
    const title = normFa(g.title || '')
    const desc = normFa(g.description || '')
    const matchSearch = !q || title.includes(q) || desc.includes(q)
    const matchStatus = statusFilter.value === 'all' || g.status === statusFilter.value
    const matchPriority = priorityFilter.value === 'all' || g.priority === priorityFilter.value
    return matchSearch && matchStatus && matchPriority
  })
)

// ---------------- مودال آمار ----------------
const showStatsModal = ref(false)
const selectedGoalForStats = ref(null)
function openStatsModal(goal) {
  if (goal.children_count === 0) {
    selectedGoalForStats.value = goal
    showStatsModal.value = true
    document.documentElement.style.overflow = 'hidden'
  }
}
function closeStatsModal() {
  selectedGoalForStats.value = null
  showStatsModal.value = false
  document.documentElement.style.overflow = ''
}

// ---------------- مودال حذف ----------------
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
async function proceedDelete() {
  if (selectedGoalId.value != null) {
    emit('onDelete', selectedGoalId.value)
  }
  cancelDelete()
}
</script>

<template>
  <div class="space-y-8">
    <!-- فیلتر و جستجو -->
    <div class="p-6 rounded-3xl border border-token shadow-sm bg-[var(--color-background-soft)]">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="🔍 جستجو در اهداف (عنوان/توضیحات)..."
          class="w-full md:w-1/3 p-3.5 rounded-xl border-2 border-token shadow-inner-sm focus:border-[var(--color-primary)] card-bg text-right custom-input transition"
        />
        <div class="flex flex-wrap gap-3 justify-end w-full md:w-auto">
          <BaseSelect
            v-model="statusFilter"
            :options="statusFilterOptions"
            name="status-filter"
            class="w-full sm:w-48"
          />
          <BaseSelect
            v-model="priorityFilter"
            :options="priorityFilterOptions"
            name="priority-filter"
            class="w-full sm:w-48"
          />
        </div>
      </div>
    </div>

    <!-- لودر -->
    <div v-if="store.loading" class="text-center py-12">
      <svg
        class="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p class="mt-4 text-[var(--color-text)]/70">در حال بارگذاری اهداف...</p>
    </div>

    <!-- خالی -->
    <div
      v-else-if="filteredGoals.length === 0"
      class="text-center py-12 card-bg border border-token rounded-3xl shadow-sm"
    >
      <div class="mb-2 text-xl font-bold text-[var(--color-heading)]">
        چیزی مطابق با فیلترها پیدا نشد!
      </div>
      <p class="text-text-secondary text-sm mb-6">
        فیلترهای جستجو و وضعیت را بررسی کن یا هدف جدیدی بساز.
      </p>
      <button
        @click="$emit('onEdit', null)"
        class="tap-target px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold inline-flex items-center gap-2 transition transform hover:scale-[1.01] shadow-md shadow-[var(--color-primary)]/30"
      >
        <Plus class="w-5 h-5" /> افزودن هدف جدید
      </button>
    </div>

    <!-- لیست اهداف -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="goal in filteredGoals"
        :key="goal.id"
        class="goal-card p-7 rounded-3xl border border-token shadow-sm flex flex-col justify-between card-bg transition-all duration-200 hover:shadow-md"
      >
        <span v-if="goal.priority" class="ribbon">{{ priorityLabels[goal.priority] }}</span>

        <div class="space-y-4 text-right">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-end gap-3">
              <h3
                class="font-extrabold text-2xl leading-snug"
                :style="{ color: 'var(--color-heading)' }"
              >
                {{ goal.title }}
              </h3>

              <svg
                v-if="goal.children_count === 0 && goal.stats"
                width="36"
                height="36"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--color-border)"
                  stroke-width="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  :stroke="`color-mix(in oklab, var(--color-primary) ${Math.max(
                    30,
                    calculateProgress(goal.stats)
                  )}%, white)`"
                  stroke-width="4"
                  stroke-linecap="round"
                  :stroke-dasharray="`${2 * Math.PI * 15}`"
                  :stroke-dashoffset="`${
                    2 * Math.PI * 15 * (1 - calculateProgress(goal.stats) / 100)
                  }`"
                  transform="rotate(-90 18 18)"
                />
                <text x="18" y="20" text-anchor="middle" font-size="10" fill="var(--color-heading)">
                  {{ calculateProgress(goal.stats) }}%
                </text>
              </svg>

              <span :class="priorityColorClasses[goal.priority]">
                <component :is="priorityIcons[goal.priority]" class="w-5 h-5" />
              </span>
            </div>

            <div class="flex justify-end flex-wrap gap-2 text-xs pt-1 pb-1">
              <span class="chip chip-primary"
                ><component :is="statusIcons[goal.status]" class="w-4 h-4" />
                {{ statusLabels[goal.status] }}</span
              >
              <span v-if="goal.children_count > 0" class="chip chip-secondary"
                ><ListTree class="w-3.5 h-3.5 ml-1" /> {{ goal.children_count }} زیرمجموعه</span
              >
              <span v-else-if="goal.parent_id" class="chip chip-secondary"
                ><Target class="w-3.5 h-3.5 ml-1" /> هدف فرزند</span
              >
              <span class="chip chip-neutral subtle"
                ><Calendar class="w-3.5 h-3.5 ml-1" /> {{ toPersianDate(goal.created_at) }}</span
              >
            </div>
          </div>

          <p
            v-if="goal.description"
            class="text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-[40px]"
          >
            {{ goal.description }}
          </p>

          <template v-if="goal.children_count === 0 && goal.stats">
            <div class="pt-3 mt-3">
              <div class="text-sm text-[var(--color-heading)] font-bold flex justify-between mb-2">
                <span
                  >پیشرفت: <b>{{ goal.stats.done }}</b> از <b>{{ goal.stats.total }}</b></span
                >
                <span>%{{ calculateProgress(goal.stats) }}</span>
              </div>
              <div class="progress-rtl w-full bg-[var(--color-border)] rounded-full h-2.5">
                <div
                  class="bar h-2.5 rounded-full transition-all duration-500"
                  :style="{
                    width: `${calculateProgress(goal.stats)}%`,
                    background: progressColor(calculateProgress(goal.stats)),
                  }"
                />
              </div>
            </div>
          </template>

          <div v-else class="text-sm text-text-secondary/80 pt-3 mt-3">
            <template v-if="goal.children_count > 0">
              (این هدف اصلی است و آمار تسک‌ها برای {{ goal.children_count }} زیرمجموعه آن محاسبه
              نمی‌شود.)
            </template>
            <template v-else> (تسک یا آمار عملکردی برای این هدف ثبت نشده است.) </template>
          </div>
        </div>

        <div
          class="card-actions mt-4 pt-4 flex flex-wrap items-center gap-2 border-t border-token"
          :class="{
            'justify-center': goal.children_count > 0,
            'justify-between': goal.children_count === 0,
          }"
        >
          <button
            v-if="goal.children_count === 0"
            @click="$emit('onAddTask', goal)"
            class="btn-ghost-primary tap-target flex items-center gap-1.5 has-tip"
            data-tip="افزودن تسک"
          >
            <Plus class="w-4 h-4" /><span class="hidden sm:inline font-bold">تسک</span>
          </button>

          <div class="flex items-center gap-2">
            <button @click="$emit('onEdit', goal)" class="icon-btn has-tip" data-tip="ویرایش">
              <Pencil class="w-4 h-4" />
            </button>
            <button
              v-if="goal.children_count === 0"
              @click="openStatsModal(goal)"
              class="icon-btn has-tip"
              data-tip="آمار"
            >
              <BarChart3 class="w-4 h-4" />
            </button>
            <!-- حذف -->
            <button
              v-if="goal.children_count === 0"
              @click="confirmDelete(goal.id)"
              class="icon-btn danger has-tip"
              data-tip="حذف"
              aria-label="حذف"
            >
              <Trash2 class="w-4 h-4" />
            </button>

            <!-- برای والد‌ها فقط آیکن غیرفعال نمایشی -->
            <button
              v-else
              disabled
              class="icon-btn opacity-40 cursor-not-allowed"
              data-tip="ابتدا زیرهدف‌ها را حذف کن"
              aria-label="غیرفعال"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- مودال‌ها -->
  <ConfirmDeleteModal
    v-model:show="showConfirm"
    :goal-id="selectedGoalId"
    @cancel="cancelDelete"
    @confirm="proceedDelete"
  />
  <GoalStatsModal
    v-model:show="showStatsModal"
    :goal="selectedGoalForStats"
    @close="closeStatsModal"
  />
</template>


<style scoped>
/* ---------------- Input ---------------- */
.custom-input {
  color: var(--color-text);
  background-color: var(--color-background);
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.06);
  outline: none;
  transition: all 0.2s;
}
.custom-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 24%, white);
}

/* ---------------- Card: ساده و مینیمال ---------------- */
.goal-card {
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
}

/* بدون گرادیان/افکت‌های تند؛ فقط هاور خیلی ملایم */
.goal-card:hover {
  transform: translateY(-1px);
}

/* utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 2;
}
.card-bg {
  background-color: var(--color-background);
}

/* ---------------- Ribbon (مینیمال) ---------------- */
.ribbon {
  position: absolute;
  top: 12px;
  right: -6px; /* RTL */
  padding: 0.3rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 8%, var(--color-background));
  border: 1px solid color-mix(in oklab, var(--color-primary) 22%, var(--color-border));
  border-radius: 0.5rem 0 0 0.5rem;
}

/* ---------------- Chips / Badges ---------------- */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
}
.chip.subtle {
  opacity: 0.95;
}
.chip-primary {
  background: color-mix(in oklab, var(--color-primary) 8%, white);
  color: var(--color-primary);
  border-color: color-mix(in oklab, var(--color-primary) 20%, var(--color-border));
}
.chip-secondary {
  background: color-mix(in oklab, var(--color-secondary) 8%, white);
  color: var(--color-secondary);
  border-color: color-mix(in oklab, var(--color-secondary) 20%, var(--color-border));
}
.chip-neutral {
  background: color-mix(in oklab, var(--color-border) 30%, white);
  color: var(--color-heading);
  border-color: color-mix(in oklab, var(--color-border) 55%, white);
}

/* ---------------- نوار اکشن کارت ---------------- */
.card-actions {
  display: flex;
  align-items: center;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  padding-top: 1rem;
}
.btn-ghost-primary {
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 8%, var(--color-background));
  border: 1px solid color-mix(in oklab, var(--color-primary) 20%, var(--color-border));
  border-radius: 0.8rem;
  padding: 0.5rem 0.8rem;
  font-weight: 700;
  transition: 0.2s ease;
  box-shadow: 0 2px 8px -6px rgba(0, 0, 0, 0.1);
}
.btn-ghost-primary:hover {
  background: color-mix(in oklab, var(--color-primary) 12%, var(--color-background));
  transform: translateY(-1px);
}
.icon-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, white);
  background: color-mix(in oklab, var(--color-background) 94%, white);
  color: var(--color-heading);
  transition: 0.18s ease;
  position: relative;
}
.icon-btn:hover {
  background: color-mix(in oklab, var(--color-background-soft) 70%, white);
  transform: translateY(-1px);
}
.icon-btn:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-primary) 35%, white);
  outline-offset: 2px;
}
.icon-btn.danger {
  color: color-mix(in oklab, var(--color-secondary) 60%, black);
}

/* ---------------- تولتیپ سبک ---------------- */
.has-tip::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  right: 50%;
  transform: translateX(50%); /* RTL */
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-heading);
  background: color-mix(in oklab, var(--color-background) 92%, white);
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, white);
  padding: 0.32rem 0.5rem;
  border-radius: 0.5rem;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 8px 18px -10px rgba(0, 0, 0, 0.18);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.has-tip:hover::after {
  opacity: 1;
  transform: translateX(50%) translateY(-2px);
}

/* ---------------- Panels / Metrics (Modal) ---------------- */
.panel {
  border: 1px solid color-mix(in oklab, var(--color-border) 82%, white);
  border-radius: 1rem;
  padding: 1.25rem;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.panel-title {
  font-weight: 800;
  color: var(--color-heading);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (min-width: 768px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.metric-card {
  background: color-mix(in oklab, var(--color-background-soft) 90%, white);
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, white);
  border-radius: 0.875rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.metric-card.row {
  flex-direction: row;
  align-items: center;
}
.metric-label {
  font-size: 0.75rem;
  color: color-mix(in oklab, var(--color-text) 78%, white);
  margin-bottom: 0.25rem;
}
.metric-title {
  font-weight: 800;
  color: var(--color-heading);
}
.metric-sub {
  font-size: 0.85rem;
  color: color-mix(in oklab, var(--color-text) 88%, white);
}
.metric-value {
  font-weight: 800;
  color: var(--color-heading);
  font-size: 1.1rem;
}
.metric-badge {
  font-weight: 900;
  padding: 0.25rem 0.7rem;
  border-radius: 0.75rem;
  background: color-mix(in oklab, var(--color-primary) 10%, white);
  color: var(--color-primary);
  border: 1px solid color-mix(in oklab, var(--color-primary) 24%, var(--color-border));
}

/* رنگ‌های لهجه‌ای کارت‌ها */
.metric-card.accent-primary {
  background: color-mix(in oklab, var(--color-primary) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-primary) 22%, var(--color-border));
}
.metric-card.accent-secondary {
  background: color-mix(in oklab, var(--color-secondary) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-secondary) 22%, var(--color-border));
}
.metric-card.accent-accent {
  background: color-mix(in oklab, var(--color-accent) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-accent) 22%, var(--color-border));
}
.metric-card.accent-neutral {
  background: color-mix(in oklab, var(--color-border) 10%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-border) 55%, white);
}

/* ---------------- Progress RTL ---------------- */
.progress-rtl {
  display: flex;
  border-radius: 999px;
  overflow: hidden;
}
.progress-rtl > .bar {
  margin-left: auto;
}

/* ---------------- Buttons ---------------- */
.btn-danger {
  background: color-mix(in oklab, var(--color-secondary) 20%, var(--color-background));
  color: var(--color-heading);
  border: 1px solid color-mix(in oklab, var(--color-secondary) 40%, var(--color-border));
}
.btn-danger:hover {
  background: color-mix(in oklab, var(--color-secondary) 28%, var(--color-background));
}

/* ---------------- Animations ---------------- */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.28s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(8px);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Loader2 چرخان */
.text-yellow-500.lucide-loader-2 {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* فallback برای مرورگرهای بدون dvh */
@supports not (height: 100dvh) {
  .max-h-\[min\(92dvh,
  900px\)\] {
    max-height: 92vh;
  }
}
</style>
