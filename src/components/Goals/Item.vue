<template>
  <div class="space-y-8">
    <!-- بخش فیلتر و جستجوی مدرن -->
    <div class="p-6 rounded-3xl border border-token shadow-xl bg-[var(--color-background-soft)]">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Input جستجو -->
        <input
            v-model="search"
            type="text"
            placeholder="🔍 جستجو در اهداف (عنوان/توضیحات)..."
            class="w-full md:w-1/3 p-3.5 rounded-xl border-2 border-token shadow-inner-sm focus:border-[var(--color-primary)] card-bg text-right custom-input transition"
            aria-label="جستجو در اهداف"
        />
        <div class="flex flex-wrap gap-3 justify-end w-full md:w-auto">
          <!-- فیلتر وضعیت با BaseSelect (فرض بر وجود BaseSelect است) -->
          <BaseSelect
              v-model="statusFilter"
              :options="statusFilterOptions"
              name="status-filter"
              placeholder="همه وضعیت‌ها"
              class="w-full sm:w-48"
          />
          <!-- فیلتر اولویت با BaseSelect (فرض بر وجود BaseSelect است) -->
          <BaseSelect
              v-model="priorityFilter"
              :options="priorityFilterOptions"
              name="priority-filter"
              placeholder="همه اولویت‌ها"
              class="w-full sm:w-48"
          />
        </div>
      </div>
    </div>

    <!-- نمایش وضعیت بارگذاری -->
    <div v-if="store.loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-[var(--color-text)]/70">در حال بارگذاری اهداف...</p>
    </div>

    <!-- حالت خالی پس از فیلتر -->
    <div v-else-if="filteredGoals.length === 0" class="text-center py-12 card-bg border border-token rounded-3xl shadow-xl">
      <div class="mb-2 text-xl font-bold text-[var(--color-heading)]">چیزی مطابق با فیلترها پیدا نشد!</div>
      <p class="text-text-secondary text-sm mb-6">فیلترهای جستجو و وضعیت را بررسی کن یا هدف جدیدی بساز.</p>
      <button
          @click="$emit('onEdit', null)"
          class="tap-target px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold inline-flex items-center gap-2 transition transform hover:scale-[1.02] shadow-lg shadow-[var(--color-primary)]/40">
        <Plus class="w-5 h-5" aria-hidden="true" /> افزودن هدف جدید
      </button>
    </div>

    <!-- نمایش لیست اهداف -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="p-7 rounded-3xl border border-token shadow-2xl flex flex-col justify-between card-bg transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] goal-card-gradient"
      >
        <div class="space-y-4 text-right">
          <!-- عنوان، وضعیت و اولویت (برای جلوگیری از شلوغی، فشرده شدند) -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-end gap-3">
              <h3 class="font-extrabold text-2xl leading-snug" :style="{color:'var(--color-heading)'}">
                {{ goal.title }}
              </h3>
              <span :class="priorityColorClasses[goal.priority]" class="flex-shrink-0">
                    <component :is="priorityIcons[goal.priority]" class="w-5 h-5" aria-hidden="true" />
                 </span>
            </div>

            <!-- تگ‌های وضعیت و اولویت در یک ردیف -->
            <div class="flex justify-end flex-wrap gap-2 text-xs pt-1 pb-2 border-b border-token/50">
                <span class="flex items-center gap-1 font-medium px-3 py-1.5 rounded-full"
                      :style="{background:'color-mix(in oklab, var(--color-primary) 10%, white)', color:'var(--color-primary)'}">
                    <component :is="statusIcons[goal.status]" class="w-4 h-4" aria-hidden="true" />
                    {{ statusLabels[goal.status] }}
                </span>

              <!-- نمایش تعداد اهداف فرزند یا وضعیت فرزند بودن -->
              <span v-if="goal.children_count > 0"
                    class="flex items-center gap-1 font-medium px-3 py-1.5 rounded-full"
                    :style="{background:'color-mix(in oklab, var(--color-secondary) 10%, white)', color:'var(--color-secondary)'}">
                    <ListTree class="w-3.5 h-3.5 inline-block ml-1"/>
                    {{ goal.children_count }} زیرمجموعه
                </span>
              <span v-else-if="goal.parent_id"
                    class="flex items-center gap-1 font-medium px-3 py-1.5 rounded-full"
                    :style="{background:'color-mix(in oklab, var(--color-secondary) 10%, white)', color:'var(--color-secondary)'}">
                    <Target class="w-3.5 h-3.5 inline-block ml-1"/>
                    هدف فرزند
                </span>
            </div>
          </div>

          <!-- توضیحات مختصر -->
          <p v-if="goal.description" class="text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-[40px]">
            {{ goal.description }}
          </p>


          </div>

          <!-- نوار پیشرفت اصلی و دکمه آمار (✅ اعمال محدودیت: فقط برای اهداف بدون فرزند) -->
          <template v-if="goal.children_count === 0 && goal.stats && goal.stats.total > 0">
            <div class="pt-4 border-t border-token/50 mt-4">
              <!-- Progress Bar -->
              <div class="text-sm text-[var(--color-heading)] font-bold flex justify-between mb-2">
                      <span>
                        پیشرفت:
                        <span class="font-extrabold">{{ goal.stats.done }}</span>
                        از
                        <span class="font-extrabold">{{ goal.stats.total }}</span>
                      </span>
                <span>%{{ calculateProgress(goal.stats) }}</span>
              </div>
              <div class="w-full bg-[var(--color-border)] rounded-full h-2.5">
                <div class="h-2.5 rounded-full transition-all duration-500"
                     :style="{ width: `${calculateProgress(goal.stats)}%`, backgroundColor: progressColor(calculateProgress(goal.stats)) }">
                </div>
              </div>
            </div>

            <!-- دکمه مشاهده تحلیل استریک‌ها (✅ اعمال محدودیت: فقط برای اهداف بدون فرزند) -->
            <div class="pt-4 space-y-3 text-sm flex justify-end">
              <button
                  @click="openStatsModal(goal)"
                  class="tap-target px-4 py-2 rounded-xl bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/20 transition font-semibold text-sm inline-flex items-center gap-1 shadow-md shadow-[var(--color-secondary)]/10">
                <BarChart3 class="w-4 h-4" aria-hidden="true"/>
                مشاهده تحلیل استریک‌ها
              </button>
            </div>
          </template>
          <!-- پیام برای اهداف والد/بدون تسک -->
          <div v-else class="text-sm text-text-secondary/80 pt-4 mt-4 border-t border-token/50">
            <template v-if="goal.children_count > 0">
              (این هدف اصلی است و آمار تسک‌ها برای {{ goal.children_count }} زیرمجموعه آن محاسبه نمی‌شود.)
            </template>
            <template v-else>
              (تسک یا آمار عملکردی برای این هدف ثبت نشده است.)
            </template>
          </div>
        </div>


        <!-- دکمه‌های اقدام (پایین کارت) -->
        <div class="flex flex-wrap gap-4 justify-between items-center mt-4 pt-4 border-t border-token">
          <p class="text-xs text-text-secondary/70 font-medium flex items-center gap-1">
            <Calendar class="w-4 h-4 text-text-secondary/50"/>
            ایجاد: {{ toPersianDate(goal.created_at) }}
          </p>

          <div class="flex gap-3">
            <button @click="$emit('onAddTask', goal)"
                    class="tap-target flex items-center gap-1 text-green-600 hover:text-green-700 transition text-sm font-bold">
              <Plus class="w-4 h-4" aria-hidden="true" />
              <span>تسک</span>
            </button>

            <button @click="$emit('onEdit', goal)"
                    class="tap-target flex items-center gap-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition text-sm font-bold">
              <Pencil class="w-4 h-4" aria-hidden="true" />
              <span>ویرایش</span>
            </button>

            <button @click="confirmDelete(goal.id)"
                    class="tap-target flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm font-bold">
              <Trash2 class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- مودال تایید حذف -->
  <Teleport to="body">
    <transition name="fade-scale">
      <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
        <div class="card-bg rounded-2xl p-8 w-full max-w-md shadow-2xl text-right border-2 border-red-500/20">
          <h3 class="text-xl font-bold mb-4 text-red-600 flex items-center justify-end gap-2">
            <Trash2 class="w-6 h-6"/> تایید حذف
          </h3>
          <p class="mb-8 text-text-secondary leading-relaxed">آیا **واقعا** مطمئن هستید که می‌خواهید این هدف را حذف کنید؟ این اقدام قابل بازگشت نیست.</p>
          <div class="flex justify-end gap-3">
            <button @click="cancelDelete" class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-background-soft)] hover:bg-[var(--color-background)] text-[var(--color-text)] transition font-medium border border-token">
              لغو
            </button>
            <button @click="proceedDelete" class="tap-target px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-medium shadow-lg shadow-red-500/30">
              حذف کن!
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- مودال نمایش تحلیل استریک‌ها (جدید) -->
  <Teleport to="body">
    <transition name="fade-scale">
      <div v-if="showStatsModal && selectedGoalForStats" @click.self="closeStatsModal"
           class="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
        <div class="card-bg rounded-3xl p-8 w-full max-w-lg shadow-2xl text-right border border-[var(--color-secondary)]/30">
          <div class="flex justify-between items-center pb-4 mb-4 border-b border-token">
            <button @click="closeStatsModal" class="p-2 rounded-full hover:bg-[var(--color-background-soft)] transition">
              <X class="w-6 h-6 text-text-secondary"/>
            </button>
            <h3 class="text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2">
              <BarChart3 class="w-6 h-6 text-[var(--color-secondary)]"/>
              تحلیل استریک: {{ selectedGoalForStats.title }}
            </h3>
          </div>

          <div class="space-y-6">
            <!-- تاریخ پیگیری بعدی (جدید) - تکرار اطلاعات برای تایید -->

            <!-- آمار استریک موفقیت -->
            <div class="flex justify-between items-center bg-green-50/70 p-4 rounded-xl border border-green-200/50 text-right shadow-md">
              <TrendingUp class="w-6 h-6 text-green-600 flex-shrink-0" />
              <div class="flex flex-col text-right flex-grow mx-4">
                <span class="font-bold text-lg text-green-800">بهترین استریک موفق</span>
                <span v-if="selectedGoalForStats.stats.max_streak_success.length > 0" class="text-sm text-green-700/80">
                          {{ toPersianDate(selectedGoalForStats.stats.max_streak_success.start) }} تا {{ toPersianDate(selectedGoalForStats.stats.max_streak_success.end) }}
                     </span>
                <span v-else class="text-sm text-green-700/80">تا کنون استریکی ثبت نشده است.</span>
              </div>
              <span class="font-extrabold text-3xl text-green-600 flex-shrink-0">
                     {{ selectedGoalForStats.stats.max_streak_success.length }}
                 </span>
            </div>

            <!-- آمار استریک شکست -->
            <div class="flex justify-between items-center bg-red-50/70 p-4 rounded-xl border border-red-200/50 text-right shadow-md">
              <TrendingDown class="w-6 h-6 text-red-600 flex-shrink-0" />
              <div class="flex flex-col text-right flex-grow mx-4">
                <span class="font-bold text-lg text-red-800">بیشترین شکست متوالی</span>
                <span v-if="selectedGoalForStats.stats.max_streak_fail.length > 0" class="text-sm text-red-700/80">
                         {{ toPersianDate(selectedGoalForStats.stats.max_streak_fail.start) }} تا {{ toPersianDate(selectedGoalForStats.stats.max_streak_fail.end) }}
                     </span>
                <span v-else class="text-sm text-red-700/80">عملکرد کامل بوده و شکستی ثبت نشده است.</span>
              </div>
              <span class="font-extrabold text-3xl text-red-600 flex-shrink-0">
                     {{ selectedGoalForStats.stats.max_streak_fail.length }}
                 </span>
            </div>
          </div>

          <div class="flex justify-end pt-6">
            <button @click="closeStatsModal"
                    class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition font-medium shadow-lg shadow-[var(--color-primary)]/30">
              بستن
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
// فرض می‌کنیم توابع toPersianDate و useGoalsStore وجود دارند
import { toPersianDate } from '@/utils/date'
import { useGoalsStore } from '@/stores/goals'

