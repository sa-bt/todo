<script setup>
import { ref, computed, watch, defineProps } from 'vue'
import { toPersianDate } from '@/utils/date'
import { Pencil, Trash2, Plus, Clock, CheckCircle, Zap, Target } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/toast'

const notification = useNotificationStore()

const props = defineProps({
  goals: { type: Array, default: () => [] },
  onEdit: Function,
  onDelete: Function,
  onAddTask: Function,
})

// ---------------- UX: جستجوی دیبونس + نرمال‌سازی فارسی ----------------
const search = ref('')
const searchDebounced = ref('')
let t = null
watch(search, (v) => {
  clearTimeout(t)
  t = setTimeout(() => (searchDebounced.value = v), 250)
})
function normFa(s = '') {
  return s
      .toString()
      .replace(/\u200c/g, ' ') // ZWNJ → space
      .replace(/[ي]/g, 'ی')    // Arabic Yeh → Persian
      .replace(/[ك]/g, 'ک')    // Arabic Kaf → Persian
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
}

// ---------------- برچسب‌ها و آیکن‌ها ----------------
const statusLabels = { pending: 'در انتظار', in_progress: 'در حال انجام', completed: 'تکمیل شده' }
const statusIcons = { pending: Clock, in_progress: Zap, completed: CheckCircle }
const priorityLabels = { high: 'بالا', medium: 'متوسط', low: 'پایین' }
const priorityIcons = { high: Zap, medium: Clock, low: Target } // ✅ آیکن‌ها کمی منطقی‌تر شدند

// ---------------- فیلتر اهداف ----------------
const statusFilter = ref('all')
const priorityFilter = ref('all')
const filteredGoals = computed(() =>
    (props.goals || []).filter((g) => {
      const q = normFa(searchDebounced.value)
      const title = normFa(g.title || '')
      const desc  = normFa(g.description || '')
      const matchSearch   = !q || title.includes(q) || desc.includes(q)
      const matchStatus   = statusFilter.value === 'all' || g.status === statusFilter.value
      const matchPriority = priorityFilter.value === 'all' || g.priority === priorityFilter.value
      return matchSearch && matchStatus && matchPriority
    })
)

// ---------------- حذف امن ----------------
const showConfirm = ref(false)
const selectedGoalId = ref(null)
function confirmDelete(goalId) { selectedGoalId.value = goalId; showConfirm.value = true }
function cancelDelete() { selectedGoalId.value = null; showConfirm.value = false }
async function proceedDelete() {
  if (selectedGoalId.value != null) {
    // فرض می‌شود onDelete یک عملیات Asynchronous (API Call) است
    await props.onDelete?.(selectedGoalId.value)
    notification.setNotification('هدف با موفقیت حذف شد', 'success')
  }
  cancelDelete()
}
</script>

