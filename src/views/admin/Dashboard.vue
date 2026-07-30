<template>
  <div class="admin-shell min-h-dvh bg-[var(--color-background-soft)]" dir="rtl">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
      aria-label="بستن منوی مدیریت"
      @click="mobileMenuOpen = false"
    />

    <aside
      class="fixed inset-y-0 right-0 z-50 flex w-[18rem] flex-col border-l border-white/10 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 lg:translate-x-0"
      :class="mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <RouterLink
          :to="{ name: 'adminSummary' }"
          class="flex min-w-0 items-center gap-3"
          @click="closeMobileMenu"
        >
          <span
            class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-lg font-black text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            D
          </span>
          <span class="min-w-0">
            <strong class="block truncate text-base">مرکز مدیریت</strong>
            <span class="mt-0.5 block text-xs text-slate-400">Do It Workspace</span>
          </span>
        </RouterLink>

        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="بستن منو"
          @click="mobileMenuOpen = false"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav class="scroll-soft flex-1 overflow-y-auto px-3 py-5" aria-label="بخش‌های مدیریت">
        <p class="mb-3 px-3 text-[0.7rem] font-bold tracking-wider text-slate-500">فضای کاری</p>
        <RouterLink
          v-for="item in navigation"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="mb-1 flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition"
          :class="
            isNavigationActive(item)
              ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          "
          @click="closeMobileMenu"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
          <span class="flex-1">{{ item.label }}</span>
          <ChevronLeft
            class="h-4 w-4 opacity-60"
            :class="isNavigationActive(item) ? 'translate-x-0' : '-translate-x-1'"
            aria-hidden="true"
          />
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-3 sm:hidden">
        <p class="px-3 pb-2 text-[0.7rem] font-bold text-slate-500">نمای پنل</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            type="button"
            class="grid min-h-10 place-items-center rounded-xl border transition"
            :class="
              themeStore.currentTheme === theme.key
                ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                : 'border-white/10 text-slate-300 hover:bg-white/10'
            "
            :aria-label="theme.label"
            :aria-pressed="themeStore.currentTheme === theme.key"
            @click="themeStore.setTheme(theme.key)"
          >
            <component :is="theme.icon" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="border-t border-white/10 p-3">
        <InstallAppButton
          class="mb-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10 hover:text-emerald-200 disabled:opacity-60"
          label="نصب پنل مدیریت"
          app-name="Do IT Admin"
        />

        <a
          href="/"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink class="h-5 w-5" aria-hidden="true" />
          مشاهده سایت
        </a>
        <button
          type="button"
          class="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
          @click="logout"
        >
          <LogOut class="h-5 w-5" aria-hidden="true" />
          خروج از حساب
        </button>
      </div>
    </aside>

    <div class="min-h-dvh lg:mr-[18rem]">
      <header
        class="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_88%,transparent)] backdrop-blur-xl"
      >
        <div class="flex min-h-20 items-center gap-3 px-4 sm:px-6 xl:px-8">
          <button
            type="button"
            class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-heading)] lg:hidden"
            aria-label="باز کردن منوی مدیریت"
            @click="mobileMenuOpen = true"
          >
            <Menu class="h-5 w-5" aria-hidden="true" />
          </button>

          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-[var(--color-primary)]">
              {{ currentPage.eyebrow }}
            </p>
            <h1 class="mt-1 truncate text-lg font-black text-[var(--color-heading)] sm:text-xl">
              {{ currentPage.title }}
            </h1>
          </div>

          <div
            class="hidden items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-1 sm:flex"
            aria-label="انتخاب تم"
          >
            <button
              v-for="theme in themeOptions"
              :key="theme.key"
              type="button"
              class="grid h-9 w-9 place-items-center rounded-lg transition"
              :class="
                themeStore.currentTheme === theme.key
                  ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-heading)]'
              "
              :aria-label="theme.label"
              :aria-pressed="themeStore.currentTheme === theme.key"
              @click="themeStore.setTheme(theme.key)"
            >
              <component :is="theme.icon" class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div class="hidden h-9 w-px bg-[var(--color-border)] md:block" />

          <div class="flex min-w-0 items-center gap-2">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-sm font-black text-white"
            >
              {{ adminInitial }}
            </span>
            <div class="hidden min-w-0 md:block">
              <strong class="block max-w-32 truncate text-sm text-[var(--color-heading)]">
                {{ adminName }}
              </strong>
              <span class="text-xs text-[var(--color-text-secondary)]">مدیر سامانه</span>
            </div>
          </div>
        </div>
      </header>

      <main class="px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
        <div class="mx-auto max-w-[96rem]">
          <div class="mb-6">
            <p class="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
              {{ currentPage.description }}
            </p>
          </div>

          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BarChart3,
  BellRing,
  BookOpen,
  ChevronLeft,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-vue-next'
