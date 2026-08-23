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

  <div class="dashboard-container flex-1 w-full" dir="rtl">

    <!--
      Padding belongs to the pages themselves (the shared `.page` class), so the
      layout only owns the background and the minimum height. Previously both
      sides added padding and each tab ended up with a different inset.
    -->
    <main class="surface min-h-screen">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
/* هیچ استایل خاصی مورد نیاز نیست، مگر استایل‌های مربوط به طرح‌بندی محتوای فرزند */
</style>
