<script setup>
import { RouterView } from 'vue-router'
// هیچ منطق یا داده‌ای برای هدر نیاز نیست
</script>

<template>
  <div class="dashboard-container flex-1 w-full">

    <main class="p-0 sm:p-6 surface-soft">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
/* هیچ استایل خاصی مورد نیاز نیست، مگر استایل‌های مربوط به طرح‌بندی محتوای فرزند */
</style>
