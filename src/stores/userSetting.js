// stores/userSetting.ts
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
    }),

    actions: {
        async load() {
            try {
                const res = await api.get('/user-setting')
                const data = res.data.data || res.data || {}

                this.daily_report = Boolean(data.daily_report ?? false)
                this.task_reminder = Boolean(data.task_reminder ?? false)
                this.per_task_progress = Boolean(data.per_task_progress ?? false)

                this.report_time = data.report_time?.substring(0, 5) || '08:00'
                this.task_reminder_time = data.task_reminder_time?.substring(0, 5) || '09:00'

                this.loaded = true
            } catch (err) {
                useNotificationStore().handleApiError(err)
            }
        },

        async save() {
            try {
                await api.post('/user-setting', {
                    daily_report: this.daily_report,
                    report_time: this.report_time,
                    task_reminder: this.task_reminder,
                    task_reminder_time: this.task_reminder_time,
                    per_task_progress: this.per_task_progress,
                })

                useNotificationStore().setNotification('تنظیمات ذخیره شد ✅', 'success')
            } catch (err) {
                useNotificationStore().handleApiError(err)
            }
        },
    },
})
