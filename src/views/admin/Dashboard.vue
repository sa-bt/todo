<template>
  <div class="min-h-screen p-6 bg-[var(--color-background-soft)]" dir="rtl">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-extrabold text-[var(--color-heading)] mb-6 border-b pb-2">
        <span class="text-[var(--color-primary)]">پنل مدیریت</span> | داشبورد
      </h1>
      
      <!-- ناوبری داخلی ادمین -->
      <nav class="flex gap-4 mb-6 overflow-x-auto pb-2">
        <RouterLink
            :to="{ name: 'adminSummary' }"
            class="px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
            :class="[
                $route.name === 'adminSummary' 
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-background)] text-[var(--color-heading)] border border-[var(--color-border)] hover:bg-[var(--color-background-mute)]'
            ]"
        >
          خلاصه وضعیت
        </RouterLink>
        <RouterLink
            :to="{ name: 'adminReports' }"
            class="px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
            :class="[
                $route.name === 'adminReports' 
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-background)] text-[var(--color-heading)] border border-[var(--color-border)] hover:bg-[var(--color-background-mute)]'
            ]"
        >
          گزارش‌ها و آمار
        </RouterLink>
        <RouterLink
            :to="{ name: 'adminCoursesList' }"
            class="px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
            :class="[
                // چک کردن برای فعال بودن مسیر والد (adminCoursesList) یا مسیرهای فرزند (adminCourseDetail)
                $route.name === 'adminCoursesList' || $route.name === 'adminCourseDetail'
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-background)] text-[var(--color-heading)] border border-[var(--color-border)] hover:bg-[var(--color-background-mute)]'
            ]"
        >
          مدیریت دوره‌ها
        </RouterLink>
      </nav>

      <div class="bg-[var(--color-background)] p-6 rounded-2xl shadow-lg border border-[var(--color-border)]">
        <RouterView /> 
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
// این کامپوننت به عنوان Layout اصلی ادمین عمل می‌کند
</script>

<style scoped>
/* استایل‌های مربوط به بخش ادمین */
</style>