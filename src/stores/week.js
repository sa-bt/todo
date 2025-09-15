import { defineStore } from 'pinia';
import axios from 'axios';
import { getWeekRange } from '@/utils/week';
import api from "@/plugins/axios";
export const useWeekStore = defineStore('week', {
    state: () => ({
        weekGoals: [],
        weekInfo: {},
    }),
    getters: {
        completedGoals: (state) => state.weekGoals.filter(g => g.status === "done"),
        pendingGoals: (state) => state.weekGoals.filter(g => g.status !== "done"),
    },
    actions: {
        async fetchWeekGoals() {
            const { start, end } = getWeekRange();
            try {
                const { data } = await api.get(`/week-goals?start_date=${start}&end_date=${end}`);
                this.weekInfo = data.week;
                this.weekGoals = data?.goals ?? [];
            }
            catch (error) {
                console.error('خطا در گرفتن اهداف هفته:', error);
            }
        },
        async addGoal(goalId) {
            const { start } = getWeekRange();
            try {
                const { data } = await axios.post(`/api/week-goals`, {
                    goal_id: goalId,
                    week_id: this.weekInfo.id,
                });
                this.weekGoals.push(data);
            }
            catch (error) {
                console.error('خطا در افزودن هدف:', error);
            }
        },
    },
});
