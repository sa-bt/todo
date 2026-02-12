<template>
  <section
      id="hero"
      ref="heroRef"
  :class="isFa ? 'rtl' : 'ltr'"
  class="surface relative flex flex-col w-full overflow-hidden"
  :style="{ minHeight: 'calc(100dvh - var(--nav-height))' }"
  >
  <!-- آیکون‌های شناور -->
  <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div v-for="(icon, index) in bubbleIcons" :key="index"
         class="absolute animate-float-spin opacity-20"
         :style="{
             left: icon.x + '%',
             top: icon.y + '%',
             animationDuration: icon.duration + 's',
             animationDelay: icon.delay + 's',
             width: icon.size + 'px',
             height: icon.size + 'px'
           }">
      <img :src="icon.url" :alt="icon.name" class="w-full h-full object-contain drop-shadow-lg">
    </div>
  </div>

  <!-- Container -->
  <div
      class="container mx-auto px-4 md:px-6 lg:px-8 w-full relative z-10 flex-grow flex items-center h-full py-10 md:py-0"
  >
    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">

      <!-- بخش متن -->
      <div class="flex flex-col justify-center gap-6 md:gap-8 p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl backdrop-blur-md bg-white/[0.04] border border-white/10 shadow-2xl w-full min-w-0">

        <transition name="fade-slide">
          <div v-if="step >= 1">
            <h1 class="font-bold text-[var(--color-heading)] leading-[1.1] tracking-tight"
                style="font-size: clamp(2rem, 5vw + 1rem, 4rem);">
              {{ t('hero.greeting') }}
            </h1>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 2">
            <h2 class="font-extrabold bg-clip-text text-transparent gradient-text leading-[1.2]"
                style="font-size: clamp(1.8rem, 4.5vw + 1rem, 3.5rem);">
              {{ t('hero.intro') }}
            </h2>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 3">
            <p class="text-text-secondary leading-relaxed font-light"
               style="font-size: clamp(1rem, 1.5vw, 1.25rem);">
              {{ t('hero.role') }}
            </p>
            <p class="text-text-secondary mt-2 font-light"
               style="font-size: clamp(1rem, 1.5vw, 1.25rem);">
              {{ t('hero.motto') }}
            </p>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 4" class="w-full mt-4 md:mt-6">
            <div class="flex flex-wrap gap-4 w-full justify-start">
              <a href="#projects" class="btn hero-btn-primary w-full sm:w-auto text-center py-3 px-8 text-base md:text-lg">
                {{ t('hero.cta_projects') }}
              </a>
              <a href="#contact" class="btn hero-btn-ghost w-full sm:w-auto text-center py-3 px-8 text-base md:text-lg">
                {{ t('hero.cta_contact') }}
              </a>
            </div>
          </div>
        </transition>
      </div>

      <!-- بخش ترمینال -->
      <!-- order-first: در موبایل بالاتر از متن قرار میگیرد -->
      <!-- md:order-none: در دسکتاپ بسته به dir (چپ یا راست) قرار میگیرد -->
      <div class="relative w-full order-first md:order-none flex items-center justify-center h-full pb-8 md:pb-0">
        <div
            class="w-full bg-[#300a24]/95 backdrop-blur-xl rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                    border border-white/10 overflow-hidden flex flex-col
                    min-h-[300px] md:h-[500px] lg:h-[600px] transition-all duration-500"
        >
          <!-- هدر ترمینال -->
          <div class="flex items-center justify-between px-4 py-3 md:px-6 bg-[#481439] border-b border-white/5 shrink-0">
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <span class="text-[10px] md:text-xs text-gray-400 font-mono tracking-widest uppercase opacity-80">
              {{ isFa ? 'ویرایشگر' : 'Editor' }}
            </span>
          </div>

          <!-- بدنه کد -->
          <!-- dir="ltr": چون کد همیشه باید چپ به راست باشد -->
          <div dir="ltr" class="p-4 md:p-6 lg:p-8 font-mono flex-1 overflow-y-auto text-left custom-scrollbar bg-black/40"
               style="font-size: clamp(11px, 1.2vw, 15px); line-height: 1.6;">

            <div class="text-[#87d5a2] mb-4 font-bold shrink-0 flex items-center gap-2">
              <span class="text-white">ahmad@ubuntu:~$</span>
              <span class="text-[#fce94f]">npm run dev</span>
            </div>

            <div class="whitespace-pre-wrap text-[#fce94f] font-medium break-words">
              {{ currentText }}<span class="w-2 h-5 bg-orange-500 animate-pulse inline-block align-middle ml-1 rounded-sm align-middle"></span>
            </div>

            <div v-if="step === 4" class="mt-4 text-cyan-400 font-bold animate-pulse shrink-0"
                 style="font-size: clamp(10px, 1vw, 13px);">
              > [READY] Page Rendered successfully.
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

