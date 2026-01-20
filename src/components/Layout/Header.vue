<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Home, Calendar, CalendarDays, CalendarRange, CalendarClock,BarChart3,
  Menu, Bell, X, Settings, LogOut, 
  Shield // 🌟 آیکون جدید: برای لینک ادمین
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
const auth   = useAuthStore() // 💡 Store احراز هویت

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
    nextTick(() => { 
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
    // بستن منوی موبایل
    if (mobileMenuOpen.value) mobileMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, { passive: true })
  document.addEventListener('keydown', onKeydown)
  // بستن منوی موبایل پس از تغییر مسیر
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

// 🌟 ناوبری بالا (تبدیل به computed برای افزودن لینک ادمین)
const navigationLinks = computed(() => {
    const links = [
      { to: '/day',   label: 'نمای روزانه',  icon: CalendarClock, routeName: 'day'   },
      { to: '/week',  label: 'نمای هفتگی',   icon: CalendarDays,  routeName: 'week'  },
      // { to: '/month', label: 'نمای ماهانه',  icon: CalendarRange, routeName: 'month' },
      { to: '/year',  label: 'گزارشات',  icon: BarChart3,      routeName: 'year'  },
      { to: '/goals', label: 'اهداف',        icon: Home,          routeName: 'goals' },
      { to: '/settings', label: 'تنظیمات',   icon: Settings,      routeName: 'settings' }
    ];

    // 💡 اگر کاربر ادمین است، لینک پنل مدیریت را اضافه کن
    if (auth.isAdmin) {
      links.push({
        to: '/admin',
        label: 'پنل مدیریت',
        icon: Shield,
        routeName: 'admin'
      });
    }

    return links;
});

const isLinkActive = (routeName) => route.name === routeName
</script>

<template>
  <header 
      class="flex justify-between items-center surface border-b border-token px-6 py-3 shadow-sm sticky top-0 z-40" 
      dir="rtl"
      style="--header-height: 60px;" 
  >
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

            <div class="px-3 py-2 text-center text-xs border-t border-token surface-soft">
              <RouterLink
                  to="/notifications"
                  class="text-[var(--color-primary)] font-medium hover:underline focus:ring-2 focus:ring-[var(--color-primary)]/30 rounded px-1 py-0.5 focus:outline-none"
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

  <transition name="fade">
    <div 
        v-if="mobileMenuOpen" 
        class="fixed inset-0 bg-black/40 z-20 md:hidden" 
        @click="mobileMenuOpen = false"
        aria-hidden="true"
    ></div>
  </transition>

  <transition name="slide-right">
    <div
        v-if="mobileMenuOpen"
        id="mobile-nav"
        class="md:hidden fixed right-0 top-0 w-72 h-screen flex flex-col gap-2 surface px-4 py-2 shadow-2xl z-30 rounded-l-xl overflow-y-auto" 
        role="menu"
    >
        <div class="flex justify-between items-center py-2 mb-1 border-b border-token">
            <h2 class="text-lg font-bold text-[var(--color-heading)]">ناوبری اصلی</h2>
            <button
                @click="mobileMenuOpen = false"
                class="rounded p-1 hover:surface-mute focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none tap-target"
                type="button"
                aria-label="بستن منو"
            >
                <X class="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
            </button>
        </div>

        <div class="flex items-center justify-center gap-2 border-y border-token surface-soft py-2 rounded-lg">
          <Calendar class="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
          <div class="flex flex-col items-center leading-tight">
            <span class="text-sm font-semibold text-[var(--color-heading)]">{{ shamsiDate }}</span>
            <span class="text-[11px] text-[var(--color-primary)] mt-0.5">{{ weekdayName }}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center px-4 py-2 border-y border-token surface-soft mb-1 rounded-lg">
          <span class="text-sm font-medium text-[var(--color-text-secondary)]">انتخاب تم</span>
          <ThemeSwitcher />
        </div>

        <div class="flex-1 overflow-y-auto pt-2 pb-4">
          <RouterLink
              v-for="link in navigationLinks"
              :key="link.to"
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
            >
              <component :is="link.icon" class="w-5 h-5" aria-hidden="true" /> {{ link.label }}
            </button>
          </RouterLink>
        </div>

        <div class="pt-4 pb-2 border-t border-token bg-[var(--color-background)] sticky bottom-0">
          <div class="flex gap-2 w-full p-2 bg-[var(--color-background-soft)] rounded-lg">
            <button
              @click="router.push('/notifications'); mobileMenuOpen = false; notificationsOpen = false;" class="flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none surface-mute text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:surface-soft relative"
              role="menuitem"
              type="button"
            >
              <div class="flex items-center gap-2">
                <Bell class="w-5 h-5" aria-hidden="true" />
                <span>اعلان‌ها</span>
                <span
                    v-if="unreadCount > 0"
                    class="absolute -top-1 -right-1.5 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow badge-red-pulse-glow"
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
              <LogOut class="w-5 h-5" aria-hidden="true" />
              خروج
            </button>
          </div>
        </div>
    </div>
  </transition>
</template>

<style scoped>
/* انیمیشن محو شدن (برای کادر اعلان‌ها و پس‌زمینه موبایل) */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* انیمیشن اسلاید از راست (برای منوی موبایل) */
.slide-right-enter-active, 
.slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.slide-right-enter-from, 
.slide-right-leave-to {
  transform: translateX(100%); 
}

/* استایل‌های آیکون اعلان */
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.25); }
  50% { transform: scale(1.08); opacity: .98; box-shadow: 0 0 6px 2px rgba(239,68,68,0.2); }
}
.badge-red-pulse-glow { background:#ef4444; animation:pulse-badge 1.4s ease-in-out infinite; }

/* استایل برش متن */
.line-clamp-2{ display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; -webkit-line-clamp:2; }
</style>