import {
  Pencil, Trash2, Plus, Clock, CheckCircle, Zap, Target, Loader2, X,
  TrendingUp, TrendingDown, Calendar, BarChart3, ListTree
} from 'lucide-vue-next'
import BaseSelect from "../UI/BaseSelect.vue";

// ---------------- Init Store and State ----------------
const store = useGoalsStore()
const emit = defineEmits(['onEdit', 'onAddTask'])

// ---------------- UX: جستجوی دیبونس + نرمال‌سازی فارسی ----------------
const search = ref('')
const searchDebounced = ref('')
let t = null
watch(search, (v) => {
  clearTimeout(t)
  // 300ms debounce
  t = setTimeout(() => (searchDebounced.value = v), 300)
})

/** نرمال‌سازی متن برای جستجوی دقیق‌تر فارسی */
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

// ---------------- برچسب‌ها و آیکن‌ها ----------------
const statusLabels = { pending: 'در انتظار', in_progress: 'در حال انجام', completed: 'تکمیل شده' }
const statusIcons = { pending: Clock, in_progress: Loader2, completed: CheckCircle }
const priorityLabels = { high: 'بالا', medium: 'متوسط', low: 'پایین' }
const priorityIcons = { high: Zap, medium: Clock, low: Target }
const priorityColorClasses = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500'
}

