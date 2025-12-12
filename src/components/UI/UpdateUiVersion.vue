<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showModal = ref(false);
let deferredNewWorker = null; // نگه داشتن ارجاع به New Worker

// 🚀 تابع فعال‌سازی به‌روزرسانی
const activateUpdate = () => {
    if (deferredNewWorker) {
        // 1. ارسال پیام skipWaiting به Service Worker جدید
        deferredNewWorker.postMessage({ action: 'skipWaiting' });
        
        // 2. رفرش صفحه برای فعال‌سازی آنی
        window.location.reload(); 
    }
};

// 💡 تابع گوش‌دهنده به رویداد در main.js
const handleUpdateAvailable = (event) => {
    showModal.value = true;
    deferredNewWorker = event.detail.newWorker; // ذخیره New Worker
};

onMounted(() => {
  window.addEventListener('swUpdateAvailable', handleUpdateAvailable);
});

onUnmounted(() => {
  window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
});
</script>

<template>
  <div v-if="showModal" class="update-modal-overlay">
    <div class="modal-content">
      <h2>✨ بروزرسانی جدید در دسترس!</h2>
      <p>یک نسخه جدید و بهبود یافته از برنامه آماده فعال‌سازی است.</p>
      <button @click="activateUpdate" class="btn btn-primary">
        فعال‌سازی و رفرش
      </button>
      <button @click="showModal = false" class="btn btn-secondary">
        بعداً
      </button>
    </div>
  </div>
</template>

<style scoped>
/* استایل‌های CSS برای Modal شما */
.update-modal-overlay { /* ... */ } 
</style>