import axios from 'axios'
import router from '@/router'
import { getActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// ایجاد یک نمونه Axios با تنظیمات پایه
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// === Interceptors ===

// تزریق توکن احراز هویت (Bearer Token) در تمام درخواست‌ها
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  const token = auth.token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// مدیریت پاسخ‌ها (عموماً برای خطای 401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // اگر خطای 401 (Unauthorized) بود، کاربر را خارج کن
    if (err.response && err.response.status === 401) {
      console.log('Unauthorized access - logging out')
      const pinia = getActivePinia()
      if (pinia) {
        const auth = useAuthStore(pinia)
        auth.logout()
        router.replace('/vorod')
      }
    }
    return Promise.reject(err)
  },
)

// === Admin API Functions (توابع واکشی داده برای پنل مدیریت) ===

/**
 * واکشی آمار کلی داشبورد ادمین
 * @returns {Promise<Object>}
 */
export async function getAdminStats() {
  try {
    const response = await api.get('/api/admin/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    throw error
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
    const response = await api.get(`/admin/course/${slug}`)
    return response.data.data
  } catch (error) {
    console.error(`Error fetching course data for ${slug}:`, error)
    throw error
  }
}

/**
 * واکشی فهرست تمام دوره‌های موجود
 * مسیر بک‌اند: GET /api/admin/courses/list
 * @returns {Promise<Array<Object>>}
 */
export async function getCourseList() {
  try {
    const response = await api.get('/admin/courses/list')
    // انتظار داریم API فهرست را در data.data برگرداند
    return response.data.data
  } catch (error) {
    console.error('Error fetching course list:', error)
    throw error
  }
}

export async function getAdminContents(params = {}) {
  try {
    const response = await api.get('/admin/contents', { params })
    return response.data.data
  } catch (error) {
    console.error('Error fetching admin contents:', error)
    throw error
  }
}

export async function createAdminContent(payload) {
  try {
    const response = await api.post('/admin/contents', payload)
    return response.data.data
  } catch (error) {
    console.error('Error creating admin content:', error)
    throw error
  }
}

export async function updateAdminContent(id, payload) {
  try {
    const response = await api.put(`/admin/contents/${id}`, payload)
    return response.data.data
  } catch (error) {
    console.error(`Error updating admin content ${id}:`, error)
    throw error
  }
}

/**
 * واکشی آمار بازدید برای پنل مدیریت
 * مسیرهای بک‌اند: GET /api/admin/analytics/{daily|weekly|overview}
 * @param {'daily'|'weekly'|'overview'} period - نمای روزانه، هفتگی یا بازه دلخواه
 * @param {Object} params - برای روزانه و هفتگی `date` و برای بازه دلخواه `from` و `to`
 * @returns {Promise<Object>}
 */
export async function getVisitAnalytics(period, params = {}) {
  try {
    const response = await api.get(`/admin/analytics/${period}`, { params })
    return response.data.data
  } catch (error) {
    console.error(`Error fetching visit analytics for ${period}:`, error)
    throw error
  }
}

export async function deleteAdminContent(id) {
  try {
    await api.delete(`/admin/contents/${id}`)
  } catch (error) {
    console.error(`Error deleting admin content ${id}:`, error)
    throw error
  }
}

export async function getAdminDashboard() {
  const response = await api.get('/admin/dashboard')
  return response.data
}

export async function getAdminUsers(params = {}) {
  const response = await api.get('/admin/users', { params })
  return response.data
}

export async function getAdminUser(id) {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

export async function updateAdminUserRole(id, role) {
  const response = await api.patch(`/admin/users/${id}/role`, { role })
  return response.data
}

export async function approveAdminUser(id) {
  const response = await api.post(`/admin/users/${id}/approve`)
  return response.data
}

export async function rejectAdminUser(id) {
  const response = await api.post(`/admin/users/${id}/reject`)
  return response.data
}

/**
 * Revokes this device's token on the server.
 *
 * Deliberately separate from the store's logout(): that one also runs from the
 * 401 interceptor, so issuing a request there could turn one 401 into a loop.
 */
export async function logoutRequest() {
  const response = await api.post('/logout')
  return response.data
}

export async function getAdminContacts(params = {}) {
  const response = await api.get('/admin/contacts', { params })
  return response.data
}

export async function updateAdminContact(id, payload) {
  const response = await api.patch(`/admin/contacts/${id}`, payload)
  return response.data
}

export async function getAdminNotificationCampaigns(params = {}) {
  const response = await api.get('/admin/notification-campaigns', { params })
  return response.data
}

export async function sendAdminNotification(payload) {
  const response = await api.post('/admin/notification-campaigns', payload)
  return response.data
}

// === Default Export ===

export default api
