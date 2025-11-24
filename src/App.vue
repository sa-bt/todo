<template>
  <div
      id="app"
      class="min-h-screen text-[var(--color-text)] transition-colors duration-300"
  >
    <main class="container mx-auto  sm:p-6 pb-20">
      <RouterView />
    </main>

    <NotificationToast />
  </div>
</template>

<script setup>
import NotificationToast from '@/components/UI/ToastNotification.vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserSettingStore } from '@/stores/userSetting'
import { useI18n } from 'vue-i18n'
import { onMounted, watch } from 'vue'
import AOS from 'aos'
import 'aos/dist/aos.css'


const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()


watch(locale, () => {
  setTimeout(() => {
    AOS.refreshHard()
  }, 50)
})
onMounted(async () => {
  AOS.init({
    duration: 800,
    once: true,
  });
  const settings = useUserSettingStore()
  if (authStore.isAuthenticated && !settings.loaded) {
    await settings.load()
  }
})
</script>
