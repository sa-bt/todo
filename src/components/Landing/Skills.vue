<template>
  <section id="skills" class="py-32 relative">
    <div class="max-w-7xl mx-auto px-6 md:px-12">

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
          @mousemove="tilt($event)"
          @mouseleave="resetTilt($event)"
        >

          <!-- Glow -->
          <div class="absolute inset-0 flex justify-center mt-6 pointer-events-none">
            <div
              class="w-20 h-20 rounded-full opacity-40 blur-xl
                     bg-[var(--color-primary)]
                     transition-all duration-700"
            ></div>
          </div>

          <!-- Icon -->
          <div class="flex justify-center mb-4 relative z-10">
            <component
              :is="icons[skill.key] ?? Box"
              class="w-10 h-10 text-[var(--color-primary)]
                     transition-transform duration-500
                     group-hover:scale-110"
            />
          </div>

          <!-- Title -->
          <h3
            class="font-semibold text-xl text-[var(--color-heading)]
                   tracking-tight text-center mb-5 relative z-10"
          >
            {{ skill.title }}
          </h3>

          <!-- Items -->
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

          <!-- Progress -->
          <div class="relative z-10">
            <div class="h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r
                       from-[var(--color-primary)]
                       to-[var(--color-accent)]
                       transition-all duration-300 ease-out"
                :style="{ width: animatedPercents[skill.key] + '%' }"
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
import { computed, reactive, onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Code, Layers, Monitor, Server, Wrench, Database, Box
} from 'lucide-vue-next'

const { t, tm } = useI18n()

/* ===== Data from JSON ===== */
const skillsData = tm('skills')

const keys = computed(() =>
  Object.keys(skillsData).filter(k => k !== 'title')
)

const skillsList = computed(() =>
  keys.value.map(key => ({
    key,
    title: skillsData[key].title,
    items: skillsData[key].items,
    percent: skillsData[key].percent
  }))
)

/* ===== Icons ===== */
const icons = {
  backend: Code,
  frontend: Layers,
  ux: Monitor,
  devops: Server,
  database: Database,
  tools: Wrench
}

/* ===== Animated percent ===== */
const animatedPercents = reactive({})
const animatedFlags = reactive({})

watchEffect(() => {
  keys.value.forEach(key => {
    if (!(key in animatedPercents)) {
      animatedPercents[key] = 0
      animatedFlags[key] = false
    }
  })
})

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

/* ===== Mild tilt (مثل قبل) ===== */
function tilt(event) {
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

function resetTilt(event) {
  event.currentTarget.style.transform =
    'perspective(900px) rotateX(0) rotateY(0) translateY(0)'
}

/* ===== Observer ===== */
onMounted(() => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio >= 0.9) {
          const key = entry.target.dataset.skill
          const skill = skillsList.value.find(s => s.key === key)
          if (skill) animatePercent(key, skill.percent)
        }
      })
    },
    { threshold: 0.9 }
  )

  document.querySelectorAll('.skill-card')
    .forEach(el => observer.observe(el))
})
</script>

<style scoped>
.skill-card {
  transform-style: preserve-3d;
}
</style>
