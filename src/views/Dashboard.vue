<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Header from "../components/Layout/Header.vue";
const route = useRoute()
const authStore = useAuthStore()

const shouldShowHeader = computed(() => {
  return route.meta.requiresAuth || authStore.isAuthenticated
})
</script>

<template>
  <Header v-if="shouldShowHeader" />

  <div class="dashboard-container flex-1 w-full">

    <main class="p-0 sm:p-6 surface-soft">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
/* هیچ استایل خاصی مورد نیاز نیست، مگر استایل‌های مربوط به طرح‌بندی محتوای فرزند */
</style>
