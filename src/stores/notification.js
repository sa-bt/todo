import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        message: '',
        type: 'success',
        icon: null,
        sound: false,
        duration: 5000,
    }),
    actions: {
        setNotification({ message, type = 'success', icon = null, sound = false, duration = 5000 }) {
            this.message = message
            this.type = type
            this.icon = icon
            this.sound = sound
            this.duration = duration
        },

        clearNotification() {
            this.message = ''
            this.type = 'success'
            this.icon = null
            this.sound = false
            this.duration = 5000
        },

        /**
         * @param {object} error - the rejected axios error
         * @param {string} [fallback] - shown when the server sends no usable
         *   message. Several callers already passed this argument, but the
         *   parameter was missing, so their wording was silently dropped and
         *   the user always saw the generic sentence.
         */
        handleApiError(error, fallback = '') {
            let message = fallback || 'ارتباط با سرور برقرار نشد.'
            if (error.response) {
                const status = error.response.status
                if (status === 422) {
                    const errors = error.response.data.errors
                    message = Object.values(errors).flat().join(' | ')
                    message = `ورودی درست نیست: ${message}`
                } else if (status === 401 || status === 403) {
                    message = 'اجازه انجام این کار را نداری.'
                } else if (status === 404) {
                    message = 'مورد خواسته‌شده پیدا نشد.'
                } else {
                    message = error.response.data.message || message || `خطای سرور (${status})`
                }
            }

            this.setNotification({ message, type: 'error', icon: 'alert-triangle' })
        },

        /**
         * خواندن پیام از پاسخ بک‌اند
         * @param {object} response - پاسخ API شامل data.message و data.duration
         */
        notifyFromApi(response) {
            if (!response?.data) return
            const { message, duration } = response.data
            if (!message) return

            this.setNotification({
                message,
                type: 'success',
                icon: 'sparkles',
                sound: true,
                duration: duration || 5000,
            })
        }
    }
})
