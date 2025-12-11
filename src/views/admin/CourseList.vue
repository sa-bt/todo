<template>
  <div class="p-4" dir="rtl">
    <h2 class="text-2xl font-bold text-[var(--color-heading)] mb-6">فهرست دوره‌های آموزشی</h2>
    
    <p class="text-[var(--color-text-secondary)] mb-6">
      برای مشاهده و یادآوری مفاهیم، روی دوره مورد نظر کلیک کنید. 
      <span class="font-medium text-[var(--color-primary)]">
          (توجه: فهرست از API واقعی واکشی می‌شود.)
      </span>
    </p>

    <div v-if="loading" class="text-center py-10">
        <svg class="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-[var(--color-text-secondary)]">در حال بارگذاری فهرست...</p>
      </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <RouterLink
          v-for="course in availableCourses"
          :key="course.slug"
          :to="{ name: 'adminCourseDetail', params: { slug: course.slug } }"
          class="block p-5 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition duration-300 shadow-md hover:shadow-lg bg-[var(--color-background-soft)]"
      >
        <h3 class="text-xl font-semibold text-[var(--color-heading)] mb-2 flex items-center gap-2">
            <!-- آیکون‌ها بر اساس نوع محتوا -->
            <svg v-if="course.visual" class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            <svg v-else class="w-5 h-5 text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.464 9.014 5 7 5a6 6 0 000 12h14a6 6 0 00-6-6h-1.253v-1.253z"></path></svg>
            <span>{{ course.title }}</span>
        </h3>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          {{ course.description }}
        </p>
        <span class="mt-3 inline-block text-xs px-2 py-1 rounded-full font-medium"
              :class="course.visual ? 'bg-red-100 text-red-700 dark:bg-red-700/50 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'">
            {{ course.visual ? 'بصری سازی پیشرفته' : 'محتوای تئوری' }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { getCourseList } from '@/plugins/api'; // 👈 تابع واقعی واکشی فهرست

const loading = ref(true); 
const availableCourses = ref([]);

// ⚠️ داده‌های ساختگی حذف شدند

async function fetchCourseList() {
    loading.value = true;
    try {
        const responseData = await getCourseList();
        // 💡 فرض می‌کنیم responseData آرایه‌ای از دوره‌هاست
        if (Array.isArray(responseData)) {
             availableCourses.value = responseData;
        } else if (responseData && Array.isArray(responseData.courses)) {
             // اگر API دوره‌ها را در یک فیلد 'courses' برگرداند
             availableCourses.value = responseData.courses;
        } else {
             console.error("API did not return an array of courses.");
             availableCourses.value = []; // اگر داده‌ای نیامد، لیست را خالی نگه می‌داریم
        }
    } catch (e) { 
        console.error("Failed to load course list:", e);
        // Fallback: اگر خطا رخ داد، از یک لیست خالی استفاده کن
        availableCourses.value = [];
    }
    
    loading.value = false;
}

onMounted(fetchCourseList);
</script>