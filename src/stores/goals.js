import { defineStore } from 'pinia';
import api from '@/plugins/axios';
import { useNotificationStore } from './notification';

export const useGoalsStore = defineStore('goals', {
    state: () => ({
        goals: [],
        loading: false,
    }),

    actions: {
        /**
         * بارگذاری اهداف از API
         * @param {object} params - شامل فیلترهایی مانند without_children
         */
        async fetchGoals(params) {
            const toast = useNotificationStore();

            // ✅ اصلاح: اگر در حال بارگذاری است، بلافاصله خارج شو (جلوگیری از فراخوانی‌های همزمان)
            if (this.loading) {
                console.log('Fetch skipped: currently loading.');
                return;
            }

            // ✅ اصلاح: اگر اهداف از قبل لود شده‌اند، خارج شو (جلوگیری از فراخوانی‌های مکرر در Remount)
            if (this.goals.length > 0) {
                console.log('Fetch skipped: data already exists.');
                return;
            }

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
                toast.handleApiError(err);
            }
            finally {
                this.loading = false;
            }
        },
        /**
         * ایجاد یک هدف جدید
         * @param {object} goal - داده‌های هدف
         */
        async addGoal(goal) {
            const toast = useNotificationStore();
            try {
                const res = await api.post('/goals', goal);
                this.goals.push(res.data.data);
                toast.setNotification('هدف با موفقیت ایجاد شد.', 'success');
                return res.data.data;
            } catch (err) {
                toast.handleApiError(err);
            }
        },

        /**
         * ایجاد تسک‌های روزانه برای یک هدف در یک بازه زمانی
         * @param {object} payload - شامل goal_id، start_date و duration
         */
        async addGoalTask(payload) {
            const toast = useNotificationStore();
            try {
                const res = await api.post('/goal-tasks', payload);
                toast.setNotification('تسک‌ها با موفقیت ایجاد شدند.', 'success');
                return res.data;
            } catch (err) {
                toast.handleApiError(err);
            }
        },

        /**
         * به‌روزرسانی یک هدف موجود
         * @param {number} id - آیدی هدف
         * @param {object} payload - داده‌های به‌روزرسانی
         */
        async updateGoal(id, payload) {
            const toast = useNotificationStore();
            try {
                const res = await api.put(`/goals/${id}`, payload);
                const index = this.goals.findIndex((g) => g.id === id);
                if (index !== -1) {
                    // به‌روزرسانی واکنش‌پذیر آیتم در لیست موجود
                    Object.assign(this.goals[index], res.data.data);
                }
                toast.setNotification('هدف با موفقیت به‌روزرسانی شد.', 'success');
                return res.data.data;
            } catch (err) {
                toast.handleApiError(err);
            }
        },

        /**
         * حذف یک هدف
         * @param {number} id - آیدی هدف
         */
        async removeGoal(id) {
            const toast = useNotificationStore();
            try {
                await api.delete(`/goals/${id}`);
                this.goals = this.goals.filter((g) => g.id !== id);
                toast.setNotification('هدف با موفقیت حذف شد.', 'success');
            } catch (err) {
                toast.handleApiError(err);
            }
        },
    },
});
