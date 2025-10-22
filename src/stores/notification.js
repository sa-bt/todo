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

        handleApiError(error) {
            let message = 'خطای ناشناخته در ارتباط با سرور.'
            if (error.response) {
                const status = error.response.status
                if (status === 422) {
                    const errors = error.response.data.errors
                    message = Object.values(errors).flat().join(' | ')
                    message = `خطا در ورودی: ${message}`
                } else if (status === 401 || status === 403) {
                    message = 'شما مجوز لازم برای انجام این عملیات را ندارید.'
                } else if (status === 404) {
                    message = 'منبع مورد نظر یافت نشد.'
                } else {
                    message = error.response.data.message || `خطای سرور با کد ${status}`
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
