<template>
  <section id="about" class="surface relative py-32">
    <div
        class="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-[1fr_1fr] gap-20 items-start transition-all duration-300"
        :class="isFa ? 'rtl' : 'ltr'"
    >

      <!-- ستون متن + خط عمودی -->
      <div class="relative">

        <!-- خط عمودی مینیمال -->
        <div
            class="absolute top-0 bottom-0 w-[2px] rounded-full bg-[var(--color-primary)] opacity-70"
            :class="isFa ? 'right-0' : 'left-0'"
            data-aos="fade-down"
            data-aos-delay="100"
            data-aos-duration="900"
        ></div>

        <!-- متن -->
        <div
            class="about-wrapper flex flex-col gap-8 px-6 text-justify leading-relaxed"
            :class="isFa ? 'text-right items-end pr-10' : 'text-left items-start pl-10'"
            :data-aos="isFa ? 'fade-left' : 'fade-right'"
            data-aos-duration="900"
        >

          <!-- عنوان -->
          <h2
              class="text-4xl font-extrabold text-[var(--color-heading)] tracking-tight"
              data-aos="fade-up"
              data-aos-delay="150"
          >
            {{ t('about.title') }}
          </h2>

          <!-- متن اصلی -->
          <p
              class="text-lg text-text-secondary text-justify leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="230"
          >
            {{ t('about.text') }}
          </p>

          <!-- Highlight Box -->
          <div
              class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6"
              data-aos="fade-up"
              data-aos-delay="300"
          >

            <div
                class="w-full py-4 px-6 rounded-2xl border border-white/20
           backdrop-blur-xl bg-white/10 shadow-lg
           text-center text-[var(--color-heading)]
           text-sm font-semibold
           whitespace-nowrap
           transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {{ t('about.skill_backend') }}
            </div>

            <div
                class="w-full py-4 px-6 rounded-2xl border border-white/20
           backdrop-blur-xl bg-white/10 shadow-lg
           text-center text-[var(--color-heading)]
           text-sm font-semibold
           whitespace-nowrap
           transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {{ t('about.skill_frontend') }}
            </div>

            <div
                class="w-full py-4 px-6 rounded-2xl border border-white/20
           backdrop-blur-xl bg-white/10 shadow-lg
           text-center text-[var(--color-heading)]
           text-sm font-semibold
           whitespace-nowrap
           transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {{ t('about.skill_design') }}
            </div>

          </div>

          <!-- stats -->
          <div
              class="flex gap-10 mt-4"
              :class="isFa ? 'flex-row-reverse' : 'flex-row'"
              data-aos="fade-up"
              data-aos-delay="380"
          >
            <div class="stat-block flex flex-col items-center">
              <span class="stat-number text-[2.4rem] font-extrabold text-[var(--color-primary)]">6+</span>
              <span class="stat-label text-sm text-text-secondary mt-1">{{ t('about.years') }}</span>
            </div>

            <div class="stat-block flex flex-col items-center">
              <span class="stat-number text-[2.4rem] font-extrabold text-[var(--color-primary)]">25+</span>
              <span class="stat-label text-sm text-text-secondary mt-1">{{ t('about.projects') }}</span>
            </div>
          </div>

          <!-- goal -->
          <p
              class="text-xl font-medium mt-2 text-[var(--color-heading)] opacity-95"
              data-aos="fade-up"
              data-aos-delay="460"
          >
            {{ t('about.goal') }}
          </p>

        </div>
      </div>

      <!-- تصویر -->
      <div
          class="flex justify-center md:justify-end"
          data-aos="zoom-in"
          data-aos-duration="900"
          data-aos-delay="200"
      >
        <div class="image-wrapper">
          <img
              src="@/assets/images/myself.png"
              class="about-image"
              alt="About"
          />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  isFa: Boolean
})
</script>

<style scoped>
/* تصویر پریمیوم مینیمال */
.image-wrapper {
  padding: 1rem;
  border-radius: 1.5rem;
  background: var(--color-background-soft);
  box-shadow:
      0 8px 20px rgba(0,0,0,0.06),
      0 0 25px rgba(var(--color-primary-rgb),0.1),
      inset 0 0 25px rgba(var(--color-primary-rgb),0.08);
  transition: transform .4s ease, box-shadow .4s ease;
}

.image-wrapper:hover {
  transform: translateY(-6px);
  box-shadow:
      0 12px 35px rgba(0,0,0,0.12),
      0 0 45px rgba(var(--color-primary-rgb),0.18),
      inset 0 0 20px rgba(var(--color-primary-rgb),0.12);
}

.about-image {
  width: 100%;
  max-width: 24rem;
  border-radius: 1.3rem;
  object-fit: cover;
}
</style>
