<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] p-6 text-[var(--color-text)]">
    <h1 class="text-9xl font-extrabold text-[var(--color-primary)] opacity-70 mb-4">404</h1>
    <h2 class="text-3xl font-bold text-[var(--color-heading)] mb-4">صفحه پیدا نشد!</h2>
    <p class="text-lg text-center mb-8 max-w-md">
      متأسفانه، صفحه‌ای که به دنبال آن بودید در این آدرس وجود ندارد.
    </p>

    <RouterLink
        to="/goals"
        class="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl shadow-md hover:bg-[var(--color-primary-hover)] transition-all tap-target"
    >
      بازگشت به داشبورد
    </RouterLink>
  </div>
</template>
