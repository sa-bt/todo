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
            console.log("Unauthorized access - clearing token")
            const pinia = getActivePinia()
            if (pinia) {
                const auth = useAuthStore(pinia)

                // 1. همیشه توکن نامعتبر را پاک کن
                auth.logout()

                // 2. 🌟 فقط اگر روت فعلی نیاز به احراز هویت داشت، به لاگین هدایت کن
                const currentRoute = router.currentRoute.value

                // بررسی می‌کنیم که آیا متا requiresAuth دارد یا نه
                // همچنین چک می‌کنیم که الان تو صفحه لاگین نباشیم (برای جلوگیری از لوپ)
                if (currentRoute.meta.requiresAuth && currentRoute.name !== 'login') {
                    router.replace("/vorod")
                }
            }
        }
        return Promise.reject(err)
    }
)

// === Admin API Functions ===
export async function getAdminStats() {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
}

export default api;
