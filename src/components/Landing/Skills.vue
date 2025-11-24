<template>
  <section id="skills" class="py-32 relative">

    <div class="max-w-7xl mx-auto px-6 md:px-12">

      <!-- عنوان -->
      <h2
          class="text-4xl font-extrabold text-[var(--color-heading)] mb-14 text-center tracking-tight"
          data-aos="fade-up"
      >
        {{ t('skills.title') }}
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

        <div
            v-for="skill in skillsList"
            :key="skill.key"
            class="skill-card relative py-8 px-7 rounded-3xl
              bg-white/10 backdrop-blur-xl
              border border-white/20
              shadow-[0_10px_40px_rgba(0,0,0,0.25)]
              transition-all duration-500
              hover:shadow-[0_20px_50px_rgba(0,0,0,0.40)]
              cursor-pointer will-change-transform"
            :data-skill="skill.key"
            data-aos="fade-up"
            @mousemove="tilt($event, skill.key)"
            @mouseleave="resetTilt(skill.key)"
        >

          <!-- حلقه نور دور آیکون -->
          <div class="absolute inset-0 flex justify-center mt-6 pointer-events-none">
            <div class="w-20 h-20 rounded-full opacity-40 blur-xl bg-[var(--color-primary)] transition-all duration-700 group-hover:opacity-60"></div>
          </div>

          <!-- آیکون -->
          <div class="flex justify-center mb-4 relative z-10">
            <component
                :is="icons[skill.key]"
                class="w-10 h-10 text-[var(--color-primary)] transition-all duration-500 group-hover:scale-110"
            />
          </div>

          <!-- عنوان وسط -->
          <h3 class="font-semibold text-xl text-[var(--color-heading)] tracking-tight text-center mb-5 relative z-10">
            {{ skill.title }}
          </h3>

          <!-- آیتم‌ها به صورت Chip -->
          <div class="flex flex-wrap justify-center gap-2 mb-6 relative z-10">
            <div
                v-for="(item, idx) in skill.items"
                :key="idx"
                class="px-3 py-1.5 rounded-full text-xs
                     bg-white/20 backdrop-blur-md
                     border border-white/30
                     text-[var(--color-heading)]
                     shadow-sm hover:bg-white/30
                     transition-all whitespace-nowrap"
            >
              {{ item }}
            </div>
          </div>

          <!-- Progress Line با Shine -->
          <div class="w-full relative z-10">
            <div class="h-2 rounded-full bg-white/25 overflow-hidden relative">

              <!-- خط اصلی progress -->
              <div
                  class="h-full rounded-full bg-gradient-to-r
                       from-[var(--color-primary)]
                       to-[var(--color-accent)]
                       transition-all duration-300 ease-out"
                  :style="{ width: animatedPercents[skill.key] + '%' }"
              ></div>

              <!-- Shine -->
              <div
                  class="absolute inset-0 shine pointer-events-none"
                  :style="{ transform: `translateX(${animatedPercents[skill.key]}%)` }"
              ></div>

            </div>

            <p class="text-sm mt-2 text-text-secondary text-center">
              {{ animatedPercents[skill.key] }}%
            </p>
          </div>

        </div>

      </div>

    </div>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Code, Layers, Monitor, Server, Box, Wrench
} from 'lucide-vue-next'

const { t, tm } = useI18n()

const keys = ['backend', 'frontend', 'ux', 'devops', 'system', 'tools']

const skillsList = computed(() =>
    keys.map(key => {
      const data = tm(`skills.${key}`)
      return {
        key,
        title: data.title,
        items: data.items,
        percent: data.percent
      }
    })
)

const icons = {
  backend: Code,
  frontend: Layers,
  ux: Monitor,
  devops: Server,
  system: Box,
  tools: Wrench
}

const animatedPercents = reactive({
  backend: 0, frontend: 0, ux: 0, devops: 0, system: 0, tools: 0
})
const animatedFlags = reactive({
  backend: false, frontend: false, ux: false, devops: false, system: false, tools: false
})

// 🔥 Counter و Progress animation
function animatePercent(key, target) {
  if (animatedFlags[key]) return
  animatedFlags[key] = true

  let current = 0
  const duration = 900
  const interval = 16
  const increment = target / (duration / interval)

  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      current = target
      clearInterval(timer)
    }
    animatedPercents[key] = Math.round(current)
  }, interval)
}

// 🔥 Tilt effect
function tilt(event, key) {
  const card = event.currentTarget
  const rect = card.getBoundingClientRect()

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = ((y - centerY) / centerY) * 6
  const rotateY = ((x - centerX) / centerX) * -6

  card.style.transform = `
    perspective(900px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    translateY(-5px)
  `
}

function resetTilt(key) {
  const cards = document.querySelectorAll(`.skill-card[data-skill="${key}"]`)
  cards.forEach(c => (c.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'))
}

onMounted(() => {
  const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= 0.9) {
            const key = entry.target.getAttribute('data-skill')
            const skill = skillsList.value.find(s => s.key === key)
            animatePercent(key, skill.percent)
          }
        })
      },
      { threshold: 0.9 }
  )

  setTimeout(() => {
    document.querySelectorAll('.skill-card')
        .forEach(el => observer.observe(el))
  }, 300)
})
</script>
<style scoped>
.shine {
  background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.7),
      transparent
  );
  width: 120px;
  height: 100%;
  filter: blur(8px);
  opacity: 0.35;
  transition: transform 0.2s linear;
}
</style>
