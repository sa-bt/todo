import { defineStore } from 'pinia'
import api from '@/plugins/axios'
import { useNotificationStore } from '@/stores/notification'
import { useUserSettingStore } from '@/stores/userSetting'

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function normalizeDate(value) {
  if (!value) return null

  // اگر مقدار مثل 2026-05-23T00:00:00.000000Z یا 2026-05-23 00:00:00 باشد
  // فقط بخش YYYY-MM-DD را نگه می‌داریم.
  return value.toString().slice(0, 10)
}

function normalizeTask(task) {
  if (!task) return task

  return {
    ...task,
    is_done: normalizeBoolean(task.is_done),
    day: normalizeDate(task.day),
  }
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
  }),

  actions: {
    async fetchTasks(params = {}) {
      this.loading = true

      try {
        const query = new URLSearchParams()

        if (params.start_date) {
          query.append('start_date', normalizeDate(params.start_date))
        }

        if (params.end_date) {
          query.append('end_date', normalizeDate(params.end_date))
        }

        const url = query.toString()
          ? `/tasks?${query.toString()}`
          : '/tasks'

        const res = await api.get(url)

        const tasks = res.data.data || []

        this.tasks = tasks.map(task => normalizeTask(task))

        return res.data
      } finally {
        this.loading = false
      }
    },

    async addTask(payload) {
      const notify = useNotificationStore()

      try {
        const cleanPayload = {
          ...payload,
          day: normalizeDate(payload.day),
        }

        if ('is_done' in cleanPayload) {
          cleanPayload.is_done = normalizeBoolean(cleanPayload.is_done)
        }

        const res = await api.post('/tasks', cleanPayload)

        const responseData = res.data.data

        /*
        |--------------------------------------------------------------------------
        | حالت معمول: ساخت یک تسک
        |--------------------------------------------------------------------------
        */
        if (responseData && !Array.isArray(responseData)) {
          this.tasks.push(normalizeTask(responseData))
        }

        /*
        |--------------------------------------------------------------------------
        | اگر در آینده for > 1 فرستاده شود و بک‌اند collection برگرداند
        |--------------------------------------------------------------------------
        */
        if (Array.isArray(responseData)) {
          responseData.forEach(task => {
            this.tasks.push(normalizeTask(task))
          })
        }

        return res.data
      } catch (error) {
        console.error('❌ Task create error:', error)

        notify.setNotification({
          type: 'error',
          message: 'در ایجاد تسک مشکلی پیش آمد.',
          icon: 'alert-triangle',
          sound: false,
          duration: 4000,
        })

        throw error
      }
    },

    async updateTask(id, payload) {
      const notify = useNotificationStore()

      try {
        const cleanPayload = { ...payload }

        /*
        |--------------------------------------------------------------------------
        | فقط فیلدهایی که واقعاً قرار است آپدیت شوند ارسال می‌شوند.
        |--------------------------------------------------------------------------
        | نکته:
        | هیچ‌وقت از کامپوننت‌ها payload کامل task با ...task نفرست.
        | برای toggle فقط is_done
        | برای تغییر تاریخ فقط day
        */
        if ('day' in cleanPayload) {
          cleanPayload.day = normalizeDate(cleanPayload.day)
        }

        if ('is_done' in cleanPayload) {
          cleanPayload.is_done = normalizeBoolean(cleanPayload.is_done)
        }

        const res = await api.put(`/tasks/${id}`, cleanPayload)
        const data = res.data.data || {}
        const updatedTask = normalizeTask(data.task)

        if (updatedTask) {
          const index = this.tasks.findIndex(task => task.id === id)

          if (index !== -1) {
            this.tasks[index] = {
              ...this.tasks[index],
              ...updatedTask,
            }
          } else {
            this.tasks.push(updatedTask)
          }
        }

        const userSetting = useUserSettingStore()

        if (userSetting.per_task_progress && data.message) {
          notify.setNotification({
            type: 'success',
            message: data.message,
            icon: 'sparkles',
            sound: true,
            duration: data.duration || 5000,
          })
        }

        return res.data
      } catch (error) {
        console.error('❌ Task update error:', error)

        notify.setNotification({
          type: 'error',
          message: 'در بروزرسانی تسک مشکلی پیش آمد.',
          icon: 'alert-triangle',
          sound: false,
          duration: 4000,
        })

        throw error
      }
    },

    async toggleTaskStatus(task) {
      if (!task?.id) return null

      const currentStatus = normalizeBoolean(task.is_done)

      return await this.updateTask(task.id, {
        is_done: !currentStatus,
      })
    },

    async changeTaskDay(task, day) {
      if (!task?.id || !day) return null

      return await this.updateTask(task.id, {
        day: normalizeDate(day),
      })
    },

    async removeTask(id) {
      const notify = useNotificationStore()

      try {
        await api.delete(`/tasks/${id}`)

        this.tasks = this.tasks.filter(task => task.id !== id)

        notify.setNotification({
          type: 'success',
          message: 'تسک با موفقیت حذف شد.',
          icon: 'trash-2',
          sound: false,
          duration: 3000,
        })
      } catch (error) {
        console.error('❌ Task remove error:', error)

        notify.setNotification({
          type: 'error',
          message: 'حذف تسک با شکست مواجه شد.',
          icon: 'alert-triangle',
          sound: false,
          duration: 4000,
        })

        throw error
      }
    },

    clearTasks() {
      this.tasks = []
    },
  },
})