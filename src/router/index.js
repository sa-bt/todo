import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"

import Login from "@/views/Login.vue"
import Dashboard from "@/views/Dashboard.vue"
import Register from "@/views/Register.vue"
import GoalsTab from "@/components/GoalsTab.vue"
import YearTab from "@/components/YearTab.vue"
import WeekTab from "@/components/WeekTab.vue"
import DayTab from "@/components/DayTab.vue"
import MonthTab from "@/components/MonthTab.vue"
import SettingTab from "@/components/SettingTab.vue"
const routes = [
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { guest: true }, // فقط برای مهمان‌ها
  },

  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { guest: true },
  },
  {
    path: "/",
    component: Dashboard,
    name: "dashboard",
    meta: { requiresAuth: true }, // فقط برای لاگین
    children: [
      { path: "goals", name: "goals", component: GoalsTab },
      { path: "year", name: "year", component: YearTab },
      { path: "week", name: "week", component: WeekTab },
      { path: "month", name: "month", component: MonthTab },
      { path: "day", name: "day", component: DayTab },
      { path: "settings", name: "settings", component: SettingTab },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 🔥 Guard
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  console.log("Router Guard:", to.name, "Auth:", auth.isAuthenticated)
  
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login" })
  }

  if (to.meta.guest && auth.isAuthenticated) {
    // اگر مهمان بود و کاربر لاگین کرده → بفرست به داشبورد
    return next({ name: "dashboard" })
  }

  return next()
})

export default router
