<script setup>
import { Transition } from 'vue'

defineProps({
  show: Boolean,
  title: { type: String, default: 'آیا مطمئن هستید؟' },
  message: { type: String, default: 'این عملیات قابل بازگشت نیست.' }
})

const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- بک‌دراپ -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>

      <!-- محتوای مدال -->
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-right">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-300 mb-6">{{ message }}</p>

        <div class="flex gap-3 justify-end">
          <button
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            انصراف
          </button>
          <button
              @click="emit('confirm')"
              class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition-colors"
          >
            بله، حذف شود
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