<template>
  <div class="card-bg p-6 rounded-2xl border border-token">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <input
          v-model="search"
          type="text"
          placeholder="🔍 جستجو در اهداف..."
          class="w-full md:w-1/3 p-3 rounded-xl border border-token card-bg text-right ring-focus text-[var(--color-text)]"
      />
      <div class="flex flex-wrap gap-3 justify-end">
        <select v-model="statusFilter" class="p-3 rounded-xl border border-token card-bg text-sm ring-focus text-[var(--color-text)]">
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">{{ statusLabels.pending }}</option>
          <option value="in_progress">{{ statusLabels.in_progress }}</option>
          <option value="completed">{{ statusLabels.completed }}</option>
        </select>
        <select v-model="priorityFilter" class="p-3 rounded-xl border border-token card-bg text-sm ring-focus text-[var(--color-text)]">
          <option value="all">همه اولویت‌ها</option>
          <option value="high">{{ priorityLabels.high }}</option>
          <option value="medium">{{ priorityLabels.medium }}</option>
          <option value="low">{{ priorityLabels.low }}</option>
        </select>
      </div>
    </div>

    <div v-if="filteredGoals.length === 0" class="text-center py-8 card-bg border border-token rounded-2xl">
      <div class="mb-2 font-semibold text-[var(--color-heading)]">چیزی پیدا نشد</div>
      <p class="text-text-secondary text-sm mb-4">عبارت دیگری امتحان کن یا هدف جدید بساز.</p>
      <button @click="props.onEdit?.(null)"
              class="tap-target px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white inline-flex items-center gap-2">
        <Plus class="w-4 h-4" aria-hidden="true" /> افزودن هدف
      </button>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="relative p-6 rounded-2xl border border-token shadow-sm flex flex-col justify-between card-bg transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
      >
        <div class="space-y-3 text-right">
          <h3 class="font-semibold flex items-center gap-2 justify-end text-lg" :style="{color:'var(--color-heading)'}">
            <component :is="priorityIcons[goal.priority]" class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
            {{ goal.title }}
          </h3>

          <div class="flex justify-end">
            <span
                v-if="goal.children && goal.children.length > 0"
                class="px-2 py-0.5 text-xs rounded-full font-medium"
                :style="{background:'color-mix(in oklab, var(--color-secondary) 16%, white)', color:'var(--color-secondary)'}"
            >
              والد ({{ goal.children.length }} زیرهدف)
            </span>
          </div>


          <p class="text-sm text-text-secondary leading-relaxed">
            {{ goal.description }}
          </p>

          <div class="flex flex-wrap justify-end gap-3 text-xs pt-2">
            <span class="flex items-center gap-1 font-medium px-2 py-1 rounded-full"
                  :style="{background:'color-mix(in oklab, var(--color-border) 40%, white)', color:'var(--color-text)'}">
              <component :is="statusIcons[goal.status]" class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
              {{ statusLabels[goal.status] }}
            </span>
            <span class="flex items-center gap-1 font-medium px-2 py-1 rounded-full"
                  :style="{background:'color-mix(in oklab, var(--color-border) 40%, white)', color:'var(--color-text)'}">
              <Zap class="w-4 h-4" aria-hidden="true" :class="{'text-red-500': goal.priority === 'high', 'text-yellow-500': goal.priority === 'medium', 'text-green-500': goal.priority === 'low'}" />
              {{ priorityLabels[goal.priority] }}
            </span>
          </div>

          <p class="text-xs text-text-secondary/70 pt-2">
            📅 ایجاد: {{ toPersianDate(goal.created_at) }}
          </p>
          <p class="text-xs text-text-secondary/70" v-if="goal.updated_at">
            ✏️ آخرین تغییر: {{ toPersianDate(goal.updated_at) }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3 justify-end mt-5 pt-3 border-t border-token">
          <button @click="props.onEdit?.(goal)"
                  class="tap-target flex items-center gap-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition text-sm font-medium">
            <Pencil class="w-4 h-4" aria-hidden="true" />
            <span>ویرایش</span>
          </button>

          <button v-if="!goal.children || goal.children.length === 0"
                  @click="confirmDelete(goal.id)"
                  class="tap-target flex items-center gap-1 text-[var(--color-secondary)] hover:text-red-600 transition text-sm font-medium">
            <Trash2 class="w-4 h-4" aria-hidden="true" />
            <span>حذف</span>
          </button>
          <div v-else class="flex items-center text-xs text-text-secondary/60 cursor-not-allowed" title="حذف اهداف دارای زیرمجموعه مجاز نیست.">
            <Trash2 class="w-4 h-4 ml-1" aria-hidden="true" />
            (حذف ممنوع)
          </div>

          <button @click="props.onAddTask?.(goal)"
                  class="tap-target flex items-center gap-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition text-sm font-medium">
            <Plus class="w-4 h-4" aria-hidden="true" />
            <span>تسک</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <transition name="fade-scale">
      <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div class="card-bg rounded-2xl p-6 w-11/12 max-w-md shadow-lg text-right border border-token">
          <h3 class="text-lg font-semibold mb-4 text-[var(--color-heading)]">تایید حذف</h3>
          <p class="mb-6 text-text-secondary">آیا از حذف این هدف مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
          <div class="flex justify-end gap-3">
            <button @click="cancelDelete" class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] transition">
              لغو
            </button>
            <button @click="proceedDelete" class="tap-target px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">
              حذف
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.9); }
.fade-scale-enter-to,
.fade-scale-leave-from { opacity: 1; transform: scale(1); }
.card-bg { background-color: var(--color-background); }
.ring-focus:focus {
  outline: 3px solid color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
