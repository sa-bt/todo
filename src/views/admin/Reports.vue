<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold text-[var(--color-heading)] mb-4">گزارش‌های سیستم</h2>
    
    <p class="text-[var(--color-text-secondary)] mb-4">
      اینجا محلی برای نمایش آمار و گزارش‌های مدیریتی است. (مثلاً: تعداد کاربران فعال، کارهای انجام شده، و آمار $\text{Web Push}$).
    </p>

    <!-- مثال یک کارت آماری ساده -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <div class="p-5 rounded-xl border border-blue-400/50 bg-blue-500/10 shadow-md">
        <p class="text-sm text-blue-600 font-medium">کل کاربران</p>
        <p class="text-3xl font-bold text-[var(--color-heading)] mt-1">1,245</p>
      </div>
      <div class="p-5 rounded-xl border border-green-400/50 bg-green-500/10 shadow-md">
        <p class="text-sm text-green-600 font-medium">تسک‌های انجام شده امروز</p>
        <p class="text-3xl font-bold text-[var(--color-heading)] mt-1">456</p>
      </div>
      <div class="p-5 rounded-xl border border-yellow-400/50 bg-yellow-500/10 shadow-md">
        <p class="text-sm text-yellow-600 font-medium">فروش ماهانه (توکن)</p>
        <p class="text-3xl font-bold text-[var(--color-heading)] mt-1">32M</p>
      </div>
    </div>

    <div class="mt-8 pt-4 border-t border-[var(--color-border)]">
        <h3 class="text-xl font-semibold text-[var(--color-heading)] mb-3">نمایش جزئیات</h3>
        <p class="text-[var(--color-text)]">
            جزئیات بیشتر گزارش‌ها در این بخش قابل توسعه است.
        </p>
    </div>
  </div>
</template>

<script setup>
// منطق واکشی داده‌های گزارش در اینجا قرار می‌گیرد
</script>