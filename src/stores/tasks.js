import { defineStore } from 'pinia';
import axios from 'axios';
import api from '@/plugins/axios';
export const useTasksStore = defineStore('tasks', {
    state: () => ({
        tasks: [],
        loading: false,
    }),
    actions: {
        async fetchTasks(params) {
            this.loading = true;
            try {
                let url = '/tasks';
                if (params) {
                    const query = new URLSearchParams();
                    if (params.start_date)
                        query.append('start_date', params.start_date);
                    if (params.end_date)
                        query.append('end_date', params.end_date);
                    url += `?${query.toString()}`;
                }
                const res = await api.get(url);
                this.tasks = res.data.data;
            }
            finally {
                this.loading = false;
            }
        },
        async addTask(payload) {
            const res = await api.post('/tasks', payload);
            this.tasks.push(res.data.data); // آپدیت استور
            return res.data;
        },
        async updateTask(id, payload) {
            console.log('Update Task:', payload);
            const res = await api.put(`/tasks/${id}`, payload);
            const index = this.tasks.findIndex((t) => t.id === id);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...res.data.data };
            }
        },
        async removeTask(id) {
            await axios.delete(`/api/tasks/${id}`);
            this.tasks = this.tasks.filter((t) => t.id !== id);
        },
    },
});
