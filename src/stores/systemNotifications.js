import { defineStore } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import api from "../plugins/axios.js";

export const useSystemNotificationsStore = defineStore('systemNotifications', {
    state: () => ({
        items: [],            // لیست برای منوی هدر/صفحه
        unreadCount: 0,
        nextPageUrl: null,    // صفحه بعدی (pagination)
        loading: false,
        error: null,
        perPage: 10,

        _pollTimer: null,     // polling unread count
        _attachedSW: false,   // جلوگیری از دوبار bind شدن به Service Worker
    }),

    getters: {
        hasMore: (s) => !!s.nextPageUrl,
        unreadItems: (s) => s.items.filter(n => !n.read_at),
    },

    actions: {
        // --- Helpers ---
        _toast() { return useNotificationStore() },

        // اگر خروجی successResponse شما data/meta را wrap می‌کند:
        _extractListResponse(payload) {
            // پشتیبانی از هر دو حالت: {data:[...], meta:{...}} یا خود آرایه
            const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
            const meta = payload?.meta ?? null
            return { list, meta }
        },

        // --- API ---
        async loadFirstPage() {
            this.loading = true
            this.error = null
            try {
                const { data } = await api.get('/notifications', {
                    params: { per_page: this.perPage, page: 1 }
                })
                const { list, meta } = this._extractListResponse(data.data)
                this.items = list
                this.nextPageUrl = meta?.next_page_url ?? null
                await this.refreshUnreadCount()
            } catch (err) {
                this.error = err?.message || 'خطا در دریافت اعلان‌ها'
                // toast خطا
                this._toast().handleApiError(err)
            } finally {
                this.loading = false
            }
        },

        async loadNextPage() {
            if (!this.nextPageUrl) return
            try {
                const { data } = await api.get(this.nextPageUrl)
                const { list, meta } = this._extractListResponse(data.data)
                this.items = [...this.items, ...list]
                this.nextPageUrl = meta?.next_page_url ?? null
            } catch (err) {
                console.warn('loadNextPage error', err)
                this._toast().handleApiError(err)
            }
        },

        async refreshUnreadCount() {
            try {
                const { data } = await api.get('/notifications/unread-count')
                // successResponse ممکنه مقدار رو داخل data بذاره
                this.unreadCount = data?.data?.count ?? data?.count ?? 0
            } catch (err) {
                // فقط لگ و نمایش اختیاری
                console.warn('refreshUnreadCount error', err)
            }
        },

        async markRead(id) {
            try {
                const { data } = await api.post(`/notifications/${id}/read`)
                const updated = data?.data ?? data
                const idx = this.items.findIndex(n => n.id === id)
                if (idx !== -1) this.items[idx] = updated
                if (this.unreadCount > 0) this.unreadCount--
            } catch (err) {
                this._toast().handleApiError(err)
            }
        },

        async markAllRead() {
            try {
                await api.post('/notifications/read-all')
                const nowIso = new Date().toISOString()
                this.items = this.items.map(n => ({ ...n, read_at: n.read_at || nowIso }))
                this.unreadCount = 0
            } catch (err) {
                this._toast().handleApiError(err)
            }
        },

        async destroy(id) {
            try {
                await api.delete(`/notifications/${id}`)
                this.items = this.items.filter(n => n.id !== id)
            } catch (err) {
                this._toast().handleApiError(err)
            }
        },

        async destroyAll() {
            try {
                await api.delete('/notifications')
                this.items = []
                this.unreadCount = 0
                this.nextPageUrl = null
            } catch (err) {
                this._toast().handleApiError(err)
            }
        },

        // --- Realtime Bridge via Service Worker ---
        attachServiceWorkerBridge() {
            if (this._attachedSW) return
            if (!('serviceWorker' in navigator)) return

            navigator.serviceWorker.addEventListener('message', (event) => {
                const payload = event.data || {}
                if (payload.__kind !== 'webpush') return

                const n = {
                    id: payload.id || crypto.randomUUID(),
                    title: payload.title || 'اعلان',
                    body: payload.body || '',
                    url: payload.url || '/',
                    icon: payload.icon || '/icons/notification.png',
                    tag: payload.tag || null,
                    type: payload.type || 'generic',
                    meta: payload.meta || {},
                    time: new Date().toISOString(),
                    read_at: null
                }
                // prepend & clamp to perPage
                this.items = [n, ...this.items].slice(0, this.perPage)
                this.unreadCount++
            })

            this._attachedSW = true
        },

        // --- Polling ---
        startUnreadPolling(intervalMs = 45000) {
            this.stopUnreadPolling()
            this._pollTimer = setInterval(() => this.refreshUnreadCount(), intervalMs)
        },
        stopUnreadPolling() {
            if (this._pollTimer) {
                clearInterval(this._pollTimer)
                this._pollTimer = null
            }
        },

        // --- Utils ---
        resetAll() {
            this.items = []
            this.unreadCount = 0
            this.nextPageUrl = null
            this.loading = false
            this.error = null
            this.stopUnreadPolling()
            this._attachedSW = false
        },
    }
})
