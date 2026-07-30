<script setup>
import { computed, watch, onBeforeUnmount } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useToastSoundStore } from '@/stores/toastSound'
import { CheckCircle, AlertTriangle, Info, CircleAlert } from 'lucide-vue-next'

const store = useNotificationStore()
const soundStore = useToastSoundStore()
let timeout = null

// 🎨 استایل بر اساس نوع پیام
const typeStyle = computed(() => {
  switch (store.type) {
    case 'error':
      return { icon: AlertTriangle, bg: 'bg-red-600', ring: 'ring-red-400/40' }
    case 'info':
      return { icon: Info, bg: 'bg-blue-600', ring: 'ring-blue-400/40' }
    case 'warning':
      return { icon: CircleAlert, bg: 'bg-yellow-600', ring: 'ring-yellow-400/40' }
    case 'success':
    default:
      return { icon: CheckCircle, bg: 'bg-[var(--color-primary)]', ring: 'ring-[var(--color-primary)]/30' }
  }
})

// 🔍 نمایش یا عدم نمایش Toast
const isVisible = computed(() => store.message !== '')

// 👀 واکنش به تغییر پیام
watch(() => store.message, (newMessage) => {
  if (timeout) clearTimeout(timeout)

  if (newMessage) {
    // 🔊 پخش صدای انتخاب‌شده‌ی کاربر، اگر برای این پیام صدا فعال باشد
    if (store.sound) {
      soundStore.play()
    }

    // ⏱ پاک شدن خودکار بر اساس مدت‌زمان ارسال‌شده از بک‌اند
    timeout = setTimeout(() => {
      store.clearNotification()
    }, store.duration || 5000)
  }
})

onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout)
})
</script>

<template>
  <transition name="toast-fade-slide">
    <div
        v-if="isVisible"
        class="fixed z-[9999] pointer-events-auto max-w-sm w-full flex items-start gap-4 px-5 py-4
         rounded-2xl border shadow-2xl text-white backdrop-blur-lg"
        :class="[typeStyle.bg, typeStyle.ring,
           'bottom-6 left-1/2 translate-x-[-50%] sm:left-auto sm:right-6 sm:bottom-6 sm:translate-x-0']"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        :aria-label="store.message"
        dir="rtl"
    >

      <!-- آیکن -->
      <component :is="typeStyle.icon" class="w-6 h-6 shrink-0 mt-1 text-white" />

      <!-- متن -->
      <div class="flex-1 text-sm font-medium leading-relaxed text-white">
        {{ store.message }}
      </div>

      <!-- دکمه بستن -->
      <button @click="store.clearNotification"
              class="text-white text-lg font-bold ml-2 opacity-70 hover:opacity-100 transition"
              aria-label="بستن اعلان">
        ×
      </button>
    </div>
  </transition>
</template>

<style scoped>
.toast-fade-slide-enter-active,
.toast-fade-slide-leave-active {
  transition: all 0.35s ease;
}
.toast-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
.toast-fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.toast-fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.toast-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