// محاسبه وضعیت فارسی بودن (چون پراپس از App حذف شده)
const { t, locale } = useI18n()
const isFa = computed(() => locale.value.startsWith('fa'))

const heroRef = ref(null)
const currentText = ref('')
const step = ref(0)
const bubbleIcons = ref([])
let hasStartedCoding = false

const vueCode = [
  { text: `<template>\n  <h1>{{ t('greeting') }}</h1>`, step: 1 },
  { text: `\n  <h2>{{ t('intro') }}</h2>`, step: 2 },
  { text: `\n  <p>{{ t('role') }}</p>`, step: 3 },
  { text: `\n  <div class="actions" />\n</template>`, step: 4 }
]

const iconList = [
  { name: 'Laravel', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg' },
  { name: 'Vue', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
  { name: 'PHP', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'Tailwind', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'JS', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'MySQL', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'Docker', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Redis', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' }
]

const generateBubbles = () => {
  bubbleIcons.value = iconList.map(icon => ({
    ...icon,
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    size: Math.random() * 30 + 40,
    duration: Math.random() * 15 + 20,
    delay: Math.random() * -20
  }))
}

const startCoding = async () => {
  currentText.value = ''
  step.value = 0

  for (const part of vueCode) {
    for (let i = 0; i < part.text.length; i++) {
      currentText.value += part.text.charAt(i)
      await new Promise(r => setTimeout(r, 20))
    }
    step.value = part.step
    await new Promise(r => setTimeout(r, 500))
  }
}

onMounted(() => {
  generateBubbles()
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!hasStartedCoding) {
          startCoding()
          hasStartedCoding = true
        }
      }
    })
  }, { threshold: 0.1 })

  if (heroRef.value) observer.observe(heroRef.value)
})
</script>

<style scoped>
/* انیمیشن آیکون‌ها */
@keyframes float-spin {
  0% { transform: translateY(0px) rotate(0deg) translateX(0); }
  33% { transform: translateY(-20px) rotate(5deg) translateX(5px); }
  66% { transform: translateY(10px) rotate(-5deg) translateX(-5px); }
  100% { transform: translateY(0px) rotate(0deg) translateX(0); }
}
.animate-float-spin { animation: float-spin 20s infinite ease-in-out; }

/* اسکرول بار */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }

/* گرادیانت متن */
.gradient-text {
  background-size: 200% auto;
  display: inline-block;
  -webkit-background-clip: text;
  background-clip: text;
}

/* گرادینت متن بر اساس جهت زبان (نیازمند کلاس ltr یا rtl روی تگ section است) */
.ltr .gradient-text {
  background-image: linear-gradient(to right, var(--color-primary), var(--color-accent), var(--color-primary));
  animation: move-right 4s linear infinite;
}
.rtl .gradient-text {
  background-image: linear-gradient(to left, var(--color-primary), var(--color-accent), var(--color-primary));
  animation: move-left 4s linear infinite;
}

@keyframes move-right { 0% { background-position: 0% center; } 100% { background-position: -200% center; } }
@keyframes move-left { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }

/* دکمه‌ها */
.btn { display: inline-block; font-weight: 700; border-radius: 10px; transition: all 0.3s ease; }
.hero-btn-primary { background: var(--color-primary); color: white; box-shadow: 0 10px 25px rgba(var(--color-primary-rgb), 0.3); }
.hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(var(--color-primary-rgb), 0.5); }
.hero-btn-ghost { border: 2px solid var(--color-primary); color: var(--color-primary); }
.hero-btn-ghost:hover { background: var(--color-primary); color: white !important; transform: translateY(-2px); }

/* ترنزیشن */
.fade-slide-enter-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
</style>
