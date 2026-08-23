import { defineStore } from 'pinia'
import api from '@/plugins/axios'
import { useNotificationStore } from './notification'

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [],
    loading: false,
    /*
     * کدام پرس‌وجو این فهرست را پر کرده است.
     *
     * دو مصرف‌کننده دو فهرست متفاوت می‌خواهند: نمای روزانه فقط اهداف بدون فرزند
     * را می‌خواهد و صفحه اهداف فهرست کامل را. قبلاً حافظه نهان فقط خالی‌نبودن
     * فهرست را می‌سنجید، پس هر کدام زودتر می‌رسید جای دیگری را هم می‌گرفت و
     * مصرف‌کننده دوم بی‌صدا داده اشتباه می‌گرفت.
     */
    loadedQuery: null,
  }),

  actions: {
    findGoalIndex(id) {
      return this.goals.findIndex((g) => g.id === id)
    },

    async fetchGoals(params = {}) {
      const notify = useNotificationStore()

      const queryKey = params.without_children ? 'without_children' : 'all'

      if (this.loading) return

      // حافظه نهان فقط وقتی معتبر است که همان پرس‌وجوی قبلی دوباره خواسته شود.
      if (this.goals.length > 0 && this.loadedQuery === queryKey && !params.force) {
        return
      }

      this.loading = true
      try {
        const query = new URLSearchParams()
        if (params.without_children) query.append('without_children', '1')
        const res = await api.get(`/goals${query.toString() ? `?${query}` : ''}`)
        this.goals = res.data.data
        this.loadedQuery = queryKey
      } catch (err) {
        console.error('fetchGoals error:', err)
        notify.handleApiError(err, 'دریافت اهداف ناموفق بود.')
      } finally {
        this.loading = false
      }
    },

    async addGoal(goal) {
      const notify = useNotificationStore()
      try {
        const res = await api.post('/goals', goal)
        this.goals.push(res.data.data)
        notify.setNotification({ message: 'هدف ساخته شد.', type: 'success' })
        return res.data.data
      } catch (err) {
        console.error('addGoal error:', err)
        notify.handleApiError(err, 'ساخت هدف ناموفق بود.')
      }
    },

    async updateGoal(id, payload) {
      const notify = useNotificationStore()
      try {
        const res = await api.put(`/goals/${id}`, payload)
        const i = this.findGoalIndex(id)
        if (i !== -1) Object.assign(this.goals[i], res.data.data)
        notify.setNotification({ message: 'هدف ذخیره شد.', type: 'success' })
        return res.data.data
      } catch (err) {
        console.error('updateGoal error:', err)
        notify.handleApiError(err, 'ذخیره هدف ناموفق بود.')
      }
    },

    async removeGoal(id) {
      const notify = useNotificationStore()
      try {
        await api.delete(`/goals/${id}`)
        this.goals = this.goals.filter((g) => g.id !== id)
        notify.setNotification({ message: 'هدف حذف شد.', type: 'success' })
      } catch (err) {
        console.error('removeGoal error:', err)
        notify.handleApiError(err, 'حذف هدف ناموفق بود.')
      }
    },

    async addGoalTask(payload) {
      const notify = useNotificationStore()
      try {
        const res = await api.post('/goal-tasks', payload)
        notify.setNotification({ message: 'کار افزوده شد.', type: 'success' })

        if (payload.goal_id) {
          const i = this.findGoalIndex(payload.goal_id)
          const updatedGoal = res.data.data.goal
          if (i !== -1 && updatedGoal) {
            Object.assign(this.goals[i], updatedGoal)
          }
        }

        return res.data.data
      } catch (err) {
        console.error('addGoalTask error:', err)
        notify.handleApiError(err, 'افزودن کار ناموفق بود.')
      }
    },
    async fetchParentableGoals() {
      try {
        const res = await api.get('/goals/parentable')
        return res.data.data || []
      } catch (error) {
        const notify = useNotificationStore()
        notify.handleApiError(error)
        return []
      }
    },
  },
})
