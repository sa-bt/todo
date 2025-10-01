<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router' // useRoute اضافه شد
import {
  Home, Calendar, CalendarDays, CalendarRange, CalendarClock,
  Menu, Bell, X, Settings, LogOut
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getTodayShamsi } from '@/utils/jalali'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const shamsiDate = getTodayShamsi()
const router = useRouter()
const route = useRoute() // ✅ برای تشخیص مسیر فعال در ناوبری
const auth = useAuthStore()

const mobileMenuOpen = ref(false)
const notificationsOpen = ref(false)

// 💡 این آرایه در نهایت باید از یک Store یا API لود شود.
const notifications = ref([
  { id: 1, text: 'تسک "خواندن کتاب" امروز موعد دارد', time: 'امروز', read: false },
  { id: 2, text: 'جلسه هفتگی فردا ساعت ۱۰ صبح', time: 'امروز', read: true },
  { id: 3, text: '۵ تسک جدید به هدفت اضافه شد', time: 'دیروز', read: false }
])

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
function goToDailyView() {
  router.push('/day')
}

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function markAllRead() {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

const notifMenuRef = ref(null)
const notifButtonRef = ref(null)

// ⚠️ توابع مدیریت کلیک خارج از منو و Escape
function onDocumentClick(e) {
  if (!notificationsOpen.value) return
  const menu = notifMenuRef.value
  const btn = notifButtonRef.value
  const target = e.target
  if (menu && !menu.contains(target) && btn && !btn.contains(target)) {
    notificationsOpen.value = false
  }
}
function onKeydown(e) {
  if (e.key === 'Escape') {
    if (notificationsOpen.value) {
      notificationsOpen.value = false
      notifButtonRef.value?.focus?.()
    }
    if (mobileMenuOpen.value) mobileMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, { passive: true })
  document.addEventListener('keydown', onKeydown)
  // بستن منوی موبایل بعد از ناوبری
  router.afterEach(() => { mobileMenuOpen.value = false })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) {
    requestAnimationFrame(() => {
      const firstBtn = notifMenuRef.value?.querySelector('button, a, [tabindex]:not([tabindex="-1"])')
      firstBtn?.focus?.()
    })
  }
}

// ✅ لینک‌های ناوبری اصلی (مطابق با Router شما)
const navigationLinks = [
  { to: '/goals', label: 'اهداف', icon: Home, routeName: 'goals' },
  { to: '/year', label: 'نمای سالانه', icon: Calendar, routeName: 'year' },
  { to: '/month', label: 'نمای ماهانه', icon: CalendarRange, routeName: 'month' },
  { to: '/week', label: 'نمای هفتگی', icon: CalendarDays, routeName: 'week' },
  { to: '/day', label: 'نمای روزانه', icon: CalendarClock, routeName: 'day' },
  { to: '/settings', label: 'تنظیمات', icon: Settings, routeName: 'settings' }
]

// ✅ تابعی برای بررسی فعال بودن مسیر بر اساس route.name
const isLinkActive = (routeName) => route.name === routeName;
</script>

