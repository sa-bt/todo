import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        /** پیام نوتیفیکیشن. خالی بودن به معنی عدم نمایش است. */
        message: '',
        /** نوع نوتیفیکیشن: 'success' یا 'error' */
        type: 'success'
    }),
    actions: {
        /**
         * تنظیم یک پیام اعلان جدید.
         * * @param {string} msg - متن پیام
         * @param {'success' | 'error'} type - نوع پیام
         */
        setNotification(msg, type) {
            // ✅ هر پیام جدید، پیام قبلی را جایگزین می‌کند
            this.message = msg;
            this.type = type;

            // ❌ تایمر خودکار حذف شد.
            // مدیریت تایمر به ToastNotification.vue واگذار می‌شود.
        },

        /**
         * پاک کردن پیام اعلان (استفاده شده توسط دکمه بستن)
         */
        clearNotification() {
            this.message = '';
            this.type = '';
        }
    }
});
