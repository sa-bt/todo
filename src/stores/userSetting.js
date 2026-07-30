// stores/userSetting.js
import { defineStore } from 'pinia'
import api from '@/plugins/axios'
import { useNotificationStore } from '@/stores/notification'

export const useUserSettingStore = defineStore('userSetting', {
    state: () => ({
        loaded: false,
        daily_report: false,
        report_time: '08:00',
        task_reminder: false,
        task_reminder_time: '09:00',
        per_task_progress: false,
        weekly_report: false,
        // شنبه صفر است و جمعه شش، همان شماره‌گذاری نمودار روزهای هفته.
        weekly_report_day: 6,
        weekly_report_time: '20:00',
        // هشدار افت روز و ساعت ندارد. شنبه صبح فرستاده می‌شود.
        drop_alert: false,
    }),

    actions: {
        /**
         * بارگذاری تنظیمات کاربر از سرور
         */
        async load(force = false) {
            const notify = useNotificationStore()

            if (this.loaded && !force) return

            try {
                const res = await api.get('/user-setting')
                const data = res.data.data || res.data || {}

                this.daily_report = Boolean(data.daily_report ?? false)
                this.task_reminder = Boolean(data.task_reminder ?? false)
                this.per_task_progress = Boolean(data.per_task_progress ?? false)
                this.weekly_report = Boolean(data.weekly_report ?? false)
                this.drop_alert = Boolean(data.drop_alert ?? false)
                this.weekly_report_day = Number.isInteger(data.weekly_report_day) ? data.weekly_report_day : 6

                this.report_time = data.report_time?.substring(0, 5) || '08:00'
                this.task_reminder_time = data.task_reminder_time?.substring(0, 5) || '09:00'
                this.weekly_report_time = data.weekly_report_time?.substring(0, 5) || '20:00'

                this.loaded = true

            } catch (error) {
                notify.handleApiError(error)
            }
        },

        /**
         * ذخیره تنظیمات در سرور
         */
        async save() {
            const notify = useNotificationStore()

            try {
                await api.post('/user-setting', {
                    daily_report: this.daily_report,
                    report_time: this.report_time,
                    task_reminder: this.task_reminder,
                    task_reminder_time: this.task_reminder_time,
                    per_task_progress: this.per_task_progress,
                    weekly_report: this.weekly_report,
                    weekly_report_day: this.weekly_report_day,
                    weekly_report_time: this.weekly_report_time,
                    drop_alert: this.drop_alert,
                })

                // ✅ نمایش پیام موفقیت واضح و هماهنگ با تم Toast
                notify.setNotification({
                    message: 'تنظیمات با موفقیت ذخیره شد',
                    type: 'success',
                    icon: 'sparkles',
                    duration: 4000,
                })
            } catch (error) {
                notify.handleApiError(error)
            }
        },
    },
})
