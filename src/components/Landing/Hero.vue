<template>
  <section id="home" class="surface relative py-24">
    <div
        class="max-w-7xl mx-auto px-6 md:px-16 flex gap-14 transition-all duration-300"
        :class="isFa ? 'rtl' : 'ltr'"
    >

      <!-- متن -->
      <div
          class="flex-1 flex flex-col gap-4"
          :class="isFa ? 'text-right items-start rtl-space' : 'text-left items-start ltr-space'"
          :data-aos="isFa ? 'fade-left' : 'fade-right'"
          data-aos-duration="900"
      >
        <h1
            class="text-4xl md:text-5xl font-bold text-[var(--color-heading)]"
            data-aos="fade-up"
            data-aos-delay="100"
        >
          {{ t('hero.greeting') }}
        </h1>

        <h2
            class="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent gradient-text"
            :class="isFa
  ? 'bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-accent)]'
  : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]'"

            data-aos="zoom-in"
            data-aos-delay="200"
        >
          {{ t('hero.intro') }}
        </h2>

        <p
            class="text-lg text-text-secondary leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="300"
        >
          {{ t('hero.role') }}
        </p>

        <p
            class="text-lg text-text-secondary mb-6"
            data-aos="fade-up"
            data-aos-delay="400"
        >
          {{ t('hero.motto') }}
        </p>

        <!-- دکمه‌ها -->
        <div
            class="flex gap-4 w-full"
            :class="isFa ? 'flex-row-reverse justify-end' : 'flex-row justify-start'"
            data-aos="fade-up"
            data-aos-delay="500"
        >
          <a href="#projects" class="btn hero-btn-primary"> {{ t('hero.cta_projects') }} </a>
          <a href="#contact" class="btn hero-btn-ghost"> {{ t('hero.cta_contact') }} </a>
        </div>
      </div>

      <!-- تصویر -->
      <div
          class="flex-1 flex"
          :class="isFa ? 'justify-end' : 'justify-end'"
          data-aos="zoom-in-up"
          data-aos-duration="900"
          data-aos-delay="250"
      >
        <img
            src="@/assets/images/myself.png"
            alt="Profile"
            class="hero-image"
        />
      </div>

    </div>
  </section>
</template>


<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  isFa: {
    type: Boolean,
    required: true
  }
})
</script>


<style scoped>

/* --- RTL/LTR spacing fixes --- */
.rtl-space p {
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.ltr-space p {
  margin-right: 0 !important;
}

/* --- تصویر حرفه‌ای با Glow + Hover Tilt --- */
.hero-image {
  width: 14rem;
  height: 14rem;
  border-radius: 9999px;
  border: 3px solid var(--color-primary);
  object-fit: cover;
  box-shadow:
      0 10px 25px rgba(0, 0, 0, 0.18),
      0 0 25px rgba(var(--color-primary-rgb), 0.3);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
}

.hero-image:hover {
  transform: rotateX(6deg) rotateY(-6deg) scale(1.04);
  box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.25),
      0 0 45px rgba(var(--color-primary-rgb), 0.55);
}

/* --- گرادیانت متن با حرکت subtle --- */
.gradient-text {
  background-size: 200% auto;
  animation: gradientMove 4s linear infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* --- دکمه‌ها حرفه‌ای --- */
.hero-btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.7rem 1.6rem;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(var(--color-primary-rgb),0.3);
  transition: all .3s ease;
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb),0.4);
}

.hero-btn-ghost {
  border: 2px solid var(--color-primary);
  padding: 0.7rem 1.6rem;
  border-radius: 12px;
  transition: all .3s ease;
  color: var(--color-primary);
}

.hero-btn-ghost:hover {
  background: var(--color-primary);
  color: white !important;
  transform: translateY(-3px);
}
.hero-image {
  width: 18rem;      /* موبایل بزرگ */
  height: 18rem;
  border-radius: 9999px;
  border: 3px solid var(--color-primary);
  object-fit: cover;
  box-shadow:
      0 10px 25px rgba(0, 0, 0, 0.18),
      0 0 25px rgba(var(--color-primary-rgb), 0.3);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
}

@media (min-width: 768px) {
  .hero-image {
    width: 22rem;    /* دسکتاپ */
    height: 22rem;
  }
}

.hero-image:hover {
  transform: rotateX(6deg) rotateY(-6deg) scale(1.04);
  box-shadow:
      0 15px 40px rgba(0, 0, 0, 0.25),
      0 0 45px rgba(var(--color-primary-rgb), 0.55);
}

</style>
