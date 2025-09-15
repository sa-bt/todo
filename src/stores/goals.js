import { defineStore } from 'pinia';
import api from '@/plugins/axios';
export const useGoalsStore = defineStore('goals', {
    state: () => ({
        goals: [],
        loading: false,
    }),
    actions: {
        async fetchGoals(params) {
            if (this.loading || this.goals.length)
                return; // جلوگیری از درخواست مکرر
            this.loading = true;
            let url = '/goals';
            try {
                if (params) {
                    const query = new URLSearchParams();
                    if (params.without_children)
                        query.append('without_children', '1');
                    url += `?${query.toString()}`;
                }
                const res = await api.get(url);
                this.goals = res.data.data;
            }
            catch (err) {
                console.error('fetchGoals error:', err);
            }
            finally {
                this.loading = false;
            }
        },
        async addGoal(goal) {
            const res = await api.post('/goals', goal);
            this.goals.push(res.data.data);
        },
        async addGoalTask(payload) {
            const res = await api.post('/goal-tasks', payload);
            return res.data;
        },
        async updateGoal(id, payload) {
            const res = await api.put(`/goals/${id}`, payload);
            const index = this.goals.findIndex((g) => g.id === id);
            if (index !== -1) {
                this.goals[index] = res.data.data;
            }
        },
        async removeGoal(id) {
            await api.delete(`/goals/${id}`);
            this.goals = this.goals.filter((g) => g.id !== id);
        },
    },
});
