<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/toast'

const store = useNotificationStore()

const bgClass = computed(() =>
  store.type === 'success' ? 'bg-green-700' : 'bg-red-700'
)
</script>

<template>
  <transition name="fade-slide">
    <div v-if="store.message"
         :class="['fixed top-6 right-6 z-50 max-w-xs w-full p-4 rounded-xl shadow-lg flex items-center gap-3 text-white', bgClass]">
      <span class="text-xl">{{ store.type === 'success' ? '✅' : '❌' }}</span>
      <span class="flex-1 text-sm">{{ store.message }}</span>
      <button @click="store.message = ''" class="font-bold ml-2">×</button>
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
