<template>
  <div class="p-4 max-w-md mx-auto">
    <button
      @click="subscribeUser"
      class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      v-if="!subscribed"
    >
      فعال‌سازی نوتیفیکیشن
    </button>

    <p v-else class="text-green-600 mt-2">
      نوتیفیکیشن فعال شد ✅
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/plugins/axios';

const subscribed = ref(false);

async function subscribeUser() {
  if (!('serviceWorker' in navigator)) {
    alert('مرورگر شما سرویس‌ورکر را پشتیبانی نمی‌کند!');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BFGSFXhg_hLEd77WnudywkDjC_m-JjYvRc9XC5V1y3JIhtxoT5ubQmvLBH0Lh7g9Jw6kF91SrviOZNUC-dq45KU' // کلید عمومی VAPID
    });

    await api.post('/save-subscription', subscription, {
      withCredentials: true
    });

    subscribed.value = true;
  } catch (err) {
    console.error(err);
    alert('خطا در فعال‌سازی نوتیفیکیشن');
  }
}
</script>

<style scoped>
/* کمی استایل برای زیبایی دکمه */
</style>