<template>
  <header class="flex justify-between items-center surface border-b border-token px-6 py-3 shadow-sm relative sticky top-0 z-40">
    <div class="flex items-center gap-3">
      <img src="/pwa-512x512.png" alt="لوگو" class="w-10 h-10 rounded-full border border-token" />
      <RouterLink to="/goals" class="text-lg font-bold text-[var(--color-heading)]">داشبورد اهداف</RouterLink>
    </div>

    <div class="flex items-center gap-3">

      <ThemeSwitcher class="hidden lg:flex ml-3" />

      <BaseTooltip text="مشاهده روزانه" placement="bottom">
        <button
            @click="goToDailyView"
            class="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-token surface-soft hover:surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 transition text-sm focus:outline-none"
            type="button"
        >
          <Calendar class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
          <span>{{ shamsiDate }}</span>
        </button>
      </BaseTooltip>

      <div class="relative">
        <button
            ref="notifButtonRef"
            @click.stop="toggleNotifications"
            :aria-expanded="notificationsOpen ? 'true' : 'false'"
            aria-controls="notifications-menu"
            aria-label="اعلان‌ها"
            class="hidden md:flex tap-target px-2.5 py-1.5 rounded-lg border border-token surface hover:surface-soft focus:ring-2 focus:ring-[var(--color-primary)]/30 transition relative focus:outline-none"
            type="button"
        >
          <Bell class="w-5 h-5 text-[var(--color-secondary)]" aria-hidden="true" />
          <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow badge-red-pulse-glow"
              aria-live="polite"
          >
            {{ unreadCount }}
          </span>
        </button>

        <transition name="fade">
          <div
              v-if="notificationsOpen"
              ref="notifMenuRef"
              id="notifications-menu"
              role="menu"
              class="absolute left-0 mt-2 w-72 surface rounded-lg border border-token shadow-xl z-50 overflow-hidden will-change-transform"
          >
            <div class="flex justify-between items-center px-3 py-2 border-b border-token surface-soft">
              <span class="text-sm font-semibold text-[var(--color-heading)]">اعلان‌ها</span>
              <div class="flex items-center gap-2">
                <button
                    v-if="unreadCount > 0"
                    @click="markAllRead"
                    class="text-xs text-[var(--color-primary)] hover:underline focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-1 py-0.5 focus:outline-none"
                    type="button"
                >
                  علامت‌گذاری همه خوانده شد
                </button>
                <button
                    @click="notificationsOpen=false"
                    class="rounded p-1 hover:surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none"
                    type="button"
                    aria-label="بستن منوی اعلان‌ها"
                >
                  <X class="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="max-h-72 overflow-y-auto">
              <template v-if="notifications.length">
                <div
                    v-for="n in notifications"
                    :key="n.id"
                    class="flex items-start gap-2 px-3 py-2 text-sm border-b border-token last:border-0 hover:surface-mute transition"
                    :class="!n.read ? 'surface-soft font-semibold' : 'text-[var(--color-text-secondary)]'"
                    role="menuitem"
                    tabindex="0"
                >
                  <Bell class="w-4 h-4 mt-0.5 text-[var(--color-primary)]" aria-hidden="true" />
                  <div class="flex-1">
                    <div>{{ n.text }}</div>
                    <div class="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{{ n.time }}</div>
                  </div>
                </div>
              </template>
              <div v-else class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]">
                اعلان جدیدی ندارید.
              </div>
            </div>

            <div class="px-3 py-2 text-center text-xs border-t border-token surface-soft">
              <RouterLink to="/notifications" class="text-[var(--color-primary)] hover:underline focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-1 py-0.5 focus:outline-none">
                مشاهده همه اعلان‌ها
              </RouterLink>
            </div>
          </div>
        </transition>
      </div>

      <button
          @click="logout"
          class="hidden md:flex bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500/30 transition text-sm focus:outline-none"
          type="button"
      >
        خروج
      </button>

      <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded focus:outline-none tap-target"
          type="button"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          aria-controls="mobile-nav"
          aria-label="باز کردن منوی موبایل"
      >
        <Menu class="w-6 h-6 text-[var(--color-heading)]" aria-hidden="true" />
      </button>
    </div>
  </header>

  <nav class="hidden md:flex gap-4 surface px-6 py-3 shadow-sm border-b border-token">
    <RouterLink
        v-for="link in navigationLinks"
        :key="link.to"
        :to="link.to"
        v-slot="{ href, navigate }"
        custom
    >
      <a :href="href" @click="navigate"
         :class="[ 'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none',
                   isLinkActive(link.routeName)
                   ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-md' // حالت فعال
                   : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-transparent hover:shadow-sm' // حالت عادی
                  ]"
         type="button"
      >
        <component :is="link.icon" class="w-5 h-5" aria-hidden="true" /> {{ link.label }}
      </a>
    </RouterLink>
  </nav>

  <div
      v-if="mobileMenuOpen"
      id="mobile-nav"
      class="md:hidden flex flex-col gap-2 surface px-4 py-2 shadow-lg border-b border-token"
      role="menu"
  >
    <RouterLink
        v-for="link in navigationLinks"
        :key="link.to"
        :to="link.to"
        v-slot="{isActive}"
        @click="mobileMenuOpen = false"
    >
      <button
          :class="[ 'w-full text-right flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none',
                   isActive
                   ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-md'
                   : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-transparent hover:shadow-sm'
                  ]"
          role="menuitem"
      >
        <component :is="link.icon" class="w-5 h-5" aria-hidden="true" /> {{ link.label }}
      </button>
    </RouterLink>
  </div>
</template>

<style scoped>
/* کدهای CSS مربوط به fade و badge از فایل اصلی */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.25); }
  50% { transform: scale(1.08); opacity: 0.98; box-shadow: 0 0 6px 2px rgba(239,68,68,0.2); }
}
.badge-red-pulse-glow{
  background:#ef4444;
  animation:pulse-badge 1.4s ease-in-out infinite;
}
</style>
