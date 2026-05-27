<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'

import {
  Target,
  Calendar,
  CalendarDays,
  CalendarFold,
  CalendarClock,
  BarChart3,
  Menu,
  Bell,
  X,
  Settings,
  LogOut,
  Shield,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getTodayShamsi } from '@/utils/jalali'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { useSystemNotificationsStore } from '@/stores/systemNotifications'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sysNotifs = useSystemNotificationsStore()

const shamsiDate = getTodayShamsi()

const mobileMenuOpen = ref(false)
const notificationsOpen = ref(false)

const notifMenuRef = ref(null)
const notifButtonRef = ref(null)

let removeAfterEach = null

const weekdayName = computed(() => {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
  return days[new Date().getDay()]
})

const notifications = computed(() => sysNotifs.items)
const unreadCount = computed(() => sysNotifs.unreadCount)
const notifLoading = computed(() => sysNotifs.loading)
const notifError = computed(() => sysNotifs.error)

const navigationLinks = computed(() => {
  const links = [
    {
      to: { name: 'day' },
      label: 'نمای روزانه',
      icon: CalendarClock,
      routeName: 'day',
    },

    {
      to: { name: 'week' },
      label: 'نمای هفتگی',
      icon: CalendarDays,
      routeName: 'week',
    },
    {
      to: { name: 'month' },
      label: 'نمای ماهانه',
      icon: CalendarFold,
      routeName: 'month',
    },
    {
      to: { name: 'goals' },
      label: 'اهداف',
      icon: Target,
      routeName: 'goals',
    },

    {
      to: { name: 'year' },
      label: 'گزارشات',
      icon: BarChart3,
      routeName: 'year',
    },
    {
      to: { name: 'settings' },
      label: 'تنظیمات',
      icon: Settings,
      routeName: 'settings',
    },
  ]

  if (auth.isAdmin) {
    links.push({
      to: { name: 'admin' },
      label: 'پنل مدیریت',
      icon: Shield,
      routeName: 'admin',
    })
  }

  return links
})

function isLinkActive(routeName) {
  return route.name === routeName || route.matched.some((matchedRoute) => matchedRoute.name === routeName)
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value

  if (notificationsOpen.value && !sysNotifs.items.length) {
    sysNotifs.loadFirstPage()
  }

  if (notificationsOpen.value) {
    nextTick(() => {
      const firstFocusable = notifMenuRef.value?.querySelector(
        'button, a, [tabindex]:not([tabindex="-1"])'
      )

      firstFocusable?.focus?.()
    })
  }
}

async function onClickNotification(notification) {
  if (!notification.read_at) {
    await sysNotifs.markRead(notification.id)
  }

  notificationsOpen.value = false

  if (!notification.url) return

  let target = notification.url

  if (/^https?:\/\//.test(target)) {
    try {
      const urlObj = new URL(target)

      if (urlObj.origin === window.location.origin) {
        target = urlObj.pathname + urlObj.search + urlObj.hash
        router.push(target)
      } else {
        window.open(target, '_blank', 'noopener,noreferrer')
      }

      return
    } catch (error) {
      console.warn('Invalid URL in notification:', target)
      return
    }
  }

  /**
   * نکته:
   * URL اعلان‌ها از بک‌اند میاد و الزاماً route name نیست.
   * routeهای ثابت خود Header با name مقداردهی شدن.
   * برای notification url فعلاً path-based می‌مونه مگر اینکه بک‌اند route_name برگردونه.
   */
  router.push(target)
}

async function markAllRead() {
  await sysNotifs.markAllRead()
}

function goToDailyView() {
  router.push({ name: 'day' })
}

function goToNotifications() {
  notificationsOpen.value = false
  mobileMenuOpen.value = false

  router.push({ name: 'notifications' })
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}

function formatNotificationDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function onDocumentClick(event) {
  if (!notificationsOpen.value) return

  const menu = notifMenuRef.value
  const button = notifButtonRef.value
  const target = event.target

  if (menu && !menu.contains(target) && button && !button.contains(target)) {
    notificationsOpen.value = false
  }
}

function onKeydown(event) {
  if (event.key !== 'Escape') return

  if (notificationsOpen.value) {
    notificationsOpen.value = false
    notifButtonRef.value?.focus?.()
  }

  if (mobileMenuOpen.value) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)

  removeAfterEach = router.afterEach(() => {
    mobileMenuOpen.value = false
    notificationsOpen.value = false
  })

  sysNotifs.refreshUnreadCount()
  sysNotifs.attachServiceWorkerBridge()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)

  removeAfterEach?.()
  removeAfterEach = null

  sysNotifs.detachServiceWorkerBridge()
})
</script>

