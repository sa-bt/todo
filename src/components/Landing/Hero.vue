<template>
  <section id="home" class="surface relative py-24 overflow-hidden min-h-screen flex items-center">
    
    <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div v-for="(icon, index) in bubbleIcons" :key="index"
           class="absolute animate-float-spin opacity-60"
           :style="{ 
             left: icon.x + '%', 
             top: icon.y + '%', 
             animationDuration: icon.duration + 's',
             animationDelay: icon.delay + 's',
             width: icon.size + 'px',
             height: icon.size + 'px'
           }">
        <img :src="icon.url" :alt="icon.name" class="w-full h-full object-contain filter drop-shadow-lg">
      </div>
    </div>

    <div
        class="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-14 items-center w-full relative z-10"
        :class="isFa ? 'rtl' : 'ltr'"
    >
      <div
          class="flex flex-col gap-4 min-h-[450px] p-8 md:p-10 rounded-3xl backdrop-blur-[8px] bg-white/[0.03] border border-white/10 shadow-2xl shadow-black/5"
          :class="isFa ? 'text-right items-start rtl-space' : 'text-left items-start ltr-space'"
      >
        <transition name="fade-slide">
          <div v-if="step >= 1">
            <h1 class="text-4xl md:text-5xl font-bold text-[var(--color-heading)]">
              {{ t('hero.greeting') }}
            </h1>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 2">
           <h2 class="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent gradient-text">
  {{ t('hero.intro') }}
</h2>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 3">
            <p class="text-lg text-text-secondary leading-relaxed max-w-lg">
              {{ t('hero.role') }}
            </p>
            <p class="text-lg text-text-secondary mb-6 mt-2">
              {{ t('hero.motto') }}
            </p>
          </div>
        </transition>

        <transition name="fade-slide">
          <div v-if="step >= 4" class="w-full mt-2">
            <div class="flex gap-4 w-full" :class="isFa ? 'flex-row-reverse justify-end' : 'flex-row justify-start'">
              <a href="#projects" class="btn hero-btn-primary"> {{ t('hero.cta_projects') }} </a>
              <a href="#contact" class="btn hero-btn-ghost"> {{ t('hero.cta_contact') }} </a>
            </div>
          </div>
        </transition>
      </div>

      <div class="relative flex justify-center items-center w-full h-[450px]">
        <div class="relative z-10 w-full max-w-md bg-[#300a24]/95 backdrop-blur-xl rounded-xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
          <div class="flex items-center justify-between px-4 py-2 bg-[#481439] border-b border-white/5">
            <div class="flex gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>
            <span class="text-[10px] text-gray-400 font-mono tracking-widest uppercase">AhmadBakhshian.vue</span>
          </div>
          
          <div class="p-6 font-mono text-[11px] md:text-[13px] h-[280px] md:h-[320px] text-left ltr overflow-y-auto custom-scrollbar bg-black/30">
            <div class="text-[#87d5a2] mb-3 font-bold">ahmad@ubuntu:~$ <span class="text-white font-normal opacity-80">npm run dev</span></div>
            <div class="whitespace-pre-wrap leading-relaxed text-[#fce94f]">
              {{ currentText }}<span class="w-2 h-4 bg-orange-500 animate-pulse inline-block align-middle ml-1"></span>
            </div>
            <div v-if="step === 4" class="mt-4 text-cyan-400 text-[10px] font-bold animate-pulse">
               > [READY] Landing Page Mounted.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({ isFa: { type: Boolean, required: true } })

const currentText = ref('')
const step = ref(0)
const bubbleIcons = ref([])

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
    x: Math.random() * 85 + 5,
    y: Math.random() * 85 + 5,
    size: Math.random() * 20 + 45,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * -20
  }))
}

const startCoding = async () => {
  for (const part of vueCode) {
    for (let i = 0; i < part.text.length; i++) {
      currentText.value += part.text.charAt(i)
      await new Promise(r => setTimeout(r, 20))
    }
    step.value = part.step
    await new Promise(r => setTimeout(r, 400))
  }
}

onMounted(() => {
  generateBubbles()
  startCoding()
})
</script>
<style scoped>
/* --- تنظیمات عمومی بخش متن --- */
.rtl-space p { margin-left: 0 !important; margin-right: 0 !important; }
.ltr-space p { margin-right: 0 !important; }

/* --- انیمیشن اختصاصی گرادیانت متنی (هندلینگ LTR/RTL) --- */
.gradient-text {
  background-size: 200% auto;
  display: inline-block;
  -webkit-background-clip: text;
  background-clip: text;
}

/* استایل و انیمیشن برای زبان انگلیسی (چپ به راست) */
.ltr .gradient-text {
  background-image: linear-gradient(to right, var(--color-primary), var(--color-accent), var(--color-primary));
  animation: move-right 4s linear infinite;
}

/* استایل و انیمیشن برای زبان فارسی (راست به چپ) */
.rtl .gradient-text {
  background-image: linear-gradient(to left, var(--color-primary), var(--color-accent), var(--color-primary));
  animation: move-left 4s linear infinite;
}

@keyframes move-right {
  0% { background-position: 0% center; }
  100% { background-position: -200% center; }
}

@keyframes move-left {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* --- دکمه‌ها با استایل اورجینال --- */
.hero-btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.7rem 1.6rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(var(--color-primary-rgb), 0.3);
  font-weight: 700;
  transition: all 0.3s ease;
  display: inline-block;
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(var(--color-primary-rgb), 0.5);
}

.hero-btn-ghost {
  border: 2px solid var(--color-primary);
  padding: 0.7rem 1.6rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: var(--color-primary);
  font-weight: 700;
  display: inline-block;
}

.hero-btn-ghost:hover {
  background: var(--color-primary);
  color: white !important;
  transform: translateY(-3px);
}

/* --- انیمیشن آیکون‌های شناور و چرخشی --- */
.animate-float-spin {
  animation: float-spin linear infinite;
}

@keyframes float-spin {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(40px, -30px) rotate(90deg); }
  50% { transform: translate(0, -60px) rotate(180deg); }
  75% { transform: translate(-40px, -30px) rotate(270deg); }
  100% { transform: translate(0, 0) rotate(360deg); }
}

/* --- انیمیشن Mount المان‌ها (جایگزین AOS) --- */
.fade-slide-enter-active {
  transition: all 0.8s ease-out;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* --- استایل‌های ترمینال و اسکرول‌بار --- */
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #481439;
  border-radius: 10px;
}

.ltr { direction: ltr; text-align: left; }
.rtl { direction: rtl; text-align: right; }
</style>