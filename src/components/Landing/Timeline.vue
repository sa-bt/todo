<template>
  <section id="experience" class="py-28 relative">
    <h2
      class="text-4xl font-extrabold text-[var(--color-heading)] mb-20 text-center"
      data-aos="fade-up"
      data-aos-once="false"
    >
      {{ t('experience.title') }}
    </h2>

    <div class="relative max-w-5xl mx-auto px-6">

      <!-- خط عمودی -->
      <!-- موبایل: سمت چپ، دسکتاپ: وسط -->
      <div
        class="absolute top-0 bottom-0 left-[20px] md:left-1/2 w-[3px] md:-translate-x-1/2
               bg-[var(--color-primary)] opacity-40 rounded-full"
      ></div>

      <!-- آیتم‌ها -->
      <div
        v-for="(item, i) in items"
        :key="i"
        class="relative w-full flex mb-20"
        :class="getLayoutClass(i)"
      >

        <!-- دایره روی خط -->
        <div
          class="absolute left-[20px] md:left-1/2 -translate-x-1/2 w-5 h-5 rounded-full
                 bg-[var(--color-primary)]
                 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)]
                 z-20"
        ></div>

        <!-- کارت -->
        <div
          class="card-hover w-full md:w-[42%] bg-white/10 backdrop-blur-xl border border-white/20
                 p-5 rounded-xl shadow-lg transition-all duration-500
                 pl-[50px] md:pl-5"
          :data-aos="computeAos(i)"
          :data-aos-once="false"
          data-aos-duration="800"
        >
          <h3 class="text-lg font-bold text-[var(--color-heading)] mb-1 text-left md:text-center">
            {{ item.role }}
          </h3>

          <p class="text-primary font-medium mb-2 text-left md:text-center">
            {{ item.company }}
          </p>

          <p class="text-sm text-text-secondary mb-3 text-left md:text-center opacity-70">
            {{ item.period }}
          </p>

          <p class="text-text-secondary leading-relaxed text-justify md:text-center text-[15px]">
            {{ item.desc }}
          </p>
        </div>

      </div>

    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const { t, tm } = useI18n()

const props = defineProps({
  isFa: Boolean
})

// مدیریت تشخیص موبایل
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const items = computed(() => tm('experience.items'))

// تابع تعیین چیدمان (زیگزاگ در دسکتاپ، راست‌چین در موبایل)
const getLayoutClass = (i) => {
  // در موبایل: همه کارت‌ها به سمت راست بروند (کنار خط چپ)
  if (isMobile.value) return 'justify-end'

  // منطق زیگزاگ کد اصلی شما
  if (props.isFa) {
    // RTL
    return i % 2 === 0 ? 'justify-end' : 'justify-start'
  } else {
    // LTR (English)
    return i % 2 === 0 ? 'justify-start' : 'justify-end'
  }
}

// تابع تعیین انیمیشن
const computeAos = (i) => {
  // در موبایل: همه از پایین بالا بیایند
  if (isMobile.value) return 'fade-up'

  // منطق زیگزاگ کد اصلی شما
  if (props.isFa) {
    // RTL
    return i % 2 === 0 ? 'fade-left' : 'fade-right'
  } else {
    // LTR (English)
    return i % 2 === 0 ? 'fade-right' : 'fade-left'
  }
}
</script>

<style scoped>
.card-hover {
  transition: all .4s ease;
  backdrop-filter: blur(12px);
}

.card-hover:hover {
  backdrop-filter: blur(16px);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.18);
}
</style>