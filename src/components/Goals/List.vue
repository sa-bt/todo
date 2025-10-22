<script setup>
import { ref, computed, watch } from 'vue'
import { toPersianDate } from '@/utils/date'
import { useGoalsStore } from '@/stores/goals'

import {
  Pencil, Trash2, Plus, Clock, CheckCircle, Zap, Target, Loader2, X,
  TrendingUp, TrendingDown, Calendar, BarChart3, ListTree, Info, Hash
} from 'lucide-vue-next'
import BaseSelect from "../UI/BaseSelect.vue";

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
  return s.toString().replace(/\u200c/g, ' ').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/\s+/g, ' ').trim().toLowerCase()
}

// ---------------- برچسب‌ها و آیکن‌ها ----------------
const statusLabels = { pending: 'در انتظار', in_progress: 'در حال انجام', completed: 'تکمیل شده' }
const statusIcons = { pending: Clock, in_progress: Loader2, completed: CheckCircle }
const priorityLabels = { high: 'بالا', medium: 'متوسط', low: 'پایین' }
const priorityIcons = { high: Zap, medium: Clock, low: Target }
const priorityColorClasses = {
  high: 'text-[var(--color-heading)]',
  medium: 'text-[var(--color-heading)]/80',
  low: 'text-[var(--color-heading)]/70'
}

/** درصد پیشرفت از stats */
function calculateProgress(stats) {
  if (!stats || stats.total === 0 || stats.total == null) return 0;
  return Math.round((stats.done / stats.total) * 100);
}
/** رنگ نوار پیشرفت (مشتق از توکن‌ها) */
function progressColor(percentage) {
  if (percentage >= 80) return 'color-mix(in oklab, var(--color-primary) 70%, white)';
  if (percentage >= 40) return 'color-mix(in oklab, var(--color-accent) 55%, white)';
  return 'color-mix(in oklab, var(--color-secondary) 60%, white)';
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
      const desc  = normFa(g.description || '')
      const matchSearch   = !q || title.includes(q) || desc.includes(q)
      const matchStatus   = statusFilter.value === 'all' || g.status === statusFilter.value
      const matchPriority = priorityFilter.value === 'all' || g.priority === priorityFilter.value
      return matchSearch && matchStatus && matchPriority
    })
)

// ---------------- کمک‌تابع رنج تاریخ برای مدال ----------------
function formatRange(start, end) {
  if (!start && !end) return '—'
  if (start && !end)  return toPersianDate(start)
  if (!start && end)  return toPersianDate(end)
  const s = new Date(start), e = new Date(end)
  const [from, to] = s <= e ? [start, end] : [end, start]
  return `${toPersianDate(from)} تا ${toPersianDate(to)}`
}

// ---------------- مودال آمار (اسکرول داخلی + هدر/فوتر چسبان) ----------------
const showStatsModal = ref(false)
const selectedGoalForStats = ref(null)
/** فقط اهداف برگ؛ وابسته به وجود/مقدار stats نیست */
function openStatsModal(goal) {
  if (goal.children_count === 0) {
    selectedGoalForStats.value = goal
    showStatsModal.value = true
    document.documentElement.style.overflow = 'hidden' // قفل اسکرول پس‌زمینه
  }
}
function closeStatsModal() {
  selectedGoalForStats.value = null
  showStatsModal.value = false
  document.documentElement.style.overflow = '' // آزاد کردن اسکرول
}

