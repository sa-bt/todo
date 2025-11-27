<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import Datepicker from 'vue3-persian-datetime-picker'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import { useNotificationStore } from '@/stores/notification'
import { Calendar, Repeat2, AlertCircle, Clock, Target, X, CheckCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  goal: { type: Object, default: null },
  autoCloseOnSubmit: { type: Boolean, default: true },
})
const emit = defineEmits(['close','save'])
const notification = useNotificationStore()

const modalEl = ref(null)
const datepickerRef = ref(null)

const selectedDate = ref(null)
const mode = ref('preset')
const duration = ref(7)
const amount = ref(1)
const loading = ref(false)

// --- State جدید برای کنترل الگوی تکرار ---
const patternMode = ref('daily') // 'daily', 'alternate', 'weekly'
const alternateType = ref('odd') // 'odd', 'even'
const selectedDays = ref([]) 

const durationOptions = [
  { label: 'امروز', value: 1 },
  { label: 'هفته (۷ روز)', value: 7 },
  { label: 'ماه (۳۰ روز)', value: 30 },
  { label: 'سال (۳۶۵ روز)', value: 365 },
]

const dayMap = [
    { value: 'SA', label: 'ش' }, { value: 'SU', label: 'ی' }, { value: 'MO', label: 'د' },
    { value: 'TU', label: 'س' }, { value: 'WE', label: 'چ' }, { value: 'TH', label: 'پ' },
    { value: 'FR', label: 'ج' }
]

const numericDuration = computed(() => mode.value === 'preset' ? duration.value : Number(amount.value || 0))

// بخش الگو فقط زمانی نمایش داده می‌شود که بازه بیشتر از ۱ روز باشد
const displayPatternSection = computed(() => numericDuration.value > 1)

const isSubmitDisabled = computed(() => {
  if (loading.value) return true
  if (!selectedDate.value) return true
  if (mode.value === 'custom' && (!amount.value || Number(amount.value) < 1)) return true
  
  // اعتبارسنجی: اگر الگوی هفتگی فعال باشد، حداقل یک روز باید انتخاب شود
  if (patternMode.value === 'weekly' && selectedDays.value.length === 0) return true
  
  return false
})

