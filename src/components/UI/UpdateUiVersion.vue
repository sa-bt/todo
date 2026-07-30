<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { applyUpdate, hardReset } from '@/utils/swUpdate'

const showModal = ref(false)
const busy = ref(false)
let deferredNewWorker = null

// 🚀 فعال‌سازی نسخه جدید (رفرش توسط swUpdate انجام می‌شود)
const activateUpdate = () => {
  busy.value = true
  applyUpdate(deferredNewWorker)
}

// 🧹 دریچه‌ی اضطراری برای وقتی اپ در نسخه‌ی قدیمی گیر کرده
const resetApp = async () => {
  busy.value = true
  await hardReset()
}

const handleUpdateAvailable = (event) => {
  deferredNewWorker = event.detail && event.detail.newWorker
  showModal.value = true
}

onMounted(() => {
  window.addEventListener('swUpdateAvailable', handleUpdateAvailable)
})

onUnmounted(() => {
  window.removeEventListener('swUpdateAvailable', handleUpdateAvailable)
})
</script>

<template>
  <div
    v-if="showModal"
    dir="rtl"
    class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800">
      <h2 class="mb-2 text-lg font-bold text-slate-900 dark:text-white">
        ✨ نسخه جدید آماده است
      </h2>
      <p class="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
        یک نسخه‌ی به‌روزتر از برنامه دریافت شده است. برای استفاده از آن، برنامه یک‌بار تازه‌سازی می‌شود.
      </p>

      <div class="flex gap-2">
        <button
          type="button"
          :disabled="busy"
          class="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          @click="activateUpdate"
        >
          {{ busy ? 'در حال به‌روزرسانی…' : 'به‌روزرسانی و تازه‌سازی' }}
        </button>
        <button
          type="button"
          :disabled="busy"
          class="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          @click="showModal = false"
        >
          بعداً
        </button>
      </div>

      <button
        type="button"
        :disabled="busy"
        class="mt-4 w-full text-center text-xs text-slate-400 underline transition hover:text-red-500 disabled:opacity-60"
        @click="resetApp"
      >
        اگر به‌روزرسانی انجام نشد، پاکسازی کامل حافظه‌ی برنامه
      </button>
    </div>
  </div>
</template>
