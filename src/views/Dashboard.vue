<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Home, Calendar, CalendarDays, CalendarRange, CalendarClock, Menu } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { getTodayShamsi } from '@/utils/jalali'
import { toPersianNumber } from '@/utils/number'

const showTooltip = ref(false)
const shamsiDate = toPersianNumber(getTodayShamsi())
const router = useRouter()
const auth = useAuthStore()
const mobileMenuOpen = ref(false)

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
function goToDailyView() {
  router.push('/day')
}
</script>

<template>
  <div class="min-h-screen flex flex-col" dir="rtl">
    <!-- هدر -->
    <div class="flex justify-between items-center bg-gray-900 text-white px-6 py-4 shadow-lg">
      <div class="flex items-center gap-4">
        <img src="" alt="لوگو" class="w-10 h-10 rounded-full border-2 border-white" />
        <h1 class="text-xl font-bold tracking-wide">داشبورد اهداف</h1>
      </div>

      <div class="flex items-center gap-2 relative">
        <div class="relative">
          <button
            @click="goToDailyView"
            @mouseenter="showTooltip = true"
            @mouseleave="showTooltip = false"
            class="hidden md:flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-medium shadow-sm hover:bg-blue-200 transition duration-200 text-sm"
          >
            <Calendar class="w-4 h-4" />
            {{ shamsiDate }}
          </button>
        </div>

        <button
          @click="logout"
          class="hidden md:flex bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md shadow-md transition duration-300 text-sm"
        >
          خروج
        </button>

        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden">
          <Menu class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- منوی موبایل -->
    <div v-if="mobileMenuOpen" class="md:hidden flex flex-col gap-2 bg-white px-4 py-2 shadow-lg">
      <button
        @click="goToDailyView"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 shadow-sm hover:bg-blue-200 transition text-sm"
      >
        <Calendar class="w-4 h-4" />
        {{ shamsiDate }}
      </button>

      <button
        @click="logout"
        class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow-md transition duration-300 text-sm"
      >
        خروج
      </button>
    </div>

    <!-- تب‌ها دسکتاپ -->
    <div class="hidden md:flex gap-4 bg-white px-6 py-3 shadow-sm">
      <RouterLink to="/goals" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <Home class="w-5 h-5" />
          اهداف
        </button>
      </RouterLink>

      <RouterLink to="/year" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <Calendar class="w-5 h-5" />
          نمای سالانه
        </button>
      </RouterLink>

      <RouterLink to="/month" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <CalendarRange class="w-5 h-5" />
          نمای ماهانه
        </button>
      </RouterLink>

      <RouterLink to="/week" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <CalendarDays class="w-5 h-5" />
          نمای هفتگی
        </button>
      </RouterLink>

      <RouterLink to="/day" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <CalendarClock class="w-5 h-5" />
          نمای روزانه
        </button>
      </RouterLink>
      <RouterLink to="/settings" v-slot="{ isActive }">
  <button
    :class="[
      'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
      isActive
        ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
        : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
    ]"
  >
    <Menu class="w-5 h-5" />
    تنظیمات
  </button>
</RouterLink>

    </div>

    <!-- تب‌ها موبایل -->
    <div v-if="mobileMenuOpen" class="md:hidden flex flex-col gap-2 bg-white px-4 py-2 shadow-lg">
      <RouterLink to="/goals" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm',
          ]"
        >
          <Home class="w-5 h-5" />
          اهداف
        </button>
      </RouterLink>

      <RouterLink to="/year" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm',
          ]"
        >
          <Calendar class="w-5 h-5" />
          نمای سالانه
        </button>
      </RouterLink>

      <RouterLink to="/month" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm',
          ]"
        >
          <CalendarRange class="w-5 h-5" />
          نمای ماهانه
        </button>
      </RouterLink>

      <RouterLink to="/week" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm',
          ]"
        >
          <CalendarDays class="w-5 h-5" />
          نمای هفتگی
        </button>
      </RouterLink>

      <RouterLink to="/day" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm',
          ]"
        >
          <CalendarClock class="w-5 h-5" />
          نمای روزانه
        </button>
      </RouterLink>
      <RouterLink to="/settings" v-slot="{ isActive }">
        <button
          :class="[
            'flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
            isActive
              ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
              : 'text-gray-600 hover:text-blue-600 hover:shadow-sm hover:scale-105',
          ]"
        >
          <Menu class="w-5 h-5" />
          تنظیمات
        </button>
      </RouterLink>
    </div>

    <!-- محتوای تب‌ها -->
    <div class="flex-1 p-6 bg-gray-50">
      <RouterView />
    </div>
  </div>
</template>
