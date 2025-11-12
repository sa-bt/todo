<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import BaseTextArea from '@/components/UI/BaseTextArea.vue'
import BaseCheckbox from '@/components/UI/BaseCheckbox.vue'
import { useGoalsStore } from '@/stores/goals'
import { useNotificationStore } from '@/stores/notification'

const goalsStore = useGoalsStore()
const notify = useNotificationStore()

// ✅ فهرست اهدافی که می‌تونن والد باشند
const parentGoals = ref([])

// فرم هدف فعلی
const form = ref({
  id: null,
  title: '',
  description: '',
  parent_id: null,
  tasks_count: 0, // از بک‌اند موقع ویرایش پر میشه
})

// ---- props & emits ----
const props = defineProps({
  show: { type: Boolean, default: false },
  editingGoal: { type: Object, default: null },
  autoCloseOnSave: { type: Boolean, default: true },
})
const emit = defineEmits(['close', 'save'])

// ---- state ----
const title = ref('')
const description = ref('')
const priority = ref('medium')
const status = ref('pending')
const parentId = ref(null)
const sendTaskReminder = ref(true)
const reminderTime = ref('09:00')
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

// ---- computed ----
// ✅ فقط اهداف والد واقعی یا بدون تسک نمایش داده می‌شوند
const filteredParentGoals = computed(() => {
  return parentGoals.value
    .filter((g) => !props.editingGoal || g.id !== props.editingGoal.id)
    .map((g) => ({ value: g.id, label: g.title }))
})

// ✅ اگر هدف تسک دارد، انتخاب والد غیرفعال شود
const isParentSelectDisabled = computed(() => {
  const g = props.editingGoal
  if (!g) return false
  return g.tasks_count > 0 || g.children_count > 0
})

// ---- lifecycle ----
onMounted(async () => {
  parentGoals.value = await goalsStore.fetchParentableGoals()
})

watch(
  () => props.editingGoal,
  (g) => {
    if (!g) {
      resetForm()
      return
    }
    title.value = g.title || ''
    description.value = g.description || ''
    priority.value = g.priority || 'medium'
    status.value = g.status || 'pending'
    parentId.value = g.parent_id ?? null
    sendTaskReminder.value = typeof g.send_task_reminder === 'boolean' ? g.send_task_reminder : true
    reminderTime.value = g.reminder_time ? String(g.reminder_time).slice(0, 5) : '09:00'
    form.value.tasks_count = g.tasks_count || 0
    showErrors.value = false
    errors.value = {}
  },
  { immediate: true }
)

function resetForm() {
  title.value = ''
  description.value = ''
  priority.value = 'medium'
  status.value = 'pending'
  parentId.value = null
  sendTaskReminder.value = true
  reminderTime.value = '09:00'
  form.value.tasks_count = 0
  errors.value = {}
  showErrors.value = false
}

// ---- validation ----
function validate() {
  const e = {}
  if (!title.value.trim()) e.title = 'عنوان الزامی است.'
  if (sendTaskReminder.value && !(reminderTime.value && /^\d{2}:\d{2}$/.test(reminderTime.value)))
    e.reminder_time = 'زمان یادآوری باید مثل 09:00 باشد.'
  if (parentId.value && props.editingGoal && parentId.value === props.editingGoal.id)
    e.parent_id = 'نمی‌توانید خودِ هدف را والد قرار دهید.'
  errors.value = e
  return Object.keys(e).length === 0
}

const isSaveDisabled = computed(() => saving.value || !title.value.trim())

// ---- submit ----
async function save() {
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
      reminder_time: sendTaskReminder.value ? reminderTime.value : null,
    }

    emit('save', payload)
    if (props.autoCloseOnSave) emit('close')
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
        @click.self="emit('close')"
      >
        <div
          class="card-bg w-full max-w-lg rounded-2xl border border-token shadow-2xl overflow-hidden text-right"
        >
          <!-- Header -->
          <header class="sticky top-0 card-bg border-b border-token px-5 py-4">
            <h2 class="text-xl font-extrabold text-[var(--color-heading)]">
              {{ editingGoal ? 'ویرایش هدف' : 'افزودن هدف جدید' }}
            </h2>
          </header>

          <!-- Body -->
          <section class="px-5 py-4 max-h-[min(75vh,640px)] overflow-y-auto space-y-4">
            <BaseInput
              name="title"
              label="عنوان هدف"
              v-model="title"
              placeholder="مثلاً: ورزش روزانه، مطالعه، یادگیری Vue"
            />
            <p v-if="showErrors && errors.title" class="text-red-600 text-xs mt-1">{{ errors.title }}</p>

            <BaseTextArea
              name="description"
              label="توضیحات"
              v-model="description"
              rows="3"
              placeholder="شرح کوتاه هدف..."
            />

            <!-- انتخاب والد -->
            <div>
              <BaseSelect
                v-if="!isParentSelectDisabled"
                name="parent_id"
                label="والد"
                v-model="parentId"
                :options="filteredParentGoals"
                placeholder="بدون والد"
              />
              <p v-else class="text-xs text-amber-600 mt-2">
                {{
                  editingGoal?.children_count > 0
                    ? 'این هدف دارای اهداف فرزند است و نمی‌تواند والد دیگری داشته باشد.'
                    : 'این هدف دارای تسک است و نمی‌تواند والد داشته باشد.'
                }}
              </p>
              <p v-if="showErrors && errors.parent_id" class="text-red-600 text-xs mt-1">
                {{ errors.parent_id }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseSelect name="status" label="وضعیت" v-model="status" :options="statusOptions" />
              <BaseSelect name="priority" label="اولویت" v-model="priority" :options="priorityOptions" />
            </div>

            <BaseCheckbox
              name="send_task_reminder"
              label="یادآوری روزانهٔ تسک‌های این هدف"
              description="در صورت فعال بودن، هر روز در زمان زیر به شما یادآوری می‌شود."
              v-model="sendTaskReminder"
            />

            <BaseInput
              name="reminder_time"
              label="زمان یادآوری"
              v-model="reminderTime"
              :disabled="!sendTaskReminder"
              type="time"
              dir="ltr"
            />
            <p v-if="showErrors && errors.reminder_time" class="text-red-600 text-xs mt-1">
              {{ errors.reminder_time }}
            </p>
          </section>

          <!-- Footer -->
          <footer class="sticky bottom-0 card-bg border-t border-token px-5 py-4 flex justify-end gap-2">
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
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.18s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}
.card-bg {
  background-color: var(--color-background);
}
:focus-visible {
  outline-color: color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