// ---------------- مودال حذف امن ----------------
const showConfirm = ref(false)
const selectedGoalId = ref(null)
function confirmDelete(goalId) { selectedGoalId.value = goalId; showConfirm.value = true }
function cancelDelete() { selectedGoalId.value = null; showConfirm.value = false }
async function proceedDelete() {
  if (selectedGoalId.value != null) {
    console.log(`حذف هدف با ID: ${selectedGoalId.value} - این باید به والد Emit شود.`)
    // emit('onDelete', selectedGoalId.value)
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
            aria-label="جستجو در اهداف"
        />
        <div class="flex flex-wrap gap-3 justify-end w-full md:w-auto">
          <BaseSelect v-model="statusFilter" :options="statusFilterOptions" name="status-filter" placeholder="همه وضعیت‌ها" class="w-full sm:w-48" />
          <BaseSelect v-model="priorityFilter" :options="priorityFilterOptions" name="priority-filter" placeholder="همه اولویت‌ها" class="w-full sm:w-48" />
        </div>
      </div>
    </div>

    <!-- لودر -->
    <div v-if="store.loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-[var(--color-text)]/70">در حال بارگذاری اهداف...</p>
    </div>

    <!-- خالی -->
    <div v-else-if="filteredGoals.length === 0" class="text-center py-12 card-bg border border-token rounded-3xl shadow-sm">
      <div class="mb-2 text-xl font-bold text-[var(--color-heading)]">چیزی مطابق با فیلترها پیدا نشد!</div>
      <p class="text-text-secondary text-sm mb-6">فیلترهای جستجو و وضعیت را بررسی کن یا هدف جدیدی بساز.</p>
      <button
          @click="$emit('onEdit', null)"
          class="tap-target px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold inline-flex items-center gap-2 transition transform hover:scale-[1.01] shadow-md shadow-[var(--color-primary)]/30">
        <Plus class="w-5 h-5" aria-hidden="true" /> افزودن هدف جدید
      </button>
    </div>

    <!-- لیست اهداف -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="goal-card p-7 rounded-3xl border border-token shadow-sm flex flex-col justify-between card-bg transition-all duration-200 hover:shadow-md"
      >
        <!-- روبان اولویت (مینیمال) -->
        <span v-if="goal.priority" class="ribbon">
          {{ priorityLabels[goal.priority] }}
        </span>

        <div class="space-y-4 text-right">
          <!-- عنوان، حلقه پیشرفت، وضعیت/اولویت -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-end gap-3">
              <h3 class="font-extrabold text-2xl leading-snug" :style="{color:'var(--color-heading)'}">
                {{ goal.title }}
              </h3>

              <!-- حلقه پیشرفت دایره‌ای (فقط برگ و وقتی stats دارد) -->
              <svg v-if="goal.children_count===0 && goal.stats" width="36" height="36" viewBox="0 0 36 36" class="shrink-0">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" stroke-width="4"/>
                <circle
                    cx="18" cy="18" r="15" fill="none"
                    :stroke="`color-mix(in oklab, var(--color-primary) ${Math.max(30, calculateProgress(goal.stats))}%, white)`"
                    stroke-width="4" stroke-linecap="round"
                    :stroke-dasharray="`${2*Math.PI*15}`"
                    :stroke-dashoffset="`${2*Math.PI*15 * (1 - (calculateProgress(goal.stats)/100))}`"
                    transform="rotate(-90 18 18)"
                />
                <text x="18" y="20" text-anchor="middle" font-size="10" fill="var(--color-heading)">
                  {{ calculateProgress(goal.stats) }}%
                </text>
              </svg>

              <span :class="priorityColorClasses[goal.priority]" class="flex-shrink-0">
                <component :is="priorityIcons[goal.priority]" class="w-5 h-5" aria-hidden="true" />
              </span>
            </div>

            <!-- چیپ‌ها (بدون خطوط) -->
            <div class="flex justify-end flex-wrap gap-2 text-xs pt-1 pb-1">
              <span class="chip chip-primary">
                <component :is="statusIcons[goal.status]" class="w-4 h-4" aria-hidden="true" />
                {{ statusLabels[goal.status] }}
              </span>

              <span v-if="goal.children_count > 0" class="chip chip-secondary">
                <ListTree class="w-3.5 h-3.5 inline-block ml-1"/>
                {{ goal.children_count }} زیرمجموعه
              </span>
              <span v-else-if="goal.parent_id" class="chip chip-secondary">
                <Target class="w-3.5 h-3.5 inline-block ml-1"/>
                هدف فرزند
              </span>

              <!-- تاریخ ایجاد کنار چیپ‌ها -->
              <span class="chip chip-neutral subtle">
                <Calendar class="w-3.5 h-3.5 inline-block ml-1"/>
                {{ toPersianDate(goal.created_at) }}
              </span>
            </div>
          </div>

          <!-- توضیحات -->
          <p v-if="goal.description" class="text-sm text-text-secondary leading-relaxed line-clamp-2 min-h-[40px]">
            {{ goal.description }}
          </p>

          <!-- پیشرفت (فقط برگ و وقتی stats دارد) -->
          <template v-if="goal.children_count === 0 && goal.stats">
            <div class="pt-3 mt-3">
              <div class="text-sm text-[var(--color-heading)] font-bold flex justify-between mb-2">
                <span>
                  پیشرفت:
                  <span class="font-extrabold">{{ goal.stats.done ?? 0 }}</span>
                  از
                  <span class="font-extrabold">{{ goal.stats.total ?? 0 }}</span>
                </span>
                <span>%{{ calculateProgress(goal.stats) }}</span>
              </div>
              <div class="progress-rtl w-full bg-[var(--color-border)] rounded-full h-2.5">
                <div class="bar h-2.5 rounded-full transition-all duration-500"
                     :style="{ width: `${calculateProgress(goal.stats)}%`, background: progressColor(calculateProgress(goal.stats)) }">
                </div>
              </div>
            </div>
          </template>

          <!-- پیام برای والد/بدون تسک -->
          <div v-else class="text-sm text-text-secondary/80 pt-3 mt-3">
            <template v-if="goal.children_count > 0">
              (این هدف اصلی است و آمار تسک‌ها برای {{ goal.children_count }} زیرمجموعه آن محاسبه نمی‌شود.)
            </template>
            <template v-else>
              (تسک یا آمار عملکردی برای این هدف ثبت نشده است.)
            </template>
          </div>
        </div>

        <!-- نوار اکشن پایین کارت با تولتیپ -->
        <div
            class="card-actions mt-4 pt-4 flex flex-wrap items-center gap-2 border-t border-token"
            :class="{ 'justify-center': goal.children_count > 0, 'justify-between': goal.children_count === 0 }"
        >
          <!-- ✅ CTA اصلی: فقط برای اهداف بدون فرزند -->
          <button
              v-if="goal.children_count === 0"
              @click="$emit('onAddTask', goal)"
              class="btn-ghost-primary tap-target flex items-center gap-1.5 has-tip"
              data-tip="افزودن تسک"
              aria-label="افزودن تسک"
          >
            <Plus class="w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline font-bold">تسک</span>
          </button>

          <!-- ✅ آیکن‌باتن‌ها -->
          <div class="flex items-center gap-2">
            <button
                @click="$emit('onEdit', goal)"
                class="icon-btn has-tip"
                data-tip="ویرایش"
                aria-label="ویرایش"
            >
              <Pencil class="w-4 h-4" />
            </button>

            <button
                v-if="goal.children_count === 0"
                @click="openStatsModal(goal)"
                class="icon-btn has-tip"
                data-tip="آمار"
                aria-label="آمار"
            >
              <BarChart3 class="w-4 h-4" />
            </button>

            <button
                @click="confirmDelete(goal.id)"
                class="icon-btn danger has-tip"
                data-tip="حذف"
                aria-label="حذف"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- مودال تایید حذف -->
  <Teleport to="body">
    <transition name="fade-scale">
      <div v-if="showConfirm" class="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="card-bg rounded-2xl p-8 w-full max-w-md shadow-2xl text-right border border-token">
          <h3 class="text-xl font-bold mb-4 text-[var(--color-heading)] flex items-center justify-end gap-2">
            <Trash2 class="w-6 h-6"/> تایید حذف
          </h3>
          <p class="mb-8 text-text-secondary leading-relaxed">آیا **واقعا** مطمئن هستید که می‌خواهید این هدف را حذف کنید؟ این اقدام قابل بازگشت نیست.</p>
          <div class="flex justify-end gap-3">
            <button @click="cancelDelete" class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-background-soft)] hover:bg-[var(--color-background)] text-[var(--color-text)] transition font-medium border border-token">
              لغو
            </button>
            <button @click="proceedDelete" class="tap-target px-5 py-2.5 rounded-xl btn-danger">
              حذف کن!
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- مودال آمار: مینیمال، فارسی، آیکن‌محور، Progress RTL -->
  <Teleport to="body">
    <transition name="fade-scale">
      <div
          v-if="showStatsModal && selectedGoalForStats"
          @click.self="closeStatsModal"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      >
        <div
            role="dialog" aria-modal="true"
            class="card-bg w-full max-w-3xl rounded-3xl border border-token shadow-xl
                 max-h-[min(92dvh,900px)] overflow-y-auto
                 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <!-- Header (sticky) -->
          <div class="sticky top-0 z-10 card-bg border-b border-token px-8 pt-6 pb-4">
            <div class="flex items-center justify-between">
              <button @click="closeStatsModal" class="p-2 rounded-full hover:bg-[var(--color-background-soft)] transition">
                <X class="w-6 h-6 text-text-secondary"/>
              </button>
              <div class="text-right">
                <h3 class="text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2 justify-end">
                  <BarChart3 class="w-6 h-6 text-[var(--color-secondary)]"/>
                  {{ selectedGoalForStats.title }}
                </h3>
                <div class="flex items-center justify-end gap-2 mt-2">
                  <span class="chip chip-primary subtle">
                    <component :is="statusIcons[selectedGoalForStats.status]" class="w-4 h-4" />
                    {{ statusLabels[selectedGoalForStats.status] }}
                  </span>
                  <span class="chip chip-secondary subtle">
                    <component :is="priorityIcons[selectedGoalForStats.priority]" class="w-4 h-4" />
                    {{ priorityLabels[selectedGoalForStats.priority] }}
                  </span>
                  <span v-if="selectedGoalForStats.parent_title" class="chip chip-neutral subtle">
                    <Target class="w-4 h-4" />
                    والد: {{ selectedGoalForStats.parent_title }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-8 py-6 space-y-8">
            <!-- ردیف 1: دونات بزرگ + KPI ها با آیکن -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <!-- دونات پیشرفت بزرگ -->
              <div class="flex items-center justify-center">
                <svg v-if="selectedGoalForStats.stats" width="160" height="160" viewBox="0 0 160 160" class="drop-shadow-sm">
                  <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-border)" stroke-width="14"/>
                  <circle
                      cx="80" cy="80" r="64" fill="none"
                      :stroke="`color-mix(in oklab, var(--color-primary) ${Math.max(35, calculateProgress(selectedGoalForStats.stats))}%, white)`"
                      stroke-width="14" stroke-linecap="round"
                      :stroke-dasharray="`${2*Math.PI*64}`"
                      :stroke-dashoffset="`${2*Math.PI*64 * (1 - (calculateProgress(selectedGoalForStats.stats)/100))}`"
                      transform="rotate(-90 80 80)"
                  />
                  <text x="80" y="86" text-anchor="middle" font-size="28" font-weight="800" fill="var(--color-heading)">
                    {{ calculateProgress(selectedGoalForStats.stats) }}%
                  </text>
                </svg>
                <div v-else class="text-sm text-text-secondary/70">آماری موجود نیست</div>
              </div>

              <!-- KPI کارت‌ها با آیکن -->
              <div class="md:col-span-2 grid grid-cols-2 gap-4">
                <div class="metric-card row accent-primary">
                  <CheckCircle class="w-5 h-5 text-[var(--color-primary)]"/>
                  <div class="ml-3">
                    <div class="metric-label">انجام‌شده</div>
                    <div class="metric-value text-2xl">{{ selectedGoalForStats.stats?.done ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-accent">
                  <ListTree class="w-5 h-5 text-[var(--color-accent)]"/>
                  <div class="ml-3">
                    <div class="metric-label">کل تسک‌ها</div>
                    <div class="metric-value text-2xl">{{ selectedGoalForStats.stats?.total ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-secondary">
                  <TrendingUp class="w-5 h-5 text-[var(--color-secondary)]"/>
                  <div class="ml-3">
                    <div class="metric-label">بهترین استریک موفق</div>
                    <div class="metric-value">{{ selectedGoalForStats.stats?.max_streak_success?.length ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-neutral">
                  <TrendingDown class="w-5 h-5 text-[var(--color-heading)]/70"/>
                  <div class="ml-3">
                    <div class="metric-label">بیشترین شکست متوالی</div>
                    <div class="metric-value">{{ selectedGoalForStats.stats?.max_streak_fail?.length ?? 0 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ردیف 2: Progress خطی RTL -->
            <div>
              <div class="flex items-center justify-between text-sm mb-2 text-[var(--color-heading)] font-bold">
                <span>پیشرفت کل</span>
                <span v-if="selectedGoalForStats.stats">%{{ calculateProgress(selectedGoalForStats.stats) }}</span>
              </div>
              <div class="progress-rtl w-full bg-[var(--color-border)] rounded-full h-3">
                <div class="bar h-3 rounded-full transition-all duration-500"
                     :style="{ width: `${calculateProgress(selectedGoalForStats.stats || {total:0,done:0})}%`, background: progressColor(calculateProgress(selectedGoalForStats.stats || {total:0,done:0})) }">
                </div>
              </div>
              <div class="text-xs text-text-secondary/80 mt-2">
                انجام‌شده: <b>{{ selectedGoalForStats.stats?.done ?? 0 }}</b> از <b>{{ selectedGoalForStats.stats?.total ?? 0 }}</b>
              </div>
            </div>

            <!-- ردیف 3: استریک‌ها با رنج تاریخ شمسی صحیح -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="metric-card row accent-primary">
                <TrendingUp class="w-6 h-6 text-[var(--color-primary)] flex-shrink-0"/>
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بهترین استریک موفق</span>
                  <span class="metric-sub">
                    {{ formatRange(selectedGoalForStats.stats?.max_streak_success?.start,
                      selectedGoalForStats.stats?.max_streak_success?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ selectedGoalForStats.stats?.max_streak_success?.length ?? 0 }}</span>
              </div>

              <div class="metric-card row accent-secondary">
                <TrendingDown class="w-6 h-6 text-[var(--color-secondary)] flex-shrink-0"/>
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بیشترین شکست متوالی</span>
                  <span class="metric-sub">
                    {{ formatRange(selectedGoalForStats.stats?.max_streak_fail?.start,
                      selectedGoalForStats.stats?.max_streak_fail?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ selectedGoalForStats.stats?.max_streak_fail?.length ?? 0 }}</span>
              </div>
            </div>

            <!-- ردیف 4: اطلاعات پایه با آیکن -->
            <div class="metric-grid">
              <div class="metric-card row">
                <Hash class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">شناسه</div>
                  <div class="metric-value">{{ selectedGoalForStats.id }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <Calendar class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">تاریخ ایجاد</div>
                  <div class="metric-value">{{ toPersianDate(selectedGoalForStats.created_at) }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <ListTree class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">زیرمجموعه‌ها</div>
                  <div class="metric-value">{{ selectedGoalForStats.children_count ?? 0 }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer (sticky) -->
          <div class="sticky bottom-0 card-bg border-t border-token px-8 py-5">
            <div class="flex justify-end">
              <button @click="closeStatsModal"
                      class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                             text-white transition font-medium shadow-md shadow-[var(--color-primary)]/25">
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
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
.goal-card{
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
}

/* بدون گرادیان/افکت‌های تند؛ فقط هاور خیلی ملایم */
.goal-card:hover{
  transform: translateY(-1px);
}

/* utility */
.line-clamp-2 { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; -webkit-line-clamp: 2; }
.card-bg { background-color: var(--color-background); }

/* ---------------- Ribbon (مینیمال) ---------------- */
.ribbon{
  position: absolute;
  top: 12px;
  right: -6px; /* RTL */
  padding: .3rem .6rem;
  font-size: .72rem; font-weight: 800;
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 8%, var(--color-background));
  border: 1px solid color-mix(in oklab, var(--color-primary) 22%, var(--color-border));
  border-radius: .5rem 0 0 .5rem;
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
.chip.subtle { opacity: 0.95 }
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
  display: flex; align-items: center;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
  padding-top: 1rem;
}
.btn-ghost-primary{
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 8%, var(--color-background));
  border: 1px solid color-mix(in oklab, var(--color-primary) 20%, var(--color-border));
  border-radius: .8rem; padding: .5rem .8rem; font-weight: 700;
  transition: .2s ease; box-shadow: 0 2px 8px -6px rgba(0,0,0,.1);
}
.btn-ghost-primary:hover{
  background: color-mix(in oklab, var(--color-primary) 12%, var(--color-background));
  transform: translateY(-1px);
}
.icon-btn{
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px; border: 1px solid color-mix(in oklab, var(--color-border) 80%, white);
  background: color-mix(in oklab, var(--color-background) 94%, white);
  color: var(--color-heading);
  transition: .18s ease; position: relative;
}
.icon-btn:hover{ background: color-mix(in oklab, var(--color-background-soft) 70%, white); transform: translateY(-1px); }
.icon-btn:focus-visible{ outline: 2px solid color-mix(in oklab, var(--color-primary) 35%, white); outline-offset: 2px; }
.icon-btn.danger{ color: color-mix(in oklab, var(--color-secondary) 60%, black); }

/* ---------------- تولتیپ سبک ---------------- */
.has-tip::after{
  content: attr(data-tip);
  position: absolute; bottom: calc(100% + 8px); right: 50%;
  transform: translateX(50%); /* RTL */
  white-space: nowrap; font-size: 11px; font-weight: 700;
  color: var(--color-heading);
  background: color-mix(in oklab, var(--color-background) 92%, white);
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, white);
  padding: .32rem .5rem; border-radius: .5rem; opacity: 0; pointer-events: none;
  box-shadow: 0 8px 18px -10px rgba(0, 0, 0, .18);
  transition: opacity .15s ease, transform .15s ease;
}
.has-tip:hover::after{
  opacity: 1; transform: translateX(50%) translateY(-2px);
}

/* ---------------- Panels / Metrics (Modal) ---------------- */
.panel { border: 1px solid color-mix(in oklab, var(--color-border) 82%, white); border-radius: 1rem; padding: 1.25rem; }
.panel-head { display: flex; align-items: center; justify-content: flex-end; gap: .5rem; margin-bottom: 1rem; }
.panel-title { font-weight: 800; color: var(--color-heading); }

.metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
@media (min-width: 768px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.metric-card {
  background: color-mix(in oklab, var(--color-background-soft) 90%, white);
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, white);
  border-radius: 0.875rem;
  padding: 1rem;
  display: flex; flex-direction: column; justify-content: center;
}
.metric-card.row { flex-direction: row; align-items: center; }
.metric-label { font-size: .75rem; color: color-mix(in oklab, var(--color-text) 78%, white); margin-bottom: .25rem; }
.metric-title { font-weight: 800; color: var(--color-heading); }
.metric-sub { font-size: .85rem; color: color-mix(in oklab, var(--color-text) 88%, white); }
.metric-value { font-weight: 800; color: var(--color-heading); font-size: 1.1rem; }
.metric-badge {
  font-weight: 900; padding: .25rem .7rem; border-radius: .75rem;
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
.progress-rtl { display: flex; border-radius: 999px; overflow: hidden; }
.progress-rtl > .bar { margin-left: auto; }

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
.fade-scale-leave-active { transition: all 0.28s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.98) translateY(8px); }
.fade-scale-enter-to,
.fade-scale-leave-from { opacity: 1; transform: scale(1) translateY(0); }

/* Loader2 چرخان */
.text-yellow-500.lucide-loader-2 { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* فallback برای مرورگرهای بدون dvh */
@supports not (height: 100dvh) {
  .max-h-\[min\(92dvh,900px\)\] { max-height: 92vh; }
}
</style>
