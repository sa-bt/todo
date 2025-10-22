import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth" // 💡 مطمئن شوید که مسیر store درست است

// --- 1. کامپوننت‌های Views ---
import Login from "@/views/Login.vue"
import Dashboard from "@/views/Dashboard.vue"
import Register from "@/views/Register.vue"
// Lazy Load کردن NotFound برای بهینه‌سازی (همانطور که قبلاً در 404 استفاده کردیم)
const NotFound = () => import("@/views/NotFound.vue")

// --- 2. کامپوننت‌های Tabهای Dashboard ---
// 💡 معمولاً بهتر است این Tabها را هم Lazy Load کنید، اما برای سادگی فعلاً Import می‌شوند.
import GoalsTab from "@/components/GoalsTab.vue"
import YearTab from "@/components/YearTab.vue"
import WeekTab from "@/components/WeekTab.vue"
import DayTab from "@/components/DayTab.vue"
import MonthTab from "@/components/MonthTab.vue"
import SettingTab from "@/components/SettingTab.vue"
import Notifications from "../views/Notifications.vue";

const routes = [
  // مسیرهای احراز هویت (Login & Register)
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { guest: true }, // فقط برای کاربرانی که لاگین نیستند
  },

  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { guest: true },
  },

  // مسیر اصلی (Dashboard Layout)
  {
    path: "/",
    component: Dashboard,
    // 💡 نام والد (dashboard) فقط به عنوان یک Layout/View استفاده می‌شود
    meta: { requiresAuth: true }, // نیاز به احراز هویت برای هر چیزی زیر این مسیر
    children: [
      // ریدایرکت پیش‌فرض: اگر به '/' رفتند، به '/goals' هدایت شوند.
      { path: "", redirect: { name: "goals" } },

      // Tabهای ناوبری هدر
      { path: "goals", name: "goals", component: GoalsTab },
      { path: "year", name: "year", component: YearTab },
      { path: "week", name: "week", component: WeekTab },
      { path: "month", name: "month", component: MonthTab },
      { path: "day", name: "day", component: DayTab },
      { path: "settings", name: "settings", component: SettingTab },
      { path: "notifications", name: "notifications", component: Notifications },
    ],

  },

  // مسیر 404 (باید در انتهای آرایه باشد)
  {
    path: '/:catchAll(.*)*', // ✅ سینتکس جدید Vue Router برای catch-all
    name: 'NotFound',
    component: NotFound
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 💡 اضافه کردن scrollBehavior برای تجربه بهتر کاربر
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },
})

// 🔥 Router Guard برای مدیریت احراز هویت و دسترسی
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // 1. اگر نیاز به احراز هویت بود و کاربر لاگین نبود → به Login هدایت کن
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login" })
  }

  // 2. اگر مسیر فقط برای مهمان بود و کاربر لاگین بود → به اهداف هدایت کن
  if (to.meta.guest && auth.isAuthenticated) {
    return next({ name: "goals" })
  }

  // 3. در غیر این صورت، اجازه دسترسی بده
  return next()
})

export default router
