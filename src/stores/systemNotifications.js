import { defineStore } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import api from '../plugins/axios.js'

export const useSystemNotificationsStore = defineStore('systemNotifications', {
  state: () => ({
    items: [],
    unreadCount: 0,

    nextPageUrl: null,

    loading: false,
    loadingMore: false,

    error: null,
    perPage: 10,

    _pollTimer: null,
    _attachedSW: false,
    _swMessageHandler: null,
  }),

  getters: {
    hasMore: (s) => !!s.nextPageUrl,
    unreadItems: (s) => s.items.filter((n) => !n.read_at),
  },

  actions: {
    // --- Helpers ---
    _toast() {
      return useNotificationStore()
    },

    _extractListResponse(payload) {
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []

      const meta = payload?.meta ?? null

      return { list, meta }
    },

    _setPaginationMeta(meta) {
      this.nextPageUrl = meta?.next_page_url ?? null
    },

    _normalizeNotificationFromPush(payload) {
      const id = payload.notification_id || payload.id

      return {
        id,
        title: payload.title || 'اعلان',
        body: payload.body || '',
        url: payload.url || '/',
        icon: payload.icon || '/icons/notification.png',
        tag: payload.tag || null,
        type: payload.type || payload.meta?.type || 'generic',
        meta: payload.meta || {},
        time: payload.time || new Date().toISOString(),
        read_at: null,
      }
    },

    // --- API ---
    async loadFirstPage() {
      if (this.loading) return

      this.loading = true
      this.error = null

      try {
        const { data } = await api.get('/notifications', {
          params: {
            per_page: this.perPage,
            page: 1,
          },
        })

        const { list, meta } = this._extractListResponse(data.data)

        this.items = list
        this._setPaginationMeta(meta)

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
      if (this.loading || this.loadingMore) return

      this.loadingMore = true

      try {
        const { data } = await api.get(this.nextPageUrl)

        const { list, meta } = this._extractListResponse(data.data)

        this.items = [...this.items, ...list]
        this._setPaginationMeta(meta)
      } catch (err) {
        console.warn('loadNextPage error', err)
        this._toast().handleApiError(err)
      } finally {
        this.loadingMore = false
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

    handleIncomingWebPush(payload) {
      const persisted = payload.persisted !== false

      if (!persisted) {
        this._toast().setNotification({
          type: 'info',
          icon: 'bell',
          message: payload.title || 'اعلان جدید',
          duration: 4500,
        })

        return
      }

      const n = this._normalizeNotificationFromPush(payload)
      const exists = n.id ? this.items.some((item) => item.id === n.id) : false

      if (!exists) {
        this.items = [n, ...this.items]

        /**
         * نکته:
         * قبلاً اینجا slice(0, this.perPage) داشتی.
         * برای infinite scroll بهتره حذف بشه، چون وقتی کاربر چند صفحه لود کرده،
         * نباید با رسیدن push جدید، لیست دوباره به ۱۰ آیتم محدود شود.
         */
        this.unreadCount++
      }

      this._toast().setNotification({
        type: 'info',
        icon: 'bell',
        message: `اعلان جدید: ${n.title}`,
        duration: 4500,
      })
    },

    async markRead(id) {
      try {
        const oldItem = this.items.find((n) => n.id === id)

        if (oldItem?.read_at) return

        const { data } = await api.post(`/notifications/${id}/read`)
        const updated = data?.data ?? data

        const idx = this.items.findIndex((n) => n.id === id)

        if (idx !== -1) {
          this.items[idx] = updated
        }

        if (this.unreadCount > 0) {
          this.unreadCount--
        }

        this._toast().setNotification({
          type: 'success',
          icon: 'check-circle',
          message: 'اعلان به عنوان خوانده شده علامت خورد ✅',
          duration: 3000,
        })
      } catch (err) {
        this._toast().handleApiError(err)
        throw err
      }
    },

    async markAllRead() {
      try {
        await api.post('/notifications/read-all')

        const nowIso = new Date().toISOString()

        this.items = this.items.map((n) => ({
          ...n,
          read_at: n.read_at || nowIso,
        }))

        this.unreadCount = 0

        this._toast().setNotification({
          type: 'info',
          icon: 'check-check',
          message: 'همهٔ اعلان‌ها خوانده شدند 📬',
          sound: false,
          duration: 3500,
        })
      } catch (err) {
        this._toast().handleApiError(err)
        throw err
      }
    },

    async destroy(id) {
      try {
        const removedItem = this.items.find((n) => n.id === id)

        await api.delete(`/notifications/${id}`)

        this.items = this.items.filter((n) => n.id !== id)

        if (removedItem && !removedItem.read_at && this.unreadCount > 0) {
          this.unreadCount--
        }

        this._toast().setNotification({
          type: 'warning',
          icon: 'trash-2',
          message: 'اعلان حذف شد 🗑️',
          sound: false,
          duration: 3000,
        })
      } catch (err) {
        this._toast().handleApiError(err)
        throw err
      }
    },

    async destroyAll() {
      try {
        await api.delete('/notifications')

        this.items = []
        this.unreadCount = 0
        this.nextPageUrl = null

        this._toast().setNotification({
          type: 'warning',
          icon: 'trash',
          message: 'تمام اعلان‌ها حذف شدند 🗑️',
          sound: false,
          duration: 4000,
        })
      } catch (err) {
        this._toast().handleApiError(err)
        throw err
      }
    },

    attachServiceWorkerBridge() {
      if (this._attachedSW) return
      if (!('serviceWorker' in navigator)) return

      this._swMessageHandler = (event) => {
        const payload = event.data || {}

        if (payload.__kind !== 'webpush') return

        this.handleIncomingWebPush(payload)
      }

      navigator.serviceWorker.addEventListener('message', this._swMessageHandler)

      this._attachedSW = true
    },

    detachServiceWorkerBridge() {
      if (!this._attachedSW) return
      if (!('serviceWorker' in navigator)) return

      if (this._swMessageHandler) {
        navigator.serviceWorker.removeEventListener('message', this._swMessageHandler)
      }

      this._swMessageHandler = null
      this._attachedSW = false
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
      this.detachServiceWorkerBridge()

      this.items = []
      this.unreadCount = 0
      this.nextPageUrl = null

      this.loading = false
      this.loadingMore = false
      this.error = null

      this.stopUnreadPolling()
    },
  },
})