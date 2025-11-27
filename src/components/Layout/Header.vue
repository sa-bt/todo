<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Home, Calendar, CalendarDays, CalendarRange, CalendarClock,
  Menu, Bell, X, Settings
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getTodayShamsi } from '@/utils/jalali'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { useSystemNotificationsStore } from '@/stores/systemNotifications'
const weekdayName = computed(() => {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
  return days[new Date().getDay()]
})
const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const shamsiDate = getTodayShamsi()
const mobileMenuOpen   = ref(false)
const notificationsOpen= ref(false)

const sysNotifs = useSystemNotificationsStore()

// اشتقاق‌ها از استور
const notifications = computed(() => sysNotifs.items)
const unreadCount   = computed(() => sysNotifs.unreadCount)
const nextPageUrl   = computed(() => sysNotifs.nextPageUrl)
const notifLoading  = computed(() => sysNotifs.loading)
const notifError    = computed(() => sysNotifs.error)

// اکشن‌های منو
function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value && !sysNotifs.items.length) {
    sysNotifs.loadFirstPage()
  }
  if (notificationsOpen.value) {
    requestAnimationFrame(() => {
      const firstBtn = notifMenuRef.value?.querySelector('button, a, [tabindex]:not([tabindex="-1"])')
      firstBtn?.focus?.()
    })
  }
}
async function onClickNotification(n) {
  if (!n.read_at) await sysNotifs.markRead(n.id)
  notificationsOpen.value = false

  if (n.url) {
    let target = n.url

    // اگر شامل http یا https بود، فقط مسیر (path) رو بگیر
    if (/^https?:\/\//.test(target)) {
      try {
        const urlObj = new URL(target)
        target = urlObj.pathname + urlObj.search + urlObj.hash
      } catch (e) {
        console.warn('Invalid URL in notification:', target)
      }
    }

    router.push(target)
  }
}

function markAllRead() { sysNotifs.markAllRead() }
function loadNextPage() { sysNotifs.loadNextPage() }

function goToDailyView() { router.push('/day') }
function logout() { auth.logout(); router.push({ name: 'login' }) }

// بیرون‌کلیک و ESC
const notifMenuRef = ref(null)
const notifButtonRef = ref(null)

function onDocumentClick(e) {
  if (!notificationsOpen.value) return
  const menu = notifMenuRef.value
  const btn  = notifButtonRef.value
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
  router.afterEach(() => { mobileMenuOpen.value = false })

  // نوتیف‌ها: شمارش، SW bridge، polling
  sysNotifs.refreshUnreadCount()
  sysNotifs.attachServiceWorkerBridge()
  sysNotifs.startUnreadPolling(45000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  sysNotifs.stopUnreadPolling()
})

// ناوبری بالا
const navigationLinks = [
  { to: '/goals', label: 'اهداف',        icon: Home,          routeName: 'goals' },
  { to: '/year',  label: 'نمای سالانه',  icon: Calendar,      routeName: 'year'  },
  { to: '/month', label: 'نمای ماهانه',  icon: CalendarRange, routeName: 'month' },
  { to: '/week',  label: 'نمای هفتگی',   icon: CalendarDays,  routeName: 'week'  },
  { to: '/day',   label: 'نمای روزانه',  icon: CalendarClock, routeName: 'day'   },
  { to: '/settings', label: 'تنظیمات',   icon: Settings,      routeName: 'settings' }
]
const isLinkActive = (routeName) => route.name === routeName
</script>

<template>
  <header class="flex justify-between items-center surface border-b border-token px-6 py-3 shadow-sm sticky top-0 z-40" dir="rtl">
    <div class="flex items-center gap-3">
      <img src="/pwa-512x512.png" alt="لوگو" class="w-10 h-10 rounded-full border border-token" />
      <RouterLink to="/goals" class="text-lg font-bold text-[var(--color-heading)]">داشبورد اهداف</RouterLink>
    </div>

    <div class="flex items-center gap-3">
      <ThemeSwitcher class="hidden lg:flex ml-3" />

     <BaseTooltip text="مشاهده روزانه" placement="bottom">
  <button
      @click="goToDailyView"
      class="hidden md:flex flex-col items-center justify-center px-3 py-2 rounded-lg border border-token surface-soft hover:surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 transition text-sm focus:outline-none"
      type="button"
  >
    <div class="flex items-center gap-1">
      <Calendar class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
      <span class="font-semibold text-[var(--color-heading)]">
        {{ shamsiDate }}
      </span>
    </div>
    <span class="text-xs font-medium text-[var(--color-primary)] mt-0.5 tracking-wide">
      {{ weekdayName }}
    </span>
  </button>
