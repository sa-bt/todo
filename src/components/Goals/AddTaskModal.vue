<script setup>
import { ref, watch } from "vue"
import Datepicker from "vue3-persian-datetime-picker"
import { useNotificationStore } from '@/stores/toast'

const props = defineProps({
  show: Boolean,
  goal: Object
})
const emit = defineEmits(["close", "taskCreated"])

const notification = useNotificationStore()

// state
const selectedDate = ref(null)
const mode = ref('preset')
const duration = ref(1)
const amount = ref(1)
const loading = ref(false)

const durationOptions = [
  { label: "امروز", value: 1, icon: '☀️' },
  { label: "هفته", value: 7, icon: '🗓️' },
  { label: "ماه", value: 30, icon: '📆' },
  { label: "سال", value: 365, icon: '📅' },
]

// ریست فرم وقتی مدال بسته شد
watch(() => props.show, (val) => {
  if (!val) {
    selectedDate.value = null
    mode.value = 'preset'
    duration.value = 1
    amount.value = 1
  }
})

// shortcut دکمه‌ها
function setShortcut(value) {
  mode.value = 'preset'
  duration.value = value
}

async function submitTask() {
  if (!selectedDate.value) {
    notification.setNotification('تاریخ را انتخاب کنید!', 'error')
    return
  }

  const taskDuration = mode.value === 'preset' ? duration.value : amount.value
  if (taskDuration < 1) {
    notification.setNotification('مدت تسک باید بزرگتر از ۰ باشد!', 'error')
    return
  }

  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 300)) // شبیه‌سازی تاخیر
    emit("taskCreated", {
      goal_id: props.goal.id,
      start_date: selectedDate.value,
      duration: taskDuration,
    })
    emit("close")
    notification.setNotification('تسک با موفقیت اضافه شد ✅', 'success')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <transition name="fade-scale">
    <div
      v-if="props.show"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-lg transform transition-transform">
        <h2 class="text-lg font-bold mb-4 text-right border-b pb-2">افزودن تسک به: {{ props.goal.title }}</h2>

        <!-- انتخاب تاریخ -->
        <div class="mb-4 text-right">
          <label class="block mb-1 font-medium">تاریخ شروع</label>
          <Datepicker
            v-model="selectedDate"
            format="jYYYY/jMM/jDD"
            type="date"
            locale="fa"
            :input-class="'w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400'"
          />
        </div>

        <!-- انتخاب حالت مدت -->
        <div class="mb-4 text-right">
          <label class="block mb-1 font-medium ">مدت تسک</label>
          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2">
              <input type="radio" value="preset" v-model="mode" /> انتخاب از لیست
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" value="custom" v-model="mode" /> وارد کردن عدد
            </label>
          </div>

          <!-- shortcut سریع با آیکن -->
          <div v-if="mode === 'preset'" class="flex flex-wrap gap-2 m-2 justify-end">
            <button
              v-for="opt in durationOptions"
              :key="opt.value"
              @click="setShortcut(opt.value)"
              :class="[
                'px-4 py-2 rounded-lg transition flex items-center gap-1 text-sm sm:text-base',
                duration===opt.value && mode==='preset'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg'
                  : 'bg-gray-200 hover:bg-gray-300'
              ]"
              :title="`انتخاب ${opt.label} = ${opt.value} روز`"
            >
              <span>{{ opt.icon }}</span>
              {{ opt.label }}
            </button>
          </div>

          <!-- حالت select -->
          <select v-if="mode === 'preset'" v-model="duration" class="w-full p-2 rounded-lg border" title="انتخاب بازه از لیست">
            <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>

          <!-- حالت عدد دلخواه -->
          <input
            v-if="mode === 'custom'"
            v-model.number="amount"
            type="number"
            min="1"
            placeholder="تعداد روزها"
            class="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
            title="عدد دلخواه = می‌توانید هر تعداد روز وارد کنید"
          />
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button @click="$emit('close')"
                  class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
            انصراف
          </button>
          <button @click="submitTask"
                  :disabled="loading"
                  class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2">
            <span v-if="loading" class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full"></span>
            ثبت
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
