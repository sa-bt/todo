<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import Datepicker from 'vue3-persian-datetime-picker'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import { useNotificationStore } from '@/stores/notification'


const props = defineProps({
  show: { type: Boolean, default: false },
  goal: { type: Object, default: null },
  autoCloseOnSubmit: { type: Boolean, default: true }, // برای بستن خودکار بعد از submit
})
const emit = defineEmits(['close','taskCreated'])
const notification = useNotificationStore()

const modalEl = ref(null)
const datepickerRef = ref(null)

// form state
const selectedDate = ref(null)   // 'jYYYY/jMM/jDD'
const mode = ref('preset')       // 'preset' | 'custom'
const duration = ref(7)          // پیش‌فرض هفته
const amount = ref(1)            // برای custom
const loading = ref(false)

// every-other-day (alternate) state
const useAlternate = ref(false)          // فعال/غیرفعال
const alternateType = ref('odd')         // 'odd' | 'even'
/**
 * معنی:
 *  - odd  => از روز شروع (روز 1) حساب می‌کنیم: 1,3,5,...
 *  - even => از روز دوم حساب می‌کنیم: 2,4,6,...
 */

const durationOptions = [
  { label: 'امروز', value: 1 },
  { label: 'هفته', value: 7 },
  { label: 'ماه', value: 30 },
  { label: 'سال', value: 365 },
]

// disabled states
const numericDuration = computed(() => mode.value === 'preset' ? duration.value : Number(amount.value || 0))
const isSubmitDisabled = computed(() => {
  if (loading.value) return true
  if (!selectedDate.value) return true
  if (mode.value === 'custom' && (!amount.value || Number(amount.value) < 1)) return true
  return false
})

// reset on close/open
watch(() => props.show, async (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (!v) {
    selectedDate.value = null
    mode.value = 'preset'
    duration.value = 7
    amount.value = 1
    useAlternate.value = false
    alternateType.value = 'odd'
    window.removeEventListener('keydown', onKey)
  } else {
    await nextTick()
    datepickerRef.value?.$el?.querySelector('input')?.focus()
    window.addEventListener('keydown', onKey)
  }
})
onBeforeUnmount(()=> window.removeEventListener('keydown', onKey))

