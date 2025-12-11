import axios from "axios"
import router from "@/router"
import { getActivePinia } from "pinia"
import { useAuthStore } from "@/stores/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: { "Content-Type": "application/json" },
})

// === Interceptors ===

api.interceptors.request.use((config) => {
  // 💡 نکته: اگر از useAuthStore() بدون getActivePinia() خارج از setup() استفاده کنید، ممکن است خطا بدهد.
  // اما در context شما (که در یک ماژول JS/TS است) معمولا نیاز به pinia instance نیست مگر اینکه store در ابتدا undefined باشد.
  const auth = useAuthStore()
  const token = auth.token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      console.log("Unauthorized access - logging out")
      const pinia = getActivePinia()
      if (pinia) {
        // برای اطمینان از دسترسی به store در context خارج از Vue component
        const auth = useAuthStore(pinia)
        auth.logout()
        router.replace("/login")
      }
    }
    // اگر 403 (Forbidden) بود (مثلاً ادمین نیست) هم می‌توان آن را هندل کرد،
    // اما گارد روتر در فرانت‌اند این کار را انجام می‌دهد.
    return Promise.reject(err)
  }
)

// === Admin API Functions ===

/**
 * متد جدید برای واکشی آمار داشبورد ادمین.
 * فرض بر این است که بک‌اند مسیر '/api/admin/stats' را محافظت کرده است.
 */
export async function getAdminStats() {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error; // خطا را پرتاب کنید تا در کامپوننت مدیریت شود
    }
}

// === Default Export ===

export default api;