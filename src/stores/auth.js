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

    // پاک‌سازی محلی. رهگیر ۴۰۱ هم همین را صدا می‌زند، پس اینجا هیچ درخواست
    // شبکه‌ای نباید باشد.
    function logout() {
        userData.value = null;
        authToken.value = null;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    }

    /**
     * خروج واقعی: اول توکن روی سرور باطل می‌شود، بعد حافظهٔ محلی پاک.
     *
     * پیش از این فقط localStorage پاک می‌شد و توکن تا ابد روی سرور معتبر
     * می‌ماند؛ خروج فقط یک وانمود بود.
     */
    async function signOut() {
        try {
            const { logoutRequest } = await import("@/plugins/api");
            await logoutRequest();
        } catch {
            // اگر شبکه نبود یا توکن از قبل باطل شده بود، باز هم باید محلی پاک شود.
        } finally {
            logout();
        }
    }

    return {
        // برگرداندن با نام‌های user و token برای سازگاری با بقیه کدها
        user: userData, 
        token: authToken, 
        isAuthenticated,
        isAdmin,
        setAuth,
        logout,
        signOut
    };
});