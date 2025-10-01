<script setup>
import { RouterView } from 'vue-router';
import NotificationToast from '@/components/UI/ToastNotification.vue';
import Header from "./components/Layout/Header.vue";
</script>

<template>
  <div id="app" class="min-h-screen bg-[var(--color-background-soft)] text-[var(--color-text)] transition-colors duration-300" dir="rtl">
<Header/>
    <main class="container mx-auto p-4 sm:p-6 pb-20">
      <RouterView />
    </main>

    <NotificationToast />
  </div>
</template>
