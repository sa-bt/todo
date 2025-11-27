import { defineStore } from 'pinia'
import api from '@/plugins/axios'
import { useNotificationStore } from './notification'

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [],
    loading: false,
  }),

  actions: {
    findGoalIndex(id) {
      return this.goals.findIndex((g) => g.id === id)
    },

    async fetchGoals(params = {}) {
      const notify = useNotificationStore()

      if (this.loading) {
        console.log('⏳ fetchGoals skipped: already loading.')
        return
      }
      if (this.goals.length > 0 && !params.force) {
        console.log('📦 fetchGoals skipped: data already loaded.')
        return
      }

      this.loading = true
      try {
        const query = new URLSearchParams()
        if (params.without_children) query.append('without_children', '1')
        const res = await api.get(`/goals${query.toString() ? `?${query}` : ''}`)
        this.goals = res.data.data
      } catch (err) {
        console.error('fetchGoals error:', err)
        notify.handleApiError(err, 'خطا در بارگذاری اهداف')
      } finally {
        this.loading = false
      }
    },

    async addGoal(goal) {
      const notify = useNotificationStore()
      try {
        const res = await api.post('/goals', goal)
        this.goals.push(res.data.data)
        notify.setNotification({ message: '🎯 هدف با موفقیت ایجاد شد.', type: 'success' })
        return res.data.data
      } catch (err) {
        console.error('addGoal error:', err)
        notify.handleApiError(err, 'ایجاد هدف با خطا مواجه شد.')
      }
    },

    async updateGoal(id, payload) {
      const notify = useNotificationStore()
      try {
        const res = await api.put(`/goals/${id}`, payload)
        const i = this.findGoalIndex(id)
        if (i !== -1) Object.assign(this.goals[i], res.data.data)
        notify.setNotification({ message: '✅ هدف با موفقیت بروزرسانی شد.', type: 'success' })
        return res.data.data
      } catch (err) {
        console.error('updateGoal error:', err)
        notify.handleApiError(err, 'بروزرسانی هدف ناموفق بود.')
      }
    },

    async removeGoal(id) {
      const notify = useNotificationStore()
      try {
        await api.delete(`/goals/${id}`)
        this.goals = this.goals.filter((g) => g.id !== id)
        notify.setNotification({ message: '🗑️ هدف با موفقیت حذف شد.', type: 'success' })
      } catch (err) {
        console.error('removeGoal error:', err)
        notify.handleApiError(err, 'حذف هدف با خطا مواجه شد.')
      }
    },

    async addGoalTask(payload) {
      const notify = useNotificationStore()
      try {
        const res = await api.post('/goal-tasks', payload)
        notify.setNotification({ message: '📝 تسک با موفقیت اضافه شد.', type: 'success' })

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
        notify.handleApiError(err, 'افزودن تسک ناموفق بود.')
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