import InstallAppButton from '@/components/UI/InstallAppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

const navigation = [
  {
    routeName: 'adminUsers',
    label: 'مدیریت کاربران',
    icon: Users,
    matches: ['adminUsers'],
  },
  {
    routeName: 'adminContacts',
    label: 'پیام‌های تماس',
    icon: Inbox,
    matches: ['adminContacts'],
  },
  {
    routeName: 'adminNotifications',
    label: 'مرکز اعلان‌ها',
    icon: BellRing,
    matches: ['adminNotifications'],
  },
  {
    routeName: 'adminSummary',
    label: 'نمای کلی',
    icon: LayoutDashboard,
    matches: ['adminSummary'],
  },
  {
    routeName: 'adminReports',
    label: 'گزارش‌ها و آمار',
    icon: BarChart3,
    matches: ['adminReports'],
  },
  {
    routeName: 'adminContents',
    label: 'مرکز محتوا',
    icon: FileText,
    matches: ['adminContents'],
  },
  {
    routeName: 'adminCoursesList',
    label: 'دوره‌های آموزشی',
    icon: BookOpen,
    matches: ['adminCoursesList', 'adminCourseDetail'],
  },
]

const pageMeta = {
  adminSummary: {
    eyebrow: 'نمای کلی',
    title: 'صبح بخیر؛ همه‌چیز آماده است',
    description: 'از اینجا به بخش‌های اصلی مدیریت دسترسی دارید و وضعیت فضای کاری را می‌بینید.',
  },
  adminReports: {
    eyebrow: 'داده و بینش',
    title: 'گزارش‌های مدیریتی',
    description: 'رفتار بازدیدکنندگان را در بازه‌های مختلف بررسی و مسیرهای پربازدید را پیدا کنید.',
  },
  adminContents: {
    eyebrow: 'مدیریت محتوا',
    title: 'مرکز تولید محتوا',
    description: 'یادداشت‌ها، تجربه‌ها و نقل‌قول‌ها را در یک فضای متمرکز ثبت و سامان‌دهی کنید.',
  },
  adminUsers: {
    eyebrow: 'کاربران',
    title: 'مدیریت کاربران',
    description: 'حساب‌ها، میزان فعالیت و نقش دسترسی کاربران را بررسی و مدیریت کنید.',
  },
  adminContacts: {
    eyebrow: 'ارتباط با مخاطبان',
    title: 'صندوق پیام‌های تماس',
    description: 'پیام‌های دریافتی را بررسی کنید، وضعیت رسیدگی بدهید و یادداشت داخلی ثبت کنید.',
  },
  adminNotifications: {
    eyebrow: 'ارتباط مستقیم',
    title: 'مرکز اعلان‌های مدیریتی',
    description:
      'پیام‌های درون‌برنامه‌ای یا اعلان مرورگر را برای کاربران انتخابی یا همه کاربران ارسال کنید.',
  },
  adminCoursesList: {
    eyebrow: 'آموزش',
    title: 'دوره‌های آموزشی',
    description: 'دوره‌های موجود و ساختار محتوایی آن‌ها را مرور کنید.',
  },
  adminCourseDetail: {
    eyebrow: 'جزئیات دوره',
    title: 'نمایش محتوای دوره',
    description: 'سرفصل‌ها، گام‌ها و محتوای ساختاریافته دوره را بررسی کنید.',
  },
}

const themeOptions = [
  { key: 'minimal-sage', label: 'تم سبز', icon: Sparkles },
  { key: 'minimal-sand', label: 'تم شنی', icon: Sun },
  { key: 'dark', label: 'تم تیره', icon: Moon },
]

const currentPage = computed(() => pageMeta[route.name] ?? pageMeta.adminSummary)
const adminName = computed(() => auth.user?.name || 'مدیر')
const adminInitial = computed(() => adminName.value.trim().charAt(0) || 'م')

function isNavigationActive(item) {
  return item.matches.includes(route.name)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

async function logout() {
  await auth.signOut()
  router.push({ name: 'adminLogin' })
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)
</script>

<style scoped>
.admin-shell {
  background-image:
    radial-gradient(circle at 10% 0%, rgb(var(--color-primary-rgb) / 0.08), transparent 26rem),
    linear-gradient(180deg, var(--color-background-soft), var(--color-background));
}
</style>
