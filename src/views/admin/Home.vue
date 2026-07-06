<template>
  <section class="space-y-6" dir="rtl">
    <div class="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold text-[var(--color-primary)]">Do IT Admin</p>
        <h2 class="mt-2 text-2xl font-extrabold text-[var(--color-heading)]">مرکز مدیریت</h2>
      </div>

      <RouterLink
        :to="{ name: 'adminContents' }"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:opacity-90"
      >
        <FileText class="h-4 w-4" aria-hidden="true" />
        تولید محتوا
      </RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <RouterLink
        v-for="item in actionItems"
        :key="item.name"
        :to="{ name: item.routeName }"
        class="group rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-5 transition hover:border-[var(--color-primary)]/60 hover:shadow-md"
      >
        <div class="flex items-start gap-4">
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--color-background)] text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
            <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h3 class="text-lg font-bold text-[var(--color-heading)]">{{ item.name }}</h3>
            <p class="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{{ item.description }}</p>
          </div>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { BarChart3, BookOpen, FileText } from 'lucide-vue-next'

const actionItems = [
  {
    name: 'گزارش‌ها و آمار',
    description: 'نمای مدیریتی برای بررسی وضعیت کلی سیستم.',
    routeName: 'adminReports',
    icon: BarChart3,
  },
  {
    name: 'تولید محتوا',
    description: 'ثبت محتوای خام برای ساخت خروجی‌های بعدی.',
    routeName: 'adminContents',
    icon: FileText,
  },
  {
    name: 'دوره‌های آموزشی',
    description: 'مشاهده و مدیریت محتوای آموزشی موجود.',
    routeName: 'adminCoursesList',
    icon: BookOpen,
  },
]
</script>
