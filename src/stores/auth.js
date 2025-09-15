// src/stores/auth.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
export const useAuthStore = defineStore("auth", () => {
    // state
    const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
    const token = ref(localStorage.getItem("token") || null);
    // getters
    const isAuthenticated = computed(() => {
        return !!token.value && !!user.value;
    });
    // actions
    function setAuth(payload) {
        user.value = payload.user;
        token.value = payload.token;
        localStorage.setItem("user", JSON.stringify(payload.user));
        localStorage.setItem("token", payload.token);
    }
    function logout() {
        user.value = null;
        token.value = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        console.log("After logout user:", user.value);
        console.log("After logout token:", token.value);
    }
    return {
        user,
        token,
        isAuthenticated,
        setAuth,
        logout
    };
});
