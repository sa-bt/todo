<template>
  <section id="about" class="surface relative py-12 md:py-32" ref="aboutRef">
    <div
        class="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12 md:gap-20 items-start"
        :class="isFa ? 'rtl' : 'ltr'"
    >
      <!-- متن -->
      <div class="relative">
        <div
            class="absolute top-0 bottom-0 w-[2px] bg-[var(--color-primary)] opacity-70"
            :class="isFa ? 'right-0' : 'left-0'"
        ></div>

        <div
            class="flex flex-col gap-6 md:gap-8 px-6"
            :class="isFa ? 'text-right pr-10' : 'text-left pl-10'"
        >
          <h2 class="text-3xl md:text-4xl font-extrabold">
            {{ t('about.title') }}
          </h2>

          <p class="text-base md:text-lg text-text-secondary leading-relaxed text-justify">
            {{ t('about.text') }}
          </p>

          <!-- stats -->
          <div
              class="flex gap-8 md:gap-12 mt-4 items-center"
              :class="isFa ? 'flex-row-reverse' : 'flex-row'"
          >
            <!-- experience -->
            <div class="flex flex-col items-center">
              <div class="counter-box">
                <transition-group
                    name="counter"
                    tag="div"
                    class="counter-number"
                >
                  <span
                      v-for="num in [experience]"
                      :key="num"
                      class="counter-value"
                  >
                    <span class="counter-num">{{ num }}</span>
                    <span class="counter-plus">+</span>
                  </span>
                </transition-group>
              </div>

              <span class="text-xs md:text-sm text-text-secondary mt-1">
                {{ t('about.years') }}
              </span>
            </div>

            <!-- projects -->
            <div class="flex flex-col items-center relative">
              <!-- FIX: اضافه کردن کانتینر ارتفاع ثابت برای تراز شدن -->
              <div class="counter-box flex items-center justify-center relative">
                <span
                    class="stat-number flex items-center justify-center relative"
                    :style="{ transform: scaleStyle }"
                >
                  <span
                      ref="projectsNumber"
                      :class="{ shake: pressure }"
                  >
                    <span v-if="!exploded">{{ projects }}+</span>
                    <span v-else class="infinity">∞+</span>
                  </span>

                  <!-- particles -->
                  <span
                      v-for="p in particles"
                      :key="p.id"
                      class="particle"
                      :style="p.style"
                  ></span>
                </span>
              </div>

              <span class="text-xs md:text-sm text-text-secondary">
                {{ t('about.projects') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- تصویر با SVG ترک -->
      <div
          ref="imageContainer"
          class="relative w-full max-w-sm mx-auto md:mx-0 transition-all duration-700 bg-white p-1 rounded-2xl overflow-hidden"
          :class="{ 'exploded-style': exploded }"
      >
        <img
            src="@/assets/images/myself.png"
            class="rounded-2xl w-full h-auto"
            alt="About"
        />

        <!-- افکت فلش سفید -->
        <div v-if="exploded" class="glass-flash"></div>

        <!-- SVG ترک‌ها -->
        <svg
            v-if="exploded && svgSize"
            class="absolute inset-0 z-50 pointer-events-none mix-blend-overlay"
            :viewBox="`0 0 ${svgSize.w} ${svgSize.h}`"
            style="width: 100%; height: 100%;"
        >
          <defs>
            <filter id="dark-shadow">
              <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.5"/>
            </filter>
          </defs>

          <g filter="url(#dark-shadow)">
            <path
                v-for="(p, index) in allPaths"
                :key="index"
                :d="p"
                fill="none"
                stroke="white"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
                class="crack-line"
            />
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({ isFa: Boolean })
const { t } = useI18n()

const experience = ref(0)
const projects = ref(0)
const pressure = ref(false)
const exploded = ref(false)
const particles = ref([])
const svgSize = ref(null)
const allPaths = ref([])
const aboutRef = ref(null)
const projectsNumber = ref(null)
const imageContainer = ref(null)
let animationTimer = null
let hasAnimatedBefore = false

const scaleStyle = computed(() => {
  if (!exploded.value) {
    if (projects.value < 10) return 'scale(1)'
    if (projects.value <= 30)
      return `scale(${1 + (projects.value - 10) * 0.015})`
    if (projects.value <= 70)
      return `scale(${1.3 + (projects.value - 30) * 0.004})`
    return 'scale(1.45)'
  }
  return 'scale(1)'
})

const projectToExp = [
  { p: 1, s: 1 },
  { p: 6, s: 2 },
  { p: 14, s: 3 },
  { p: 25, s: 4 },
  { p: 45, s: 5 },
  { p: 70, s: 6 },
]

const animateProjects = () => {
  let value = 0
  let delay = 200
  const target = 100

  const step = () => {
    value++
    projects.value = value

    const exp = projectToExp.reduce(
        (acc, item) => (value >= item.p ? item.s : acc),
        0
    )
    if (exp > experience.value) experience.value = exp

    if (value > 30 && value < target) {
      pressure.value = true
      const intensity = Math.min((value - 30) / 30, 1)
      projectsNumber.value?.style.setProperty(
          '--shake-intensity',
          intensity
      )
      delay = Math.max(30, 150 - (value - 30) * 2)
    }

    if (value >= target) {
      pressure.value = false
      exploded.value = true
      explode()

      if (imageContainer.value) {
        svgSize.value = { w: imageContainer.value.offsetWidth, h: imageContainer.value.offsetHeight }
        generateExtendedCracks()
      }
      return
    }

    animationTimer = setTimeout(step, delay)
  }

  step()
}

const explode = () => {
  const count = 120
  const list = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 60 + Math.random() * 120

    list.push({
      id: i + '-' + Date.now(),
      style: {
        '--x': `${Math.cos(angle) * distance}px`,
        '--y': `${Math.sin(angle) * distance}px`,
        width: `${4 + Math.random() * 6}px`,
        height: `${4 + Math.random() * 6}px`,
        background: `hsl(${Math.random() * 360},90%,60%)`,
        animationDuration: `${0.8 + Math.random()}s`,
      },
    })
  }

  particles.value = list
}

const generateExtendedCracks = () => {
  const w = svgSize.value.w
  const h = svgSize.value.h
  const paths = []

  const impactCount = 1
  const centerX = w / 2
  const centerY = h * 0.75

  for (let i = 0; i < impactCount; i++) {
    const startX = centerX + (Math.random() * w * 0.1 - w * 0.05)
    const startY = centerY + (Math.random() * h * 0.05)

    const rays = 6 + Math.floor(Math.random() * 4)

    for(let r=0; r<rays; r++){
      const angle = Math.random() * Math.PI * 2
      createThinBranch(startX, startY, angle, w * 0.30 + Math.random()*40, paths)
    }
  }

  allPaths.value = paths
}

const createThinBranch = (x, y, angle, length, pathList) => {
  if (length < 4) return

  let d = `M${x.toFixed(1)},${y.toFixed(1)}`
  let currentX = x
  let currentY = y
  let currentAngle = angle

  const segments = 3
  const segmentLength = length / segments

  for(let s=0; s<segments; s++){
    const wobble = (Math.random() - 0.5) * 1.5
    currentAngle += wobble

    currentX += Math.cos(currentAngle) * segmentLength
    currentY += Math.sin(currentAngle) * segmentLength
    d += ` L${currentX.toFixed(1)},${currentY.toFixed(1)}`
  }

  pathList.push(d)

  const forks = Math.random() > 0.8 ? 2 : 1

  for(let f=0; f<forks; f++){
    const nextAngle = angle + (Math.random() - 0.5) * 1.8
    createThinBranch(currentX, currentY, nextAngle, length * 0.5, pathList)
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
      entries => {
        const isIntersecting = entries[0].isIntersecting

        if (isIntersecting) {
          // تکرار انیمیشن
          if (!hasAnimatedBefore) {
            animateProjects()
            hasAnimatedBefore = true
          } else if (projects.value === 0) {
            animateProjects()
          }
        } else {
          // ریست کامل برای اجرای مجدد هنگام بازگشت
          if (animationTimer) {
            clearTimeout(animationTimer)
          }
          experience.value = 0
          projects.value = 0
          exploded.value = false
          pressure.value = false
          particles.value = []
          allPaths.value = []
          hasAnimatedBefore = false
        }
      },
      { threshold: 0.4 }
  )
  observer.observe(aboutRef.value)
})
</script>

