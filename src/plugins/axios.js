import axios from "axios"
import router from "@/router"
import { getActivePinia } from "pinia"
import { useAuthStore } from "@/stores/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8085/api",
  headers: { "Content-Type": "application/json" },
})

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
      console.log("Unauthorized access - logging out")
      const pinia = getActivePinia()
      if (pinia) {
        const auth = useAuthStore(pinia)
        auth.logout()
        router.replace("/login")
      }
    }
    return Promise.reject(err)
  }
)

export default api