</BaseTooltip>




      <!-- نوتیف‌ها -->
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
              class="absolute left-0 mt-2 w-80 surface rounded-lg border border-token shadow-xl z-50 overflow-hidden will-change-transform"
          >
            <!-- هدر -->
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
                    @click="notificationsOpen = false"
                    class="rounded p-1 hover:surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none"
                    type="button"
                    aria-label="بستن منوی اعلان‌ها"
                >
                  <X class="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- لیست -->
            <div class="max-h-80 overflow-y-auto">
              <div v-if="notifLoading" class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]">
                در حال بارگذاری...
              </div>
              <div v-else-if="notifError" class="px-3 py-6 text-center text-xs text-red-500">
                خطا در دریافت اعلان‌ها
              </div>

              <template v-else-if="notifications.length">
                <button
                    v-for="n in notifications"
                    :key="n.id"
                    class="w-full text-right flex items-start gap-2 px-3 py-2 text-sm border-b border-token last:border-0 hover:surface-mute transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    :class="!n.read_at ? 'surface-soft font-semibold' : 'text-[var(--color-text)]'"
                    role="menuitem"
                    type="button"
                    @click="onClickNotification(n)"
                >
                  <img :src="n.icon || '/icons/notification.png'" alt="" class="w-5 h-5 mt-0.5 rounded" />
                  <div class="flex-1">
                    <div class="line-clamp-2">{{ n.title || 'اعلان' }}</div>
                    <div v-if="n.body" class="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                      {{ n.body }}
                    </div>
                    <div class="text-[10px] text-[var(--color-text-secondary)] mt-1">
                      {{ new Date(n.time || n.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }}
                    </div>
                  </div>
                </button>

                <!-- نمایش بیشتر -->
                <div v-if="nextPageUrl" class="px-3 py-2 text-center">
                  <button
                      class="text-xs text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-2 py-1"
                      @click="loadNextPage"
                      type="button"
                  >
                    نمایش بیشتر
                  </button>
                </div>
              </template>

              <div v-else class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]">
                اعلان جدیدی ندارید.
              </div>
            </div>

            <!-- فوتر -->
            <div class="px-3 py-2 text-center text-xs border-t border-token surface-soft">
              <RouterLink
                  to="/notifications"
                  class="text-[var(--color-primary)] hover:underline focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-1 py-0.5 focus:outline-none"
              >
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

  <nav class="hidden md:flex gap-4 surface px-6 py-3 shadow-sm border-b border-token" dir="rtl">
    <RouterLink
        v-for="link in navigationLinks"
        :key="link.to"
        :to="link.to"
        v-slot="{ href, navigate }"
        custom
    >
      <a
          :href="href"
          @click="navigate"
          :class="[
          'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none',
          isLinkActive(link.routeName)
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-md'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-transparent hover:shadow-sm'
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
  <!-- نمایش تاریخ و روز در موبایل -->
<div class="md:hidden flex items-center justify-center gap-2 border-y border-token surface-soft py-2">
  <Calendar class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
  <div class="flex flex-col items-center leading-tight">
    <span class="text-sm font-semibold text-[var(--color-heading)]">{{ shamsiDate }}</span>
    <span class="text-[11px] text-[var(--color-primary)] mt-0.5">{{ weekdayName }}</span>
  </div>
</div>
    <RouterLink
        v-for="link in navigationLinks"
        :key="link.to"
        :to="link.to"
        v-slot="{ isActive }"
        @click="mobileMenuOpen = false"
    >
      <button
          :class="[
          'w-full text-right flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none',
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
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.25); }
  50% { transform: scale(1.08); opacity: .98; box-shadow: 0 0 6px 2px rgba(239,68,68,0.2); }
}
.badge-red-pulse-glow { background:#ef4444; animation:pulse-badge 1.4s ease-in-out infinite; }

.line-clamp-2{ display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; -webkit-line-clamp:2; }
</style>
