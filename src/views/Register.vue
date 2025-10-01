<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { useRouter, RouterLink } from "vue-router"

const auth = useAuthStore()
const router = useRouter()

const name = ref("")
const email = ref("")
const password = ref("")
const confirmPassword = ref("")
const error = ref("")

async function register() {
  if (password.value !== confirmPassword.value) {
    error.value = "رمز عبور و تکرار آن مطابقت ندارند"
    return
  }

  try {
    // 📌 اینجا API واقعی بک‌اندت رو بزن
    const res = await fetch("http://localhost:8085/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    })

    if (!res.ok) {
      throw new Error("ثبت‌نام انجام نشد، لطفاً اطلاعات را بررسی کنید")
    }

    const data = await res.json()

    // ذخیره در استور و ریدایرکت
    auth.setAuth({ user: data.user, token: data.token })
    router.push({ name: "goals" })
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white shadow p-6 rounded-xl w-full max-w-sm">
      <h2 class="text-xl font-bold text-center mb-4">ثبت‌نام</h2>

      <input v-model="name" type="text" placeholder="نام کامل"
        class="border rounded w-full p-2 mb-3 text-right" />

      <input v-model="email" type="text" placeholder="ایمیل"
        class="border rounded w-full p-2 mb-3 text-right" />

      <input v-model="password" type="password" placeholder="رمز عبور"
        class="border rounded w-full p-2 mb-3 text-right" />

      <input v-model="confirmPassword" type="password" placeholder="تکرار رمز عبور"
        class="border rounded w-full p-2 mb-3 text-right" />

      <button @click="register"
        class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
        ثبت‌نام
      </button>

      <p v-if="error" class="text-red-600 mt-3 text-center">{{ error }}</p>

      <div class="text-center mt-4">
        <RouterLink to="/login" class="text-blue-600 hover:underline">
          حساب داری؟ ورود
        </RouterLink>
      </div>
    </div>
  </div>
</template>