watch(() => props.show, async (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (!v) {
    // ریست کامل حالت‌ها هنگام بسته شدن
    selectedDate.value = null
    mode.value = 'preset'
    duration.value = 7
    amount.value = 1
    patternMode.value = 'daily' // ریست الگوی تکرار
    alternateType.value = 'odd'
    selectedDays.value = [] // ریست روزهای هفته
    
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

// تابع جدید: تغییر وضعیت انتخاب روز
function toggleDay(day) {
    const index = selectedDays.value.indexOf(day)
    if (index > -1) {
        selectedDays.value.splice(index, 1)
    } else {
        selectedDays.value.push(day)
    }
}

async function submitTask() {
  if (isSubmitDisabled.value) {
    // ... (نمایش نوتیفیکیشن‌های اعتبارسنجی)
    if (!selectedDate.value)
      notification.setNotification({ message: 'تاریخ شروع تسک را انتخاب کنید.', type: 'error' })
    if (mode.value === 'custom' && Number(amount.value) < 1)
      notification.setNotification({ message: 'مدت تسک باید بزرگتر از ۰ باشد.', type: 'error' })
    if (patternMode.value === 'weekly' && selectedDays.value.length === 0)
      notification.setNotification({ message: 'در الگوی هفتگی، حداقل یک روز هفته باید انتخاب شود.', type: 'error' })
    return
  }

  const taskDuration = numericDuration.value
  
  // ✅ Payload پیش‌فرض (روزانه)
  let payload = {
      goal_id: props.goal.id,
      start_date: selectedDate.value,
      duration: taskDuration,
      pattern: 'daily',
      step: 1,
      offset: 0,
      days_of_week: [],
  }

  // ✅ تنظیم Payload بر اساس patternMode
  if (displayPatternSection.value) {
      if (patternMode.value === 'weekly') {
        payload.pattern = 'weekly'
        payload.days_of_week = selectedDays.value
        // در الگوی هفتگی، step و offset نادیده گرفته می‌شوند.
      } else if (patternMode.value === 'alternate') {
        payload.pattern = alternateType.value === 'odd' ? 'alternate_odd' : 'alternate_even'
        payload.step = 2
        payload.offset = alternateType.value === 'even' ? 1 : 0
      }
      // اگر patternMode === 'daily' بود، payload همان مقدار پیش‌فرض را حفظ می‌کند.
  }


  loading.value = true
  try {
    emit('save', payload) 
    if (props.autoCloseOnSubmit) emit('close')
  } catch(error) {
    console.error('Failed to create task:', error)
    notification.setNotification({ message: 'خطا در ثبت تسک!', type: 'error' })
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

          <header class="sticky top-0 z-10 card-bg border-b border-token px-6 py-4 flex items-center justify-between">
            <h2 id="task-modal-title" class="text-xl font-extrabold text-[var(--color-heading)] flex items-center gap-2 justify-end">
                <Repeat2 class="w-5 h-5 text-[var(--color-primary)]"/>
                تسک جدید برای: {{ props.goal?.title }}
            </h2>
            <button @click="$emit('close')" class="p-1 rounded-full text-text-secondary hover:text-[var(--color-heading)] transition">
                <X class="w-6 h-6" />
            </button>
          </header>

          <section class="px-6 py-5 max-h-[min(75vh,560px)] overflow-y-auto space-y-6">
            
            <div>
              <label class="block mb-2 font-medium text-[var(--color-text)] flex items-center gap-2">
                 <Calendar class="w-4 h-4 text-[var(--color-primary)]"/> تاریخ شروع
              </label>
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

            <div class="border border-token rounded-xl p-4 bg-[var(--color-background-soft)] space-y-4">
               <div class="text-base font-semibold text-[var(--color-heading)] flex items-center gap-2">
                    <Clock class="w-4 h-4 text-[var(--color-primary)]"/> مدت زمان تسک
                </div>

              <div class="flex gap-4 mb-3 text-sm">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="preset" v-model="mode" /> انتخاب از لیست
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="custom" v-model="mode" /> وارد کردن عدد
                </label>
              </div>

              <div v-if="mode === 'preset'" class="space-y-3">
                <div class="flex flex-wrap gap-2 justify-start">
                  <button
                      v-for="opt in durationOptions"
                      :key="opt.value"
                      @click="setShortcut(opt.value)"
                      class="tap-target px-3 py-2 rounded-lg transition flex items-center gap-1 text-sm font-medium"
                      :class="{
                        'bg-[var(--color-primary)] text-white shadow-md': duration === opt.value,
                        'card-bg border border-token hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)]': duration !== opt.value
                      }"
                  >
                    {{ opt.label }}
                  </button>
                </div>

                <BaseSelect
                    name="duration"
                    label="مدت زمان"
                    v-model="duration"
                    :options="durationOptions"
                    placeholder="انتخاب بازه"
                />
              </div>

              <div v-else class="space-y-2">
                <input
                    v-model.number="amount"
                    type="number"
                    min="1"
                    placeholder="تعداد روزها"
                    class="w-full p-3 rounded-lg border border-token card-bg ring-focus text-[var(--color-text)]"
                />
                <p class="text-xs text-text-secondary">
                  مثلا اگر **۱۰** وارد کنی، از تاریخ شروع به مدت **۱۰ روز** تسک ساخته می‌شود.
                </p>
              </div>
            </div>

            <div v-if="displayPatternSection" class="surface border border-token rounded-xl p-4 space-y-4">
              <div class="text-base font-semibold text-[var(--color-heading)] flex items-center gap-2">
                <Target class="w-4 h-4 text-[var(--color-primary)]"/> الگوی تکرار در این بازه
              </div>

              <div class="flex flex-col gap-3 text-sm border-b border-token pb-3">
                <label class="inline-flex items-center gap-2 cursor-pointer font-medium p-1 rounded transition hover:bg-[var(--color-background-soft-hover)]">
                  <input type="radio" value="daily" v-model="patternMode" />
                  روزانه (هر روز تسک ایجاد شود)
                </label>

                <label class="inline-flex items-center gap-2 cursor-pointer font-medium p-1 rounded transition hover:bg-[var(--color-background-soft-hover)]">
                  <input type="radio" value="alternate" v-model="patternMode" />
                  یک‌روزدرمیان (Every other day)
                </label>

                <label class="inline-flex items-center gap-2 cursor-pointer font-medium p-1 rounded transition hover:bg-[var(--color-background-soft-hover)]">
                  <input type="radio" value="weekly" v-model="patternMode" />
                  فقط در روزهای خاص هفته
                </label>
              </div>

              <div class="pt-2">
                  <div v-if="patternMode === 'alternate'" class="pl-2 pr-1 p-3 rounded-lg border border-token bg-white/5">
                    <div class="text-xs text-text-secondary mb-3">
                      شروع از تاریخ انتخابی به عنوان **«روز ۱»**. انتخاب کن که تسک‌ها در روزهای **فرد** ساخته شوند یا **زوج**.
                    </div>
                    <div class="flex gap-4 text-sm">
                      <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="odd" v-model="alternateType" /> روزهای فرد
                      </label>
                      <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="even" v-model="alternateType" /> روزهای زوج
                      </label>
                    </div>
                  </div>

                  <div v-else-if="patternMode === 'weekly'" class="mt-3 space-y-3">
                    <label class="text-sm font-medium mb-2 block text-[var(--color-text)]">
                        روزهای مورد نظر را انتخاب کنید:
                    </label>
                    <div class="flex flex-wrap gap-2 justify-start">
                        <button 
                            v-for="day in dayMap" 
                            :key="day.value"
                            @click="toggleDay(day.value)"
                            :aria-pressed="selectedDays.includes(day.value)"
                            class="tap-target w-8 h-8 rounded-full font-medium transition text-sm flex items-center justify-center border"
                            :class="{ 
                                'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md': selectedDays.includes(day.value), 
                                'bg-white/10 border-token hover:bg-white/20 text-[var(--color-text)]': !selectedDays.includes(day.value)
                            }"
                        >
                            {{ day.label }}
                        </button>
                    </div>
                    <p v-if="isSubmitDisabled && selectedDays.length === 0" class="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle class="w-4 h-4"/> در الگوی هفتگی، حداقل یک روز هفته باید انتخاب شود.
                    </p>
                  </div>
                  
              </div>
            </div>
          </section>

          <footer class="sticky bottom-0 z-10 card-bg border-t border-token px-6 py-4 flex items-center justify-end gap-3">
            <button
                @click="$emit('close')"
                class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] transition font-medium"
            >
              انصراف
            </button>
            <button
                @click="submitTask"
                :disabled="isSubmitDisabled"
                class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 font-medium"
                :aria-busy="loading ? 'true' : 'false'"
            >
              <span v-if="loading" class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full" aria-hidden="true"></span>
              ثبت نهایی
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
.surface { background: color-mix(in oklab, var(--color-background) 92%, white); }

/* برای دکمه های دایره ای روزها */
.tap-target.w-8 { min-width: 32px; }
</style>