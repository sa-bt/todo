<script setup>
import { ref, watch, computed, defineProps, defineEmits, nextTick, onBeforeUnmount } from 'vue'
import Datepicker from 'vue3-persian-datetime-picker'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import { useNotificationStore } from '@/stores/toast'

const props = defineProps({ show: Boolean, goal: Object })
const emit = defineEmits(['close','taskCreated'])
const notification = useNotificationStore()

const modalEl = ref(null)
const datepickerRef = ref(null) // ✅ رفرنس جدید به Datepicker

const selectedDate = ref(null)
const mode = ref('preset')
const duration = ref(1)
const amount = ref(1)
const loading = ref(false)

const durationOptions = [
  { label: 'امروز', value: 1 }, { label: 'هفته', value: 7 },
  { label: 'ماه', value: 30 },  { label: 'سال', value: 365 },
]

// ✅ Computed برای فعال/غیرفعال کردن دکمه ثبت
const isSubmitDisabled = computed(() =>
    !selectedDate.value || loading.value || (mode.value === 'custom' && amount.value < 1)
);

watch(() => props.show, async (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (!v) {
    selectedDate.value = null;
    mode.value = 'preset';
    duration.value = 1;
    amount.value = 1;
    window.removeEventListener('keydown', onKey);
  } else {
    await nextTick();
    // ✅ فوکوس روی Datepicker
    datepickerRef.value?.$el.querySelector('input')?.focus();
    window.addEventListener('keydown', onKey)
  }
})
onBeforeUnmount(()=> window.removeEventListener('keydown', onKey))

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

function setShortcut(value) {
  mode.value = 'preset';
  duration.value = value
}

async function submitTask() {
  if (isSubmitDisabled.value) {
    if (!selectedDate.value) notification.setNotification('تاریخ شروع تسک را انتخاب کنید.', 'error');
    if (mode.value === 'custom' && amount.value < 1) notification.setNotification('مدت تسک باید بزرگتر از ۰ باشد.', 'error');
    return;
  }

  const taskDuration = mode.value === 'preset' ? duration.value : amount.value

  loading.value = true
  try {
    emit('taskCreated', { goal_id: props.goal.id, start_date: selectedDate.value, duration: taskDuration })
    // ✅ پیام موفقیت به Goals.vue منتقل شد
  } catch(error) {
    console.error('Failed to create task:', error);
    notification.setNotification('خطا در ثبت تسک!', 'error');
  } finally {
    loading.value = false;
    emit('close'); // بستن مودال در هر صورت
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade-modal">
      <div v-if="props.show" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
           role="dialog" aria-modal="true" aria-labelledby="task-modal-title" @click.self="emit('close')">
        <div ref="modalEl" class="card-bg rounded-2xl p-6 w-full max-w-md shadow-xl border border-token text-right">
          <h2 id="task-modal-title" class="text-lg font-bold mb-4 border-b border-token pb-2 text-[var(--color-heading)]">
            افزودن تسک به: {{ props.goal?.title }}
          </h2>

          <div class="mb-4">
            <label class="block mb-1 font-medium text-[var(--color-text)]" for="task-start">تاریخ شروع</label>
            <Datepicker
                id="task-start"
                ref="datepickerRef"
                v-model="selectedDate"
                format="jYYYY/jMM/jDD"
                type="date"
                locale="fa"
                :input-class="'p-3 rounded-lg border border-token card-bg ring-focus'"
            />
          </div>

          <div class="mb-4">
            <label class="block mb-2 font-medium text-[var(--color-text)]">مدت تسک</label>
            <div class="flex gap-4 mb-3">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="preset" v-model="mode" /> انتخاب از لیست
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" value="custom" v-model="mode" /> وارد کردن عدد
              </label>
            </div>

            <div v-if="mode === 'preset'" class="flex flex-wrap gap-2 justify-start mb-3">
              <button v-for="opt in durationOptions" :key="opt.value" @click="setShortcut(opt.value)"
                      class="tap-target px-3 py-2 rounded-lg transition flex items-center gap-1 text-sm"
                      :class="{
                        'bg-[var(--color-primary)] text-white shadow-md': duration === opt.value,
                        'card-bg border border-token hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)]': duration !== opt.value
                      }">
                {{ opt.label }}
              </button>
            </div>

            <BaseSelect v-if="mode === 'preset'" v-model="duration" :options="durationOptions" placeholder="انتخاب بازه" />

            <input v-if="mode === 'custom'" v-model.number="amount" type="number" min="1" placeholder="تعداد روزها"
                   class="w-full p-3 rounded-lg border border-token card-bg ring-focus text-[var(--color-text)]" />
          </div>

          <div class="flex justify-end gap-3 mt-4">
            <button @click="$emit('close')" class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] transition">انصراف</button>
            <button @click="submitTask" :disabled="isSubmitDisabled"
                    class="tap-target px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    :aria-busy="loading ? 'true' : 'false'">
              <span v-if="loading" class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full" aria-hidden="true"></span>
              ثبت
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
/* کلاس‌های رنگی برای سازگاری بهتر با طرح دارک/لایت */
.card-bg { background-color: var(--color-background); }
.ring-focus:focus {
  outline: 3px solid color-mix(in oklab, var(--color-primary) 40%, white);
  outline-offset: 2px;
}
</style>
