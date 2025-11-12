import { defineStore } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import api from "../plugins/axios.js";

export const useSystemNotificationsStore = defineStore('systemNotifications', {
    state: () => ({
        items: [],
        unreadCount: 0,
        nextPageUrl: null,
        loading: false,
        error: null,
        perPage: 10,

        _pollTimer: null,
        _attachedSW: false,
    }),

    getters: {
        hasMore: (s) => !!s.nextPageUrl,
        unreadItems: (s) => s.items.filter(n => !n.read_at),
    },

    actions: {
        // --- Helpers ---
        _toast() { return useNotificationStore() },

        _extractListResponse(payload) {
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
                this.unreadCount = data?.data?.count ?? data?.count ?? 0
            } catch (err) {
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

                // ✅ Toast موفقیت
                this._toast().setNotification({
                    type: 'success',
                    icon: 'check-circle',
                    message: 'اعلان به عنوان خوانده شده علامت خورد ✅',
                    duration: 3000
                })
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

                // ✅ Toast موفقیت
                this._toast().setNotification({
                    type: 'info',
                    icon: 'check-check',
                    message: 'همهٔ اعلان‌ها خوانده شدند 📬',
                    sound: false,
                    duration: 3500
                })
            } catch (err) {
                this._toast().handleApiError(err)
            }
        },

        async destroy(id) {
            try {
                await api.delete(`/notifications/${id}`)
                this.items = this.items.filter(n => n.id !== id)

                // ✅ Toast موفقیت
                this._toast().setNotification({
                    type: 'warning',
                    icon: 'trash-2',
                    message: 'اعلان حذف شد 🗑️',
                    sound: false,
                    duration: 3000
                })
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

                // ✅ Toast موفقیت
                this._toast().setNotification({
                    type: 'warning',
                    icon: 'trash',
                    message: 'تمام اعلان‌ها حذف شدند 🗑️',
                    sound: false,
                    duration: 4000
                })
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
                this.items = [n, ...this.items].slice(0, this.perPage)
                this.unreadCount++

                // ✅ Toast هنگام دریافت نوتیف جدید
                this._toast().setNotification({
                    type: 'info',
                    icon: 'bell',
                    message: `اعلان جدید: ${n.title}`,
                    duration: 4500
                })
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
