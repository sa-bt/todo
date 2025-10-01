<script setup lang="ts">
import { computed, watch } from 'vue'
import { useNotificationStore } from '@/stores/toast'

const store = useNotificationStore()
let timeout: number | undefined = undefined

const bgClass = computed(() =>
    store.type === 'success' ? 'bg-green-700' : 'bg-red-700'
)

// تعیین role/aria-live برای دسترسی‌پذیری
const ariaLive = computed(() => (store.type === 'error' ? 'assertive' : 'polite'))

// مدیریت تایمر بستن خودکار
watch(() => store.message, (newMessage) => {
  clearTimeout(timeout);

  // بستن خودکار پس از 4 ثانیه فقط برای اعلان‌های موفقیت
  if (newMessage && store.type === 'success') {
    timeout = setTimeout(() => {
      store.message = '';
    }, 4000);
  }
})
</script>

<template>
  <transition name="fade-slide">
    <div v-if="store.message"
         :class="['fixed top-6 right-6 z-50 max-w-xs w-full p-4 rounded-xl shadow-lg flex items-center gap-3 text-white', bgClass]"
         role="status"
         :aria-live="ariaLive"
         aria-atomic="true"
         :aria-label="store.message"
    >
      <span class="text-xl">{{ store.type === 'success' ? '✅' : '❌' }}</span>
      <span class="flex-1 text-sm text-right">{{ store.message }}</span>
      <button @click="store.message = ''" class="font-bold ml-2 tap-target" aria-label="بستن اعلان">×</button>
    </div>
  </transition>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
