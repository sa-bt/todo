import axios from "axios";
import router from "@/router";
import { getActivePinia } from "pinia";
import { useAuthStore } from "@/stores/auth";

// ایجاد یک نمونه Axios با تنظیمات پایه
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// === Interceptors ===

// تزریق توکن احراز هویت (Bearer Token) در تمام درخواست‌ها
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  const token = auth.token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// مدیریت پاسخ‌ها (عموماً برای خطای 401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // اگر خطای 401 (Unauthorized) بود، کاربر را خارج کن
    if (err.response && err.response.status === 401) {
      console.log("Unauthorized access - logging out");
      const pinia = getActivePinia();
      if (pinia) {
        const auth = useAuthStore(pinia);
        auth.logout();
        router.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

// === Admin API Functions (توابع واکشی داده برای پنل مدیریت) ===

/**
 * واکشی آمار کلی داشبورد ادمین
 * @returns {Promise<Object>}
 */
export async function getAdminStats() {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
}

/**
 * واکشی داده‌های یک دوره آموزشی خاص بر اساس slug
 * مسیر بک‌اند: GET /api/admin/course/{slug}
 * @param {string} slug - شناسه منحصر به فرد دوره (مثلاً 'git-stash')
 * @returns {Promise<Object>}
 */
export async function getCourseData(slug) {
    try {
        // فرانت‌اند انتظار دارد داده‌های دوره در data.data باشند
        const response = await api.get(`/admin/course/${slug}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching course data for ${slug}:`, error);
        throw error;
    }
}

/**
 * واکشی فهرست تمام دوره‌های موجود
 * مسیر بک‌اند: GET /api/admin/courses/list
 * @returns {Promise<Array<Object>>}
 */
export async function getCourseList() {
    try {
        const response = await api.get('/admin/courses/list');
        // انتظار داریم API فهرست را در data.data برگرداند
        return response.data.data; 
    } catch (error) {
        console.error("Error fetching course list:", error);
        throw error;
    }
}


// === Default Export ===

export default api;