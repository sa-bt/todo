<script setup>
import NotificationToast from '@/components/UI/ToastNotification.vue';
import Header from "./components/Layout/Header.vue";
import { RouterView, useRoute } from 'vue-router'; // ✅ وارد کردن useRoute
import { computed } from 'vue'; // ✅ وارد کردن computed
import { useAuthStore } from '@/stores/auth'; // ✅ نیاز به authStore برای لاگین بودن

const route = useRoute();
const authStore = useAuthStore();

// ✅ کامپیوتد برای تعیین نمایش هدر
const shouldShowHeader = computed(() => {
  // هدر را در دو حالت نمایش می‌دهیم:
  // 1. زمانی که مسیر فعلی نیاز به احراز هویت دارد (requiresAuth: true)
  // 2. زمانی که کاربر لاگین کرده است. (اگرچه شرط 1 در روتر گارد کافیست، اما برای وضوح بهتر است)

  // فرض می‌کنیم تمامی مسیرهای داشبورد دارای meta: { requiresAuth: true } هستند.
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
