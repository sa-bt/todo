import { defineStore } from "pinia";
import { ref, computed } from "vue";

// ⚠️ Interface User حذف شد تا از تضاد در build جلوگیری شود.
// اگرچه در TypeScript کار می‌کرد، حذف آن ایمنی بیشتری ایجاد می‌کند.

export const useAuthStore = defineStore("auth", () => {
    // 💡 رفع خطای Syntax: تغییر نام متغیرهای داخلی به userData و authToken
    const userData = ref(JSON.parse(localStorage.getItem("user") || "null"));
    const authToken = ref(localStorage.getItem("token") || null);

    // getters
    const isAuthenticated = computed(() => {
        return !!authToken.value && !!userData.value;
    });

    const isAdmin = computed(() => {
        // چک کردن نقش 'admin' از آبجکت userData
        // (اطمینان حاصل کنید که user.role در LocalStorage وجود دارد)
        return isAuthenticated.value && userData.value?.role === 'admin';
    });

    // actions
    // 💡 رفع خطای سینتکسی: حذف Type Annotation از پارامتر payload
    function setAuth(payload) { // از any برای سادگی استفاده می‌کنیم
        userData.value = payload.user;
        authToken.value = payload.token;
        localStorage.setItem("user", JSON.stringify(payload.user)); 
        localStorage.setItem("token", payload.token);
    }

    function logout() {
        userData.value = null;
        authToken.value = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        console.log("After logout user:", userData.value);
        console.log("After logout token:", authToken.value);
    }

    return {
        // برگرداندن با نام‌های user و token برای سازگاری با بقیه کدها
        user: userData, 
        token: authToken, 
        isAuthenticated,
        isAdmin,
        setAuth,
        logout
    };
});