<template>
  <section class="space-y-6" dir="rtl">
    <div
      class="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-xs font-bold text-[var(--color-primary)]">کتابخانه آموزش</p>
        <h2 class="mt-1 text-xl font-black text-[var(--color-heading)]">همه دوره‌ها</h2>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">
          {{ courseCountLabel }}
        </p>
      </div>

      <label
        class="flex min-h-11 w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] px-3 sm:max-w-xs"
      >
        <Search class="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
        <span class="sr-only">جست‌وجوی دوره</span>
        <input
          v-model.trim="searchQuery"
          type="search"
          class="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-text-secondary)]"
          placeholder="جست‌وجو در دوره‌ها..."
        />
      </label>
    </div>

    <div
      v-if="errorMessage"
      class="flex flex-col items-start gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div class="flex gap-3">
        <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div>
          <strong class="text-sm text-rose-700">دریافت دوره‌ها ناموفق بود</strong>
          <p class="mt-1 text-sm text-rose-600">{{ errorMessage }}</p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white"
        @click="fetchCourseList"
      >
        <RefreshCw class="h-4 w-4" aria-hidden="true" />
        تلاش دوباره
      </button>
    </div>

    <div v-else-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="index in 6"
        :key="index"
        class="h-52 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5"
      >
        <div class="h-12 w-12 rounded-2xl bg-[var(--color-background-mute)]" />
        <div class="mt-6 h-5 w-2/3 rounded bg-[var(--color-background-mute)]" />
        <div class="mt-4 h-3 w-full rounded bg-[var(--color-background-mute)]" />
        <div class="mt-2 h-3 w-4/5 rounded bg-[var(--color-background-mute)]" />
      </div>
    </div>

    <div
      v-else-if="filteredCourses.length === 0"
      class="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-5 py-16 text-center"
    >
      <span
        class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-background-soft)] text-[var(--color-primary)]"
      >
        <BookOpen class="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 class="mt-5 font-black text-[var(--color-heading)]">
        {{ searchQuery ? 'دوره‌ای پیدا نشد' : 'هنوز دوره‌ای وجود ندارد' }}
      </h3>
      <p class="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--color-text-secondary)]">
        {{
          searchQuery
            ? 'عبارت دیگری را امتحان کنید یا جست‌وجو را پاک کنید.'
            : 'پس از ثبت دوره در سمت سرور، فهرست آن در این بخش نمایش داده می‌شود.'
        }}
      </p>
      <button
        v-if="searchQuery"
        type="button"
        class="mt-5 min-h-10 rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-heading)]"
        @click="searchQuery = ''"
      >
        پاک کردن جست‌وجو
      </button>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="course in filteredCourses"
        :key="course.slug"
        :to="{ name: 'adminCourseDetail', params: { slug: course.slug } }"
        class="group flex min-h-56 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-xl"
      >
        <div class="flex items-start justify-between gap-4">
          <span
            class="grid h-12 w-12 place-items-center rounded-2xl"
            :class="
              course.visual ? 'bg-violet-500/10 text-violet-600' : 'bg-cyan-500/10 text-cyan-600'
            "
          >
            <GitBranch v-if="course.visual" class="h-6 w-6" aria-hidden="true" />
            <BookOpen v-else class="h-6 w-6" aria-hidden="true" />
          </span>
          <span
            class="rounded-full px-3 py-1 text-[0.7rem] font-bold"
            :class="
              course.visual ? 'bg-violet-500/10 text-violet-600' : 'bg-cyan-500/10 text-cyan-600'
            "
          >
            {{ course.visual ? 'تعاملی' : 'مطالعه‌ای' }}
          </span>
        </div>

        <h3 class="mt-5 text-lg font-black text-[var(--color-heading)]">{{ course.title }}</h3>
        <p class="mt-2 line-clamp-2 text-sm leading-7 text-[var(--color-text-secondary)]">
          {{ course.description || 'توضیحی برای این دوره ثبت نشده است.' }}
        </p>

        <span
          class="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-[var(--color-primary)]"
        >
          مشاهده دوره
          <ArrowLeft class="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden="true" />
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, BookOpen, CircleAlert, GitBranch, RefreshCw, Search } from 'lucide-vue-next'
import { getCourseList } from '@/plugins/api'

const loading = ref(true)
const errorMessage = ref('')
const availableCourses = ref([])
const searchQuery = ref('')

const filteredCourses = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase('fa')

  if (!query) return availableCourses.value

  return availableCourses.value.filter((course) =>
    [course.title, course.description, course.slug]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('fa').includes(query)),
  )
})

const courseCountLabel = computed(() => {
  const count = availableCourses.value.length

  if (!count) return 'دوره‌های ثبت‌شده در این بخش نمایش داده می‌شوند.'

  return `${count.toLocaleString('fa-IR')} دوره در کتابخانه موجود است.`
})

async function fetchCourseList() {
  loading.value = true
  errorMessage.value = ''

  try {
    const responseData = await getCourseList()

    if (Array.isArray(responseData)) {
      availableCourses.value = responseData
    } else if (Array.isArray(responseData?.courses)) {
      availableCourses.value = responseData.courses
    } else {
      availableCourses.value = []
      errorMessage.value = 'پاسخ دریافتی ساختار معتبر فهرست دوره را ندارد.'
    }
  } catch (error) {
    availableCourses.value = []
    errorMessage.value = error?.response?.data?.message || 'ارتباط با سرور برقرار نشد.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCourseList)
</script>