<template>
  <header
    class="flex justify-between items-center surface border-b border-token px-6 py-3 shadow-sm sticky top-0 z-40"
    dir="rtl"
    style="--header-height: 60px;"
  >
    <div class="flex items-center gap-3">
      <img
        src="/pwa-512x512.png"
        alt="لوگو"
        class="w-10 h-10 rounded-full border border-token"
      />

      <RouterLink
        :to="{ name: 'goals' }"
        class="text-lg font-bold text-[var(--color-heading)]"
      >
        داشبورد اهداف
      </RouterLink>
    </div>

    <div class="flex items-center gap-3">
      <ThemeSwitcher class="hidden lg:flex ml-3" />

      <BaseTooltip text="مشاهده روزانه" placement="bottom">
        <button
          @click="goToDailyView"
          class="hidden md:flex flex-col items-center justify-center px-3 py-2 rounded-lg border border-token surface-soft hover-surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 transition text-sm focus:outline-none"
          type="button"
        >
          <div class="flex items-center gap-1">
            <Calendar
              class="w-4 h-4 text-[var(--color-primary)]"
              aria-hidden="true"
            />

            <span class="font-semibold text-[var(--color-heading)]">
              {{ shamsiDate }}
            </span>
          </div>

          <span class="text-xs font-medium text-[var(--color-primary)] mt-0.5 tracking-wide">
            {{ weekdayName }}
          </span>
        </button>
      </BaseTooltip>

      <div class="relative">
        <button
          ref="notifButtonRef"
          @click.stop="toggleNotifications"
          :aria-expanded="notificationsOpen ? 'true' : 'false'"
          aria-controls="notifications-menu"
          aria-label="اعلان‌ها"
          class="hidden md:flex tap-target px-2.5 py-1.5 rounded-lg border border-token surface hover-surface-soft focus:ring-2 focus:ring-[var(--color-primary)]/30 transition relative focus:outline-none"
          type="button"
        >
          <Bell
            class="w-5 h-5 text-[var(--color-secondary)]"
            aria-hidden="true"
          />

          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow badge-red-pulse-glow"
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
            <div class="flex justify-between items-center px-3 py-2 border-b border-token surface-soft">
              <span class="text-sm font-semibold text-[var(--color-heading)]">
                اعلان‌ها
              </span>

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
                  class="rounded p-1 hover-surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none"
                  type="button"
                  aria-label="بستن منوی اعلان‌ها"
                >
                  <X
                    class="w-4 h-4 text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div class="max-h-80 overflow-y-auto">
              <div
                v-if="notifLoading"
                class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]"
              >
                در حال بارگذاری...
              </div>

              <div
                v-else-if="notifError"
                class="px-3 py-6 text-center text-xs text-red-500"
              >
                خطا در دریافت اعلان‌ها
              </div>

              <template v-else-if="notifications.length">
                <button
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="w-full text-right flex items-start gap-2 px-3 py-2 text-sm border-b border-token last:border-0 hover-surface-mute transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  :class="!notification.read_at ? 'surface-soft font-semibold' : 'text-[var(--color-text)]'"
                  role="menuitem"
                  type="button"
                  @click="onClickNotification(notification)"
                >
                  <img
                    :src="notification.icon || '/icons/notification.png'"
                    alt=""
                    class="w-5 h-5 mt-0.5 rounded"
                  />

                  <div class="flex-1 min-w-0">
                    <div class="line-clamp-2 text-[var(--color-heading)]">
                      {{ notification.title || 'اعلان' }}
                    </div>

                    <div
                      v-if="notification.body"
                      class="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2"
                    >
                      {{ notification.body }}
                    </div>

                    <div class="text-[10px] text-[var(--color-text-secondary)] mt-1">
                      {{ formatNotificationDateTime(notification.time || notification.created_at) }}
                    </div>
                  </div>
                </button>
              </template>

              <div
                v-else
                class="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]"
              >
                اعلان جدیدی ندارید.
              </div>
            </div>

            <div class="px-3 py-2 text-center text-xs border-t border-token surface-soft">
              <RouterLink
                :to="{ name: 'notifications' }"
                class="text-[var(--color-primary)] font-medium hover:underline focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-1 py-0.5 focus:outline-none"
                @click="notificationsOpen = false"
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
        <Menu
          class="w-6 h-6 text-[var(--color-heading)]"
          aria-hidden="true"
        />
      </button>
    </div>
  </header>

  <nav
    class="hidden md:flex gap-4 surface px-6 py-3 shadow-sm border-b border-token"
    dir="rtl"
  >
    <RouterLink
      v-for="link in navigationLinks"
      :key="String(link.routeName)"
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
      >
        <component
          :is="link.icon"
          class="w-5 h-5"
          aria-hidden="true"
        />

        {{ link.label }}
      </a>
    </RouterLink>
  </nav>

  <transition name="fade">
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-black/40 z-20 md:hidden"
      @click="mobileMenuOpen = false"
      aria-hidden="true"
    />
  </transition>

  <transition name="slide-right">
    <div
      v-if="mobileMenuOpen"
      id="mobile-nav"
      class="md:hidden fixed right-0 top-0 w-72 h-screen flex flex-col gap-2 surface px-4 py-2 shadow-2xl z-30 rounded-l-xl overflow-y-auto"
      role="menu"
      dir="rtl"
    >
      <div class="flex justify-between items-center py-2 mb-1 border-b border-token">
        <h2 class="text-lg font-bold text-[var(--color-heading)]">
          ناوبری اصلی
        </h2>

        <button
          @click="mobileMenuOpen = false"
          class="rounded p-1 hover-surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none tap-target"
          type="button"
          aria-label="بستن منو"
        >
          <X
            class="w-5 h-5 text-[var(--color-text-secondary)]"
            aria-hidden="true"
          />
        </button>
      </div>

      <button
        @click="goToDailyView"
        type="button"
        class="flex items-center justify-center gap-2 border-y border-token surface-soft py-2 rounded-lg"
      >
        <Calendar
          class="w-4 h-4 text-[var(--color-primary)]"
          aria-hidden="true"
        />

        <div class="flex flex-col items-center leading-tight">
          <span class="text-sm font-semibold text-[var(--color-heading)]">
            {{ shamsiDate }}
          </span>

          <span class="text-[11px] text-[var(--color-primary)] mt-0.5">
            {{ weekdayName }}
          </span>
        </div>
      </button>

      <div class="flex justify-between items-center px-4 py-2 border-y border-token surface-soft mb-1 rounded-lg">
        <span class="text-sm font-medium text-[var(--color-text-secondary)]">
          انتخاب تم
        </span>

        <ThemeSwitcher />
      </div>

      <div class="flex-1 overflow-y-auto pt-2 pb-4">
        <RouterLink
          v-for="link in navigationLinks"
          :key="String(link.routeName)"
          :to="link.to"
          v-slot="{ isActive }"
          @click="mobileMenuOpen = false"
          dir="rtl"
        >
          <button
            :class="[
              'w-full text-right flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none',
              isActive
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-md'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-transparent hover:shadow-sm'
            ]"
            role="menuitem"
            type="button"
          >
            <component
              :is="link.icon"
              class="w-5 h-5"
              aria-hidden="true"
            />

            {{ link.label }}
          </button>
        </RouterLink>
      </div>

      <div class="pt-4 pb-2 border-t border-token bg-[var(--color-background)] sticky bottom-0">
        <div class="flex gap-2 w-full p-2 bg-[var(--color-background-soft)] rounded-lg">
          <button
            @click="goToNotifications"
            class="flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none surface-mute text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover-surface-soft relative"
            role="menuitem"
            type="button"
          >
            <div class="flex items-center gap-2">
              <Bell
                class="w-5 h-5"
                aria-hidden="true"
              />

              <span>اعلان‌ها</span>

              <span
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1.5 text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow badge-red-pulse-glow"
                aria-live="polite"
              >
                {{ unreadCount }}
              </span>
            </div>
          </button>

          <button
            @click="logout"
            class="flex-1 justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-red-500/30 focus:outline-none bg-red-500 hover:bg-red-600 text-white shadow-md"
            role="menuitem"
            type="button"
          >
            <LogOut
              class="w-5 h-5"
              aria-hidden="true"
            />

            خروج
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

@keyframes pulse-badge {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25);
  }

  50% {
    transform: scale(1.08);
    opacity: .98;
    box-shadow: 0 0 6px 2px rgba(239, 68, 68, 0.2);
  }
}

.badge-red-pulse-glow {
  background: #ef4444;
  animation: pulse-badge 1.4s ease-in-out infinite;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 2;
}

.hover-surface-mute:hover {
  background: color-mix(in oklab, var(--color-background) 85%, black 8%);
}

.hover-surface-soft:hover {
  background: var(--color-background-soft);
}

.surface-mute {
  background: color-mix(in oklab, var(--color-background) 85%, black 8%);
}
</style>