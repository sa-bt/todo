<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

// تابع اعتبارسنجی ساده
function validateForm() {
  if (!email.value.trim() || !password.value.trim()) {
    error.value = 'لطفاً تمامی فیلدها را پر کنید.'
    return false
  }
  // در اینجا می‌توانید اعتبارسنجی‌های پیچیده‌تر (مثل فرمت ایمیل) را اضافه کنید.
  return true
}

async function login() {
  error.value = '' // پاک کردن خطای قبلی

  // مرحله اول: اعتبارسنجی سمت کلاینت
  if (!validateForm()) {
    return // اگر فرم معتبر نیست، ادامه نده
  }

  try {
    // نمایش لودینگ (اگرچه کدش را اینجا نداریم، اما در عمل باید اضافه شود)

    const res = await fetch('http://localhost:8085/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (!res.ok) {
      // استفاده از پیام خطای سرور در صورت امکان
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.message || 'ایمیل یا رمز عبور اشتباه است.'
      throw new Error(errorMessage)
    }

    const data = await res.json()

    // ذخیره در استور
    auth.setAuth({ user: data.data.user, token: data.data.token })
    router.push({ name: 'dashboard' })
  } catch (err) {
    // خطا را برای کاربر نمایش بده
    error.value = err.message
  }
}
</script>
<template>
  <div class="flex items-center justify-center min-h-screen surface-soft">

    <div class="surface shadow-xl p-8 rounded-2xl w-full max-w-md">

      <h2 class="text-3xl font-extrabold text-center mb-6" :style="{ color: 'var(--color-heading)' }">
        ورود به سیستم
      </h2>

      <input
          v-model="email"
          type="text"
          placeholder="ایمیل یا نام کاربری"
          class="w-full p-3 mb-4 text-right rounded-lg border-token surface-mute focus:ring-2 focus:outline-none transition-colors duration-200 focus:ring-accent"
          dir="ltr"
      />

      <input
          v-model="password"
          type="password"
          placeholder="رمز عبور"
          class="w-full p-3 mb-6 text-right rounded-lg border-token surface-mute focus:ring-2 focus:outline-none transition-colors duration-200 focus:ring-accent"
      />

      <button
          @click="login"
          class="w-full btn btn-primary transition-all duration-300 transform active:scale-95"
      >
        ورود
      </button>

      <div class="text-center mt-6">
        <span class="text-text-secondary font-light">
          حساب کاربری نداری؟
        </span>
        <RouterLink
            to="/register"
            class="text-primary font-medium hover:underline transition-colors duration-200"
        >
          ثبت‌نام کن
        </RouterLink>
      </div>

      <p
          v-if="error"
          class="mt-4 p-3 rounded-lg text-center font-medium bg-red-100 text-red-600"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
