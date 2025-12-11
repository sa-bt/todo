import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth" 

// --- 1. کامپوننت‌های Views ---
import Login from "@/views/Login.vue"
import Dashboard from "@/views/Dashboard.vue"
import Register from "@/views/Register.vue"
import Landing from "@/views/landing/index.vue"

// 🌟 وارد کردن کامپوننت جدید برای دوره ها
import AdminDashboardLayout from "@/views/admin/Dashboard.vue" 
import AdminReports from "@/views/admin/Reports.vue"         
import CourseList from "@/views/admin/CourseList.vue"         
import CourseDetail from "@/views/admin/Course.vue"         

const NotFound = () => import("@/views/NotFound.vue")

// --- 2. کامپوننت‌های Tabهای Dashboard ---
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
    meta: { guest: true }, 
  },

  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { guest: true },
  },

  {
    path: "/landing",
    name: "landing",
    component: Landing,
    meta: { requiresAuth: true }, 
  },

  // مسیرهای جدید ادمین
  {
    path: "/admin",
    name: "admin",
    component: AdminDashboardLayout, 
    meta: { requiresAuth: true, requiresAdmin: true }, 
    children: [
      {
        path: "",
        name: "adminSummary", 
        component: { template: '<div class="p-4">خلاصه وضعیت فعلی سیستم (مثلاً نمودارهای کلیدی)</div>' },
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "reports",
        name: "adminReports",
        component: AdminReports,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: "courses",
        name: "adminCoursesList",
        component: CourseList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
            path: 'course/:slug', 
            name: 'adminCourseDetail', // 👈 نامی که در RouterLink استفاده شده است
            component: CourseDetail, // 👈 کامپوننتی که جزئیات دوره را نمایش می‌دهد
        },
    ]
  },


  // مسیر اصلی (Dashboard Layout)
  {
    path: "/",
    component: Dashboard,
    meta: { requiresAuth: true }, 
    children: [
      { path: "", redirect: { name: "day" } },

      { path: "goals", name: "goals", component: GoalsTab },
      { path: "year", name: "year", component: YearTab },
      { path: "week", name: "week", component: WeekTab },
      { path: "month", name: "month", component: MonthTab },
      { path: "day", name: "day", component: DayTab },
      { path: "settings", name: "settings", component: SettingTab },
      { path: "notifications", name: "notifications", component: Notifications },
    ],

  },

  // مسیر 404
  {
    path: '/:catchAll(.*)*', 
    name: 'NotFound',
    component: NotFound
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login" })
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    console.warn(`Access Denied for user ${auth.user?.name} (Role: ${auth.user?.role}) attempting to access ${to.path}`);
    return next({ name: "goals" }) 
  }

  if (to.meta.guest && auth.isAuthenticated) {
    if (auth.isAdmin) {
      return next({ name: "admin" })
    }
    return next({ name: "day" })
  }

  return next()
})

export default router