/** محاسبه درصد پیشرفت بر اساس داده‌های stats */
function calculateProgress(stats) {
  if (!stats || stats.total === 0 || stats.total === null || stats.total === undefined) return 0;
  return Math.round((stats.done / stats.total) * 100);
}

/** تعیین رنگ نوار پیشرفت بر اساس درصد */
function progressColor(percentage) {
  if (percentage >= 80) return '#10b981'; // green-500
  if (percentage >= 40) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

// ---------------- فیلتر اهداف (استفاده شده توسط BaseSelect) ----------------
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


/** اهداف فیلتر شده */
const filteredGoals = computed(() =>
    (store.goals || []).filter((g) => {
      const q = normFa(searchDebounced.value)
      const title = normFa(g.title || '')
      const desc  = normFa(g.description || '')

      const matchSearch   = !q || title.includes(q) || desc.includes(q)
      const matchStatus   = statusFilter.value === 'all' || g.status === statusFilter.value
      const matchPriority = priorityFilter.value === 'all' || g.priority === priorityFilter.value

      return matchSearch && matchStatus && matchPriority
    })
)

// ---------------- مودال حذف امن ----------------
const showConfirm = ref(false)
const selectedGoalId = ref(null)

/** نمایش مودال تایید حذف */
function confirmDelete(goalId) { selectedGoalId.value = goalId; showConfirm.value = true }

/** لغو فرآیند حذف */
function cancelDelete() { selectedGoalId.value = null; showConfirm.value = false }

/** ادامه فرآیند حذف (فراخوانی Store) */
async function proceedDelete() {
  if (selectedGoalId.value != null) {
    // 💡 فرض می‌کنیم store.removeGoal وجود دارد
    // await store.removeGoal(selectedGoalId.value)
  }
  cancelDelete()
}

// ---------------- مودال آمار (جدید) ----------------
const showStatsModal = ref(false)
const selectedGoalForStats = ref(null)

/** نمایش مودال آمار */
function openStatsModal(goal) {
  // ✅ اعمال منطق: فقط اگر children_count صفر باشد، اجازه باز شدن مودال داده می‌شود
  if (goal.children_count === 0 && goal.stats && goal.stats.total > 0) {
    selectedGoalForStats.value = goal
    showStatsModal.value = true
  }
}

/** بستن مودال آمار */
function closeStatsModal() {
  selectedGoalForStats.value = null
  showStatsModal.value = false
}
</script>

<style scoped>
/* ---------------- UI استایل‌های سفارشی برای Input و Select ---------------- */
.custom-input {
  color: var(--color-text);
  background-color: var(--color-background);
  padding: 0.875rem 1rem; /* p-3.5 */
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  outline: none;
  transition: all 0.2s;
}
.custom-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 30%, white);
}

/* ---------------- استایل‌های کارت جدید و انیمیشن ---------------- */
.goal-card-gradient {
  /* طراحی نهایی برای یک ظاهر جذاب‌تر */
  background: linear-gradient(135deg, var(--color-background), var(--color-background-soft));
  box-shadow: 0 12px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -3px rgba(0, 0, 0, 0.05); /* shadow-2xl base */
  border: 1px solid var(--color-border);
}
.hover\:shadow-3xl:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 15px 30px -5px rgba(0, 0, 0, 0.04);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 2;
}

/* ---------------- انیمیشن‌های عمومی ---------------- */
.fade-scale-enter-active,
.fade-scale-leave-active { transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
.fade-scale-enter-to,
.fade-scale-leave-from { opacity: 1; transform: scale(1) translateY(0); }

.card-bg { background-color: var(--color-background); }

/* استایل خاص برای Loader2 آیکن چرخان در وضعیت in_progress */
.text-yellow-500.lucide-loader-2 {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
