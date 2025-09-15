import { defineStore } from 'pinia';
export const useNotificationStore = defineStore('notification', {
    state: () => ({
        message: '',
        type: ''
    }),
    actions: {
        setNotification(msg, type) {
            this.message = msg;
            this.type = type;
            setTimeout(() => {
                this.message = '';
                this.type = '';
            }, 3000); // بعد ۳ ثانیه ناپدید میشه
        }
    }
});