function onKey(e){
  if (e.key === 'Escape') emit('close')
  if (e.key === 'Tab' && modalEl.value){
    const focusables = modalEl.value.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [role="listbox"], [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
    const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'))
    if (!list.length) return
    const first = list[0], last = list[list.length - 1], active = document.activeElement
    if (e.shiftKey && active === first){ e.preventDefault(); last.focus() }
    else if (!e.shiftKey && active === last){ e.preventDefault(); first.focus() }
  }
}

function setShortcut(value) {
  mode.value = 'preset'
  duration.value = value
}

function displayPatternHint() {
  // نمایش بخش یک‌روزدرمیان فقط وقتی مدت > 1 باشد
  return numericDuration.value > 1
}

async function submitTask() {
  if (isSubmitDisabled.value) {
    if (!selectedDate.value) notification.setNotification('تاریخ شروع تسک را انتخاب کنید.', 'error')
    if (mode.value === 'custom' && Number(amount.value) < 1) notification.setNotification('مدت تسک باید بزرگتر از ۰ باشد.', 'error')
    return
  }

  const taskDuration = numericDuration.value
  // daily by default
  let pattern = 'daily'
  let step = 1
  let offset = 0

  if (displayPatternHint() && useAlternate.value) {
    pattern = alternateType.value === 'odd' ? 'alternate_odd' : 'alternate_even'
    step = 2
    offset = alternateType.value === 'even' ? 1 : 0
  }

  loading.value = true
  try {
    emit('taskCreated', {
      goal_id: props.goal.id,
      start_date: selectedDate.value, // jYYYY/jMM/jDD (Jalali)
      duration: taskDuration,         // days count
      // افزوده برای پشتیبانی «یک‌روزدرمیان»
      pattern,                        // 'daily' | 'alternate_odd' | 'alternate_even'
      step,                           // 1 یا 2
      offset,                         // 0 (فرد) یا 1 (زوج)
    })
    if (props.autoCloseOnSubmit) emit('close')
  } catch(error) {
    console.error('Failed to create task:', error)
    notification.setNotification('خطا در ثبت تسک!', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade-modal">
      <div
          v-if="props.show"
          class="fixed inset-0 bg-black/55 flex justify-center items-center z-50 p-4"
          role="dialog" aria-modal="true" aria-labelledby="task-modal-title"
          @click.self="emit('close')"
      >
        <div ref="modalEl"
             dir="rtl"
             class="card-bg rounded-2xl w-full max-w-md shadow-2xl border border-token overflow-hidden text-right">

          <!-- Header (sticky) -->
          <header class="sticky top-0 z-10 card-bg border-b border-token px-5 py-4">
            <h2 id="task-modal-title" class="text-lg font-extrabold text-[var(--color-heading)]">
              افزودن تسک به: {{ props.goal?.title }}
            </h2>
            <p class="text-xs text-text-secondary mt-1">
              تاریخ شروع را انتخاب کن و بازهٔ زمانی را تعیین کن.
            </p>
          </header>

          <!-- Body (scrollable) -->
          <section class="px-5 py-4 max-h-[min(75vh,560px)] overflow-y-auto space-y-5">
            <!-- Start date -->
            <div>
              <label class="block mb-1 font-medium text-[var(--color-text)]" for="task-start">تاریخ شروع</label>
              <Datepicker
                  id="task-start"
                  ref="datepickerRef"
                  v-model="selectedDate"
                  format="jYYYY/jMM/jDD"
                  type="date"
                  locale="fa"
                  :input-class="'w-full p-3 rounded-lg border border-token card-bg ring-focus text-[var(--color-text)]'"
              />
            </div>

            <!-- Duration mode -->
            <div>
              <label class="block mb-2 font-medium text-[var(--color-text)]">مدت تسک</label>
              <div class="flex gap-4 mb-3 text-sm">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="preset" v-model="mode" />
                  انتخاب از لیست
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="custom" v-model="mode" />
                  وارد کردن عدد
                </label>
              </div>

              <!-- Preset -->
              <div v-if="mode === 'preset'" class="space-y-3">
                <div class="flex flex-wrap gap-2 justify-start">
                  <button
                      v-for="opt in durationOptions"
                      :key="opt.value"
                      @click="setShortcut(opt.value)"
                      class="tap-target px-3 py-2 rounded-lg transition flex items-center gap-1 text-sm"
                      :class="{
                      'bg-[var(--color-primary)] text-white shadow-md': duration === opt.value,
                      'card-bg border border-token hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)]': duration !== opt.value
                    }"
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <BaseSelect v-model="duration" :options="durationOptions" placeholder="انتخاب بازه" />
              </div>

              <!-- Custom -->
              <div v-else class="space-y-2">
                <input
                    v-model.number="amount"
                    type="number"
                    min="1"
                    placeholder="تعداد روزها"
                    class="w-full p-3 rounded-lg border border-token card-bg ring-focus text-[var(--color-text)]"
                />
                <p class="text-xs text-text-secondary">
                  مثلا اگر ۱۰ وارد کنی، از تاریخ شروع به مدت ۱۰ روز تسک ساخته می‌شود.
                </p>
              </div>
            </div>

            <!-- Alternate (every other day) -->
            <div v-if="displayPatternHint()" class="surface border border-token rounded-xl p-4">
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold text-[var(--color-heading)]">الگوی ایجاد تسک</div>
                <div class="text-xs text-text-secondary">اختیاری</div>
              </div>

              <div class="mt-3 space-y-3">
                <label class="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" v-model="useAlternate" />
                  یک‌روزدرمیان (every other day)
                </label>

                <div v-if="useAlternate" class="pl-2 pr-1">
                  <div class="text-xs text-text-secondary mb-2">
                    شروع از تاریخ انتخابی به عنوان «روز ۱». انتخاب کن که روزهای <b>فرد</b> ساخته شوند یا <b>زوج</b>.
                  </div>
                  <div class="flex gap-4 text-sm">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="odd" v-model="alternateType" />
                      روزهای فرد (روز ۱، ۳، ۵، ...)
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="even" v-model="alternateType" />
                      روزهای زوج (روز ۲، ۴، ۶، ...)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Footer (sticky) -->
          <footer class="sticky bottom-0 z-10 card-bg border-t border-token px-5 py-4 flex items-center justify-end gap-3">
            <button
                @click="$emit('close')"
                class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] transition"
            >
              انصراف
            </button>
            <button
                @click="submitTask"
                :disabled="isSubmitDisabled"
                class="tap-target px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :aria-busy="loading ? 'true' : 'false'"
            >
              <span v-if="loading" class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full" aria-hidden="true"></span>
              ثبت
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity .2s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }
.fade-modal-enter-to, .fade-modal-leave-from { opacity: 1; }

.card-bg { background-color: var(--color-background); }
.ring-focus:focus { outline: 3px solid color-mix(in oklab, var(--color-primary) 40%, white); outline-offset: 2px; }

/* سطح ملایم برای باکس الگو */
.surface { background: color-mix(in oklab, var(--color-background) 92%, white); }
</style>
