<script setup>
import NotificationToast from '@/components/UI/ToastNotification.vue';
import Header from "./components/Layout/Header.vue";
import { RouterView, useRoute } from 'vue-router'; // ✅ وارد کردن useRoute
import { computed } from 'vue'; // ✅ وارد کردن computed
import { useAuthStore } from '@/stores/auth'; // ✅ نیاز به authStore برای لاگین بودن
import { useUserSettingStore } from '@/stores/userSetting'
import { onMounted } from 'vue'


const route = useRoute();
const authStore = useAuthStore();
onMounted(async () => {
  const settings = useUserSettingStore()

  if (authStore.isAuthenticated && !settings.loaded) {
    await settings.load()
  }
})
const shouldShowHeader = computed(() => {
   return route.meta.requiresAuth || authStore.isAuthenticated;
});

// 💡 برای ساده‌سازی، می‌توانیم فقط از route.meta.requiresAuth استفاده کنیم:
// const shouldShowHeader = computed(() => route.meta.requiresAuth);
</script>

<template>
  <div id="app" class="min-h-screen bg-[var(--color-background-soft)] text-[var(--color-text)] transition-colors duration-300" dir="rtl">
<Header v-if="shouldShowHeader" />
    <main class="container mx-auto p-4 sm:p-6 pb-20">
      <RouterView />
    </main>

    <NotificationToast />
  </div>
</template>