<style scoped>
/* --- استایل‌ها --- */

.stat-number {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

@media (min-width: 768px) {
  .stat-number { font-size: 2.6rem; }
}

.infinity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
}

@media (min-width: 768px) {
  .infinity { font-size: 2.6rem; }
}

/* experience counter */
.counter-box {
  position: relative;
  width: 4rem;
  height: 2.8rem;
}

@media (min-width: 768px) {
  .counter-box { width: 4.5rem; height: 3.2rem; }
}

.counter-number {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.counter-value {
  position: absolute;
  inset: 0;
  display: inline-flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.1rem;
  white-space: nowrap;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .counter-value { font-size: 2.6rem; }
}

.counter-plus {
  font-size: 1.8rem;
  line-height: 1;
}

@media (min-width: 768px) {
  .counter-plus { font-size: 2rem; }
}

.counter-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.counter-enter-active {
  transition: 0.35s ease;
}
.counter-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.counter-leave-from {
  transform: translateY(0);
  opacity: 1;
}
.counter-leave-active {
  transition: 0.35s ease;
}
.counter-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* shake */
.shake {
  display: inline-block;
  animation: shake 0.15s infinite;
}

@keyframes shake {
  0% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  100% { transform: translateX(-2px); }
}

/* particles */
.particle {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: firework ease-out forwards;
}

@keyframes firework {
  to {
    opacity: 0;
    transform: translate(
        calc(-50% + var(--x)),
        calc(-50% + var(--y))
    );
  }
}

/* افکت فلش سفید */
.glass-flash {
  position: absolute;
  inset: 0;
  background: white;
  z-index: 40;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
@keyframes flash {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}

.exploded-style {
  animation: shakeGlass 0.6s ease-out forwards;
}

@keyframes shakeGlass {
  0% { transform: rotate(0deg); }
  20% { transform: rotate(2deg); }
  40% { transform: rotate(-2deg); }
  60% { transform: rotate(1deg); }
  80% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}

.crack-line {
  opacity: 0;
  animation: fadeInCrack 0.2s ease-out forwards;
}
@keyframes fadeInCrack {
  to { opacity: 1; }
}
</style>
