import {defineStore} from 'pinia'
import axios from 'axios'
import api from '@/plugins/axios'
import {useNotificationStore} from '@/stores/notification'
import {useAuthStore} from '@/stores/auth'
import {useUserSettingStore} from '@/stores/userSetting'

export const useTasksStore = defineStore('tasks', {
    state: () => ({
        tasks: [],
        loading: false,
    }),

    actions: {
        async fetchTasks(params) {
            this.loading = true
            try {
                let url = '/tasks'
                if (params) {
                    const query = new URLSearchParams()
                    if (params.start_date) query.append('start_date', params.start_date)
                    if (params.end_date) query.append('end_date', params.end_date)
                    url += `?${query.toString()}`
                }
                const res = await api.get(url)
                this.tasks = res.data.data
            } finally {
                this.loading = false
            }
        },

        async addTask(payload) {
            const res = await api.post('/tasks', payload)
            this.tasks.push(res.data.data)
            return res.data
        },

        async updateTask(id, payload) {
            try {
                const res = await api.put(`/tasks/${id}`, payload)
                const data = res.data.data || {}

                // 🔹 بروزرسانی تسک در استور
                const index = this.tasks.findIndex(t => t.id === id)
                if (index !== -1) {
                    this.tasks[index] = {
                        ...this.tasks[index],
                        ...data.task
                    }
                }

                // ✅ بررسی فعال بودن per_task_progress
                const userSetting = useUserSettingStore()

                if (userSetting.per_task_progress && data.message) {
                    const notify = useNotificationStore()

                    notify.setNotification({
                        type: 'success',
                        message: data.message,
                        icon: 'sparkles',
                        sound: true,
                        duration: data.duration || 5000,
                    })
                }

            } catch (error) {
                console.error('❌ Task update error:', error)

                const notify = useNotificationStore()
                notify.setNotification({
                    type: 'error',
                    message: 'در بروزرسانی تسک مشکلی پیش آمد.',
                    icon: 'alert-triangle',
                    sound: false,
                    duration: 4000,
                })
            }
        },

        async removeTask(id) {
            const notify = useNotificationStore()
            try {
                // استفاده از api به جای axios
                await api.delete(`/tasks/${id}`)

                // حذف از لیست محلی
                this.tasks = this.tasks.filter((t) => t.id !== id)

                // نوتیفیکیشن موفقیت
                notify.setNotification({
                    type: 'success',
                    message: 'تسک با موفقیت حذف شد.',
                    icon: 'trash-2',
                    sound: false,
                    duration: 3000,
                })
            } catch (error) {
                console.error('Error removing task:', error)
                notify.setNotification({
                    type: 'error',
                    message: 'حذف تسک با شکست مواجه شد.',
                    icon: 'alert-triangle',
                    sound: false,
                })
            }
        },
    },
})
