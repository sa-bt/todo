<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import BaseTextArea from '@/components/UI/BaseTextArea.vue'
import BaseCheckbox from '@/components/UI/BaseCheckbox.vue' // همان سوییچ سفارشی

const props = defineProps({
  show: { type: Boolean, default: false },
  editingGoal: { type: Object, default: null },
  goals: { type: Array, default: () => [] }, // تمام اهداف کاربر
  autoCloseOnSave: { type: Boolean, default: true }, // ✅ جدید

})
const emit = defineEmits(['close','save'])

// ---- state ----
const modalEl = ref(null)
const firstInput = ref(null)

const title = ref('')
const description = ref('')
const priority = ref('medium')          // 'low' | 'medium' | 'high'
const status = ref('pending')           // 'pending' | 'in_progress' | 'completed'
const parentId = ref(null)
const sendTaskReminder = ref(true)
const reminderTime = ref('09:00')       // HH:mm

const saving = ref(false)
const showErrors = ref(false)
const errors = ref({})

// ---- options ----
const priorityOptions = [
  { value: 'high', label: 'بالا' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'پایین' },
]
const statusOptions = [
  { value: 'pending', label: 'در انتظار' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل شده' },
]

/**
 * ✅ فقط اهدافی قابل انتخاب به‌عنوان «والد» هستند که هیچ تسکی ندارند.
 *   - از stats.total (که استور از API می‌آورد) استفاده می‌کنیم.
 *   - خود آیتم در حال ویرایش را حذف می‌کنیم.
 */
const parentOptions = computed(() => {
  const list = (props.goals || [])
      .filter(g => typeof g?.stats?.total === 'number' && g.stats.total === 0)
      .filter(g => !props.editingGoal || g.id !== props.editingGoal.id)

  return [{ value: null, label: 'بدون والد' }, ...list.map(g => ({ value: g.id, label: g.title }))]
})

// ---- lifecycle / prefill ----
function resetForm() {
  title.value = ''
  description.value = ''
  priority.value = 'medium'
  status.value = 'pending'
  parentId.value = null
  sendTaskReminder.value = true
  reminderTime.value = '09:00'
  errors.value = {}
  showErrors.value = false
}

watch(() => props.editingGoal, g => {
  if (!g) return resetForm()
  title.value = g.title || ''
  description.value = g.description || ''
  priority.value = g.priority || 'medium'
  status.value = g.status || 'pending'
  parentId.value = g.parent_id ?? null
  sendTaskReminder.value = typeof g.send_task_reminder === 'boolean' ? g.send_task_reminder : true
  reminderTime.value = g.reminder_time ? String(g.reminder_time).slice(0,5) : '09:00'
  errors.value = {}
  showErrors.value = false
}, { immediate: true })

// ---- accessibility: focus trap ----
function onKey(e){
  if (e.key === 'Escape') emit('close')
  if (e.key === 'Tab' && modalEl.value){
    const focusables = modalEl.value.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [role="listbox"], [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
    const list = Array.from(focusables)
    if (!list.length) return
    const first = list[0], last = list[list.length - 1], active = document.activeElement
    if (e.shiftKey && active === first){ e.preventDefault(); last.focus() }
    else if (!e.shiftKey && active === last){ e.preventDefault(); first.focus() }
  }
}
watch(() => props.show, async v => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (v) {
    await nextTick()
    firstInput.value?.focus()
    window.addEventListener('keydown', onKey)
  } else {
    window.removeEventListener('keydown', onKey)
  }
})
onMounted(() => { if (props.show) window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// ---- validation ----
function validate(){
  const e = {}
  if (!title.value || !title.value.trim()) e.title = 'عنوان الزامی است.'
  if (sendTaskReminder.value && !(reminderTime.value && /^\d{2}:\d{2}$/.test(reminderTime.value)))
    e.reminder_time = 'زمان باید مثل 09:00 باشد.'
  if (parentId.value && props.editingGoal && parentId.value === props.editingGoal.id)
    e.parent_id = 'نمی‌توانید خودِ هدف را والد قرار دهید.'
  errors.value = e
  return Object.keys(e).length === 0
}
const isSaveDisabled = computed(() => saving.value || !title.value.trim())

// ---- submit ----
async function save(){
  showErrors.value = true
  if (!validate()) return
  try {
    saving.value = true
    const payload = {
      title: title.value.trim(),
      description: description.value?.trim() || null,
      priority: priority.value,
      status: status.value,
      parent_id: parentId.value,
      send_task_reminder: !!sendTaskReminder.value,
      reminder_time: sendTaskReminder.value ? (reminderTime.value || null) : null,
    }
    emit('save', payload)
    if (props.autoCloseOnSave) {
      emit('close')
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade-modal">
      <div
          v-if="show"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog" aria-modal="true" aria-labelledby="goal-modal-title"
          @click.self="emit('close')"
      >
        <!-- Wrapper: RTL + scrollable body + sticky header/footer -->
        <div ref="modalEl"
             dir="rtl"
             class="card-bg w-full max-w-lg rounded-2xl border border-token shadow-2xl overflow-hidden text-right">

          <!-- Header (sticky) -->
          <header class="sticky top-0 z-10 card-bg border-b border-token px-5 py-4">
            <h2 id="goal-modal-title" class="text-xl font-extrabold text-[var(--color-heading)]">
              {{ editingGoal ? 'ویرایش هدف' : 'افزودن هدف جدید' }}
            </h2>
          </header>

          <!-- Body (scrollable) -->
          <section class="px-5 py-4 max-h-[min(75vh,640px)] overflow-y-auto space-y-4">
            <!-- Title -->
            <div>
              <label for="goal-title" class="block text-sm font-medium text-[var(--color-text)] mb-1">
                عنوان هدف <span class="text-red-500">*</span>
              </label>
              <BaseInput id="goal-title" ref="firstInput" v-model="title" placeholder="مثلاً: ورزش روزانه، مطالعه، یادگیری Vue" />
              <p v-if="showErrors && errors.title" class="text-red-600 text-xs mt-1">{{ errors.title }}</p>
            </div>

            <!-- Description -->
            <div>
              <label for="goal-desc" class="block text-sm font-medium text-[var(--color-text)] mb-1">توضیحات</label>
              <BaseTextArea id="goal-desc" v-model="description" rows="3" placeholder="شرح کوتاه هدف..." />
            </div>

            <!-- Parent -->
            <div>
              <label class="block text-sm font-medium text-[var(--color-text)] mb-1">والد</label>
              <BaseSelect v-model="parentId" :options="parentOptions" placeholder="بدون والد" />
              <p class="text-xs text-text-secondary mt-2">
                فقط اهدافی نمایش داده می‌شوند که هیچ تسکی ندارند.
              </p>
              <p v-if="showErrors && errors.parent_id" class="text-red-600 text-xs mt-1">{{ errors.parent_id }}</p>
            </div>

            <!-- Status & Priority -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text)] mb-1">وضعیت</label>
                <BaseSelect v-model="status" :options="statusOptions" placeholder="انتخاب وضعیت" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text)] mb-1">اولویت</label>
                <BaseSelect v-model="priority" :options="priorityOptions" placeholder="انتخاب اولویت" />
              </div>
            </div>

            <!-- Reminder -->
            <div class="space-y-3">
              <BaseCheckbox
                  v-model="sendTaskReminder"
                  name="goal-reminder"
                  label="یادآوری روزانهٔ تسک‌های این هدف"
                  description="در صورت فعال بودن، هر روز در زمان زیر به شما یادآوری می‌شود."
              />
              <div class="grid grid-cols-[1fr_auto] items-center gap-3">
                <small class="text-text-secondary">زمان یادآوری</small>
                <!-- time کنترل‌ها ذاتاً LTR هستند؛ برای نظم بهتر، همین بخش را LTR می‌گذاریم -->
                <div class="w-32" dir="ltr">
                  <BaseInput v-model="reminderTime" :disabled="!sendTaskReminder" placeholder="09:00" type="time" />
                </div>
              </div>
              <p v-if="showErrors && errors.reminder_time" class="text-red-600 text-xs">{{ errors.reminder_time }}</p>
            </div>
          </section>

          <!-- Footer (sticky) -->
          <footer class="sticky bottom-0 z-10 card-bg border-t border-token px-5 py-4 flex items-center justify-end gap-2">
            <button
                @click="emit('close')"
                class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background-soft)] hover:bg-[var(--color-background)] text-[var(--color-text)] transition"
            >
              انصراف
            </button>
            <button
                @click="save"
                :disabled="isSaveDisabled"
                class="tap-target px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'در حال ذخیره…' : 'ذخیره' }}
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
/* modal fade */
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity .18s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }
.fade-modal-enter-to, .fade-modal-leave-from { opacity: 1; }

/* theme helpers */
.card-bg { background-color: var(--color-background); }

/* fallback focus ring */
:focus-visible {
  outline-color: color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
