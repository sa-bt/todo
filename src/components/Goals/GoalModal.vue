<script setup>
import { ref, watch, computed, defineProps, defineEmits, nextTick, onBeforeUnmount } from 'vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'

const props = defineProps({
  show: Boolean,
  editingGoal: Object,
  priorities: Array,
  statuses: Array,
  goals: Array
})
const emit = defineEmits(['close','save'])

const modalEl = ref(null)
const firstInput = ref(null)

const title = ref('')
const description = ref('')
const priority = ref('medium')
const status = ref('pending')
const parentId = ref(null)

watch(() => props.editingGoal, (goal) => {
  if (goal) {
    title.value = goal.title
    description.value = goal.description
    priority.value = goal.priority
    status.value = goal.status
    parentId.value = goal.parent_id
  } else {
    title.value = ''
    description.value = ''
    priority.value = 'medium'
    status.value = 'pending'
    parentId.value = null
  }
}, { immediate: true })

// Parent options filtering (حذف خود هدف از لیست والدها هنگام ویرایش)
const parentOptions = computed(() => {
  let options = props.goals || [];
  if (props.editingGoal) {
    // فیلتر کردن خود هدفی که در حال ویرایش است
    options = options.filter(g => g.id !== props.editingGoal.id);
  }
  // فیلتر کردن اهدافی که نباید والد باشند (مثلاً فرزندان خود هدف) را باید در Store هندل کنید
  return [{ value: null, label: 'بدون والد' }, ...options.map(g => ({ value: g.id, label: g.title })) ];
})

const priorityOptions = computed(() => (props.priorities||[]).map(p => ({ value: p.value, label: p.label })))
const statusOptions = computed(() => (props.statuses||[]).map(s => ({ value: s.value, label: s.label })))

const parentTitle = computed(() => {
  const found = parentOptions.value.find(o => o.value === parentId.value)
  return found ? found.label : 'بدون والد'
})

// ✅ COMPUTED جدید برای اعتبارسنجی
const isSaveDisabled = computed(() => !title.value.trim())

function save() {
  if (isSaveDisabled.value) return; // جلوگیری از ذخیره با عنوان خالی
  emit('save', {
    title: title.value,
    description: description.value,
    priority: priority.value,
    status: status.value,
    parent_id: parentId.value
  })
}

/* Trap فوکِس + ESC */
function onKey(e){
  if (e.key === 'Escape') emit('close')
  if (e.key === 'Tab' && modalEl.value){
    const focusables = modalEl.value.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [role="listbox"], [tabindex]:not([tabindex="-1"]):not([disabled])')
    const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'))
    if (!list.length) return
    const first = list[0], last = list[list.length - 1], active = document.activeElement
    if (e.shiftKey && active === first){ e.preventDefault(); last.focus() }
    else if (!e.shiftKey && active === last){ e.preventDefault(); first.focus() }
  }
}
watch(() => props.show, async (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (v) { await nextTick(); firstInput.value?.focus(); window.addEventListener('keydown', onKey) }
  else { window.removeEventListener('keydown', onKey) }
})
onBeforeUnmount(()=> window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <transition name="fade-modal">
      <div v-if="show" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
           role="dialog" aria-modal="true" aria-labelledby="goal-modal-title" @click.self="emit('close')">
        <div ref="modalEl" class="card-bg rounded-2xl p-6 w-full max-w-md shadow-xl border border-token text-right">
          <h2 id="goal-modal-title" class="text-lg font-bold mb-4 text-[var(--color-heading)]">
            {{ editingGoal ? 'ویرایش هدف' : 'افزودن هدف' }}
          </h2>

          <label class="sr-only" for="goal-title">عنوان هدف</label>
          <input id="goal-title" ref="firstInput" v-model="title" type="text" placeholder="عنوان هدف..."
                 class="w-full p-3 rounded-lg border border-token card-bg mb-3 text-right ring-focus text-[var(--color-text)]" />

          <label class="sr-only" for="goal-desc">توضیحات هدف</label>
          <textarea id="goal-desc" v-model="description" rows="3" placeholder="توضیحات هدف..."
                    class="w-full p-3 rounded-lg border border-token card-bg mb-3 text-right ring-focus text-[var(--color-text)]"></textarea>

          <div class="mb-2">
            <BaseSelect v-model="parentId" :options="parentOptions" placeholder="بدون والد" />
            <div class="text-xs text-text-secondary mt-2">
              والد انتخاب شده:
              <span
                  class="font-semibold"
                  :style="{ color: parentId ? 'var(--color-secondary)' : 'var(--color-text-secondary)' }"
              >
                {{ parentTitle }}
              </span>
            </div>
          </div>

          <div class="mb-3">
            <BaseSelect v-model="priority" :options="priorityOptions" placeholder="اولویت" />
          </div>

          <div class="mb-3">
            <BaseSelect v-model="status" :options="statusOptions" placeholder="وضعیت" />
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button @click="emit('close')" class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] transition">انصراف</button>
            <button
                @click="save"
                :disabled="isSaveDisabled"
                class="tap-target px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity .2s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }
.fade-modal-enter-to, .fade-modal-leave-from { opacity: 1; }
/* اضافه کردن کلاس های رنگی برای سازگاری بهتر با طرح دارک/لایت */
.card-bg { background-color: var(--color-background); }
.ring-focus:focus {
  outline: 3px solid color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
