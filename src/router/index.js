import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applySeo } from '@/utils/seo'
import { isAdminHost, isStandaloneApp } from '@/utils/appHost'

/*
 * همه صفحه‌ها تنبل بارگذاری می‌شوند: هر مسیر فقط وقتی از شبکه گرفته می‌شود که
 * کاربر واقعاً به آن برود. قبلاً همه‌شان به‌صورت مستقیم وارد می‌شدند، پس کسی
 * که فقط صفحه معرفی را می‌دید، کل بخش مدیر و کارت سال را هم بارگیری می‌کرد.
 *
 * نکته: صفحه ورود در دو مسیر مصرف می‌شود، ولی چون هر دو به یک تابع اشاره
 * می‌کنند، یک بسته مشترک می‌گیرند نه دو بسته.
 */

// --- 1. کامپوننت‌های Views ---
const Login = () => import('@/views/Login.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const Register = () => import('@/views/Register.vue')
const Landing = () => import('@/views/landing/index.vue')

// 🌟 وارد کردن کامپوننت جدید برای دوره ها
const AdminDashboardLayout = () => import('@/views/admin/Dashboard.vue')
const AdminHome = () => import('@/views/admin/Home.vue')
const AdminReports = () => import('@/views/admin/Reports.vue')
const AdminContents = () => import('@/views/admin/Contents.vue')
const AdminUsers = () => import('@/views/admin/Users.vue')
const AdminContacts = () => import('@/views/admin/Contacts.vue')
const AdminNotifications = () => import('@/views/admin/AdminNotifications.vue')
const CourseList = () => import('@/views/admin/CourseList.vue')
const CourseDetail = () => import('@/views/admin/Course.vue')

const NotFound = () => import('@/views/NotFound.vue')

// --- 2. کامپوننت‌های Tabهای Dashboard ---
const GoalsTab = () => import('@/components/GoalsTab.vue')
const YearTab = () => import('@/components/YearTab.vue')
const WeekTab = () => import('@/components/WeekTab.vue')
const DayTab = () => import('@/components/DayTab.vue')
const MonthTab = () => import('@/components/MonthTab.vue')
const SettingTab = () => import('@/components/SettingTab.vue')
const Notifications = () => import('@/views/Notifications.vue')

// کارت سال، صفحه جداگانه‌ای است نه یکی از تب‌های گزارش.
const YearReview = () => import('@/views/YearReview.vue')

const routes = [
  {
    path: '/',
    redirect: () => ({
      name: 'landing',
      params: { locale: localStorage.getItem('lang') === 'en' ? 'en' : 'fa' },
    }),
  },

  // مسیرهای احراز هویت (Login & Register)
  {
    path: '/vorod',
    name: 'login',
    component: Login,
    meta: { guest: true },
  },

  {
    path: '/sabtenam',
    name: 'register',
    component: Register,
    meta: { guest: true },
  },

  {
    path: '/:locale(fa|en)',
    name: 'landing',
    component: Landing,
    props: true,
    meta: { guest: true },
  },

  {
    path: '/admin/entry',
    name: 'adminEntry',
    redirect: (to) => ({ name: 'adminLogin', query: to.query }),
  },

  {
    path: '/admin/login',
    name: 'adminLogin',
    component: Login,
    meta: { guest: true, adminApp: true },
  },

  // مسیرهای جدید ادمین
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboardLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'adminSummary',
        component: AdminHome,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'reports',
        name: 'adminReports',
        component: AdminReports,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'adminUsers',
        component: AdminUsers,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'contacts',
        name: 'adminContacts',
        component: AdminContacts,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'notifications',
        name: 'adminNotifications',
        component: AdminNotifications,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'contents',
        name: 'adminContents',
        component: AdminContents,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'courses',
        name: 'adminCoursesList',
        component: CourseList,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'course/:slug',
        name: 'adminCourseDetail', // 👈 نامی که در RouterLink استفاده شده است
        component: CourseDetail, // 👈 کامپوننتی که جزئیات دوره را نمایش می‌دهد
      },
    ],
  },

  // مسیر اصلی (Dashboard Layout)
  {
    path: '/app',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: 'day', redirect: { name: 'day' } },

      { path: 'goals', name: 'goals', component: GoalsTab },
      { path: 'year', name: 'year', component: YearTab },
      { path: 'year-review', name: 'yearReview', component: YearReview },
      { path: 'week', name: 'week', component: WeekTab },
      { path: 'month', name: 'month', component: MonthTab },
      { path: 'day', name: 'day', component: DayTab },
      { path: 'settings', name: 'settings', component: SettingTab },
      { path: 'notifications', name: 'notifications', component: Notifications },
    ],
  },

  // مسیر 404
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: NotFound,
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

  // The admin PWA lives on its own origin. Even an old installation whose
  // saved start URL points to a user route must reload the dedicated admin
  // document. A client-side redirect is not enough because it would keep the
  // user manifest from the document initially served at `/`.
  if (isAdminHost() && !to.path.startsWith('/admin')) {
    window.location.replace('/admin')
    return next(false)
  }

  // Existing user installations may still have the old `/` start URL. Keep
  // the public website unchanged in a normal browser, but open the installed
  // user app on its authenticated workspace.
  if (to.path === '/' && isStandaloneApp()) {
    return next({ name: auth.isAuthenticated ? 'day' : 'login', replace: true })
  }

  if (to.name === 'landing') {
    to.meta.locale = to.params.locale
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    if (to.meta.requiresAdmin || to.path.startsWith('/admin')) {
      return next({ name: 'adminLogin', query: { redirect: to.fullPath } })
    }

    return next({ name: 'login' })
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    console.warn(
      `Access Denied for user ${auth.user?.name} (Role: ${auth.user?.role}) attempting to access ${to.path}`,
    )

    // اینجا سند پنل مدیریت بالا آمده است، نه اپ کاربر. فرستادن کاربر عادی به
    // نمای روزانه یعنی اپ کاربر داخل پنجره‌ی پنل باز شود؛ همان چیزی که آیکن
    // فوتر را بی‌اثر می‌کرد. جای درست، فرم ورود مدیر است.
    if (to.path.startsWith('/admin')) {
      return next({ name: 'adminLogin', query: { redirect: to.fullPath } })
    }

    return next({ name: 'goals' })
  }

  if (to.meta.guest && to.name !== 'landing' && auth.isAuthenticated) {
    if (auth.isAdmin) {
      return next({ name: 'admin' })
    }

    // نشست کاربر عادی، «ورود انجام‌شده» برای پنل مدیریت نیست. اگر اینجا هم به اپ
    // کاربر برگردانده شود، هر کسی که با حساب عادی وارد شده باشد با کلیک روی آیکن
    // پنل در فوتر، دوباره اپ کاربر را می‌بیند و فرم ورود مدیر هرگز باز نمی‌شود.
    // خود صفحه ورود، اگر حساب واردشده مدیر نباشد نشست تازه را باطل می‌کند.
    if (!to.meta.adminApp) {
      return next({ name: 'day' })
    }
  }

  return next()
})

router.afterEach((to) => {
  applySeo(to)
})

export default router
