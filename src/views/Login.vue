<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function login() {
  try {
    // اینجا باید API واقعی بک‌اندت رو بزنی
    const res = await fetch('http://localhost:8085/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (!res.ok) {
      throw new Error('اطلاعات وارد شده نادرست است')
    }

    const data = await res.json()
    console.log('data', data)
    console.log(data.data.token)

    // ذخیره در استور
    auth.setAuth({ user: data.data.user, token: data.data.token })
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white shadow p-6 rounded-xl w-full max-w-sm">
      <h2 class="text-xl font-bold text-center mb-4">ورود به سیستم</h2>

      <input
        v-model="email"
        type="text"
        placeholder="ایمیل"
        class="border rounded w-full p-2 mb-3 text-right"
      />

      <input
        v-model="password"
        type="password"
        placeholder="رمز عبور"
        class="border rounded w-full p-2 mb-3 text-right"
      />

      <button @click="login" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        ورود
      </button>

      <div class="text-center mt-4">
        <RouterLink to="/register" class="text-blue-600 hover:underline">
          حساب نداری؟ ثبت‌نام
        </RouterLink>
      </div>

      <p v-if="error" class="text-red-600 mt-3 text-center">{{ error }}</p>
    </div>
  </div>
</template>
