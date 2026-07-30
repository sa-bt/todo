<template>
  <section class="space-y-6" dir="rtl">
    <div
      class="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-2xl shadow-slate-950/10 sm:px-8 sm:py-9"
    >
      <div class="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <div class="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      <div class="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div class="max-w-2xl">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-300"
          >
            <Sparkles class="h-4 w-4" aria-hidden="true" />
            فضای مدیریت یکپارچه
          </span>
          <h2 class="mt-5 text-2xl font-black leading-tight sm:text-3xl">
            مدیریت محتوا و تحلیل رشد، در یک نگاه
          </h2>
          <p class="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            مسیرهای پرتکرار در دسترس‌اند. برای شروع، گزارش بازدید را مرور کنید یا محتوای تازه
            بسازید.
          </p>
        </div>

        <RouterLink
          :to="{ name: 'adminContents' }"
          class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
        >
          <Plus class="h-5 w-5" aria-hidden="true" />
          ساخت محتوای تازه
        </RouterLink>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="stat in dashboardStats"
        :key="stat.label"
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-[var(--color-text-secondary)]">{{ stat.label }}</span>
          <component
            :is="stat.icon"
            class="h-5 w-5 text-[var(--color-primary)]"
            aria-hidden="true"
          />
        </div>
        <p class="mt-4 text-3xl font-black tabular-nums text-[var(--color-heading)]">
          {{ loading ? '…' : faNumber(stat.value) }}
        </p>
        <p class="mt-2 text-xs text-[var(--color-text-secondary)]">{{ stat.hint }}</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="item in actionItems"
        :key="item.name"
        :to="{ name: item.routeName }"
        class="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl"
      >
        <div class="flex items-start justify-between gap-4">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
            :class="item.iconClass"
          >
            <component :is="item.icon" class="h-6 w-6" aria-hidden="true" />
          </span>
          <ArrowUpLeft
            class="h-5 w-5 text-[var(--color-text-secondary)] transition group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--color-primary)]"
            aria-hidden="true"
          />
        </div>
        <h3 class="mt-5 text-lg font-black text-[var(--color-heading)]">{{ item.name }}</h3>
        <p class="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
          {{ item.description }}
        </p>
      </RouterLink>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <section
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm sm:p-6"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-[var(--color-primary)]">مسیر پیشنهادی</p>
            <h3 class="mt-1 text-lg font-black text-[var(--color-heading)]">شروع سریع مدیریت</h3>
          </div>
          <Compass class="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
        </div>

        <ol class="mt-6 grid gap-3 sm:grid-cols-3">
          <li
            v-for="(step, index) in quickStart"
            :key="step.title"
            class="rounded-2xl bg-[var(--color-background-soft)] p-4"
          >
            <span
              class="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-primary)] text-sm font-black text-white"
            >
              {{ index + 1 }}
            </span>
            <strong class="mt-4 block text-sm text-[var(--color-heading)]">{{ step.title }}</strong>
            <p class="mt-2 text-xs leading-6 text-[var(--color-text-secondary)]">
              {{ step.description }}
            </p>
          </li>
        </ol>
      </section>

      <section
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm sm:p-6"
      >
        <div class="flex items-center gap-3">
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"
          >
            <ShieldCheck class="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 class="font-black text-[var(--color-heading)]">وضعیت دسترسی</h3>
            <p class="text-xs text-[var(--color-text-secondary)]">حساب مدیر فعال است</p>
          </div>
        </div>

        <div class="mt-5 space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-[var(--color-text-secondary)]">گزارش بازدید</span>
            <span class="font-bold text-emerald-600">فعال</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[var(--color-text-secondary)]">مدیریت محتوا</span>
            <span class="font-bold text-emerald-600">فعال</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[var(--color-text-secondary)]">دوره‌های آموزشی</span>
            <span class="font-bold text-emerald-600">فعال</span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowUpLeft,
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Inbox,
} from 'lucide-vue-next'
import { getAdminDashboard } from '@/plugins/api'

const dashboard = ref(null)
const loading = ref(false)
const faNumber = (value) => Number(value || 0).toLocaleString('fa-IR')
const dashboardStats = computed(() => [
  {
    label: 'کل کاربران',
    value: dashboard.value?.users?.total,
    hint: `${faNumber(dashboard.value?.users?.new_last_7_days)} عضو تازه در هفت روز`,
    icon: Users,
  },
  {
    label: 'اهداف ثبت‌شده',
    value: dashboard.value?.activity?.goals,
    hint: `${faNumber(dashboard.value?.activity?.tasks)} کار برنامه‌ریزی‌شده`,
    icon: Target,
  },
  {
    label: 'پیام‌های جدید',
    value: dashboard.value?.contacts?.new,
    hint: `${faNumber(dashboard.value?.contacts?.total)} پیام در مجموع`,
    icon: Inbox,
  },
  {
    label: 'محتوای آماده',
    value: dashboard.value?.contents?.ready,
    hint: `${faNumber(dashboard.value?.contents?.draft)} پیش‌نویس`,
    icon: FileText,
  },
])

const actionItems = [
  {
    name: 'گزارش‌ها و آمار',
    description: 'روند بازدید، رفتار مخاطبان و صفحه‌های پربازدید را بررسی کنید.',
    routeName: 'adminReports',
    icon: BarChart3,
    iconClass: 'bg-violet-500/10 text-violet-600',
  },
  {
    name: 'مرکز محتوا',
    description: 'یادداشت‌ها و تجربه‌ها را ثبت، ویرایش و برای انتشار آماده کنید.',
    routeName: 'adminContents',
    icon: FileText,
    iconClass: 'bg-amber-500/10 text-amber-600',
  },
  {
    name: 'دوره‌های آموزشی',
    description: 'ساختار دوره‌ها، فصل‌ها و محتوای آموزشی را مرور کنید.',
    routeName: 'adminCoursesList',
    icon: BookOpen,
    iconClass: 'bg-cyan-500/10 text-cyan-600',
  },
]

const quickStart = [
  { title: 'داده‌ها را مرور کنید', description: 'گزارش بازدید امروز و روندهای اخیر را ببینید.' },
  { title: 'محتوا را آماده کنید', description: 'ایده‌ها را ثبت کنید و وضعیت مناسب بدهید.' },
  { title: 'دوره‌ها را کنترل کنید', description: 'نمایش فصل‌ها و اجزای آموزشی را بررسی کنید.' },
]

onMounted(async () => {
  loading.value = true
  try {
    const response = await getAdminDashboard()
    dashboard.value = response?.data ?? null
  } finally {
    loading.value = false
  }
})
</script>
