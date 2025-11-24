<template>
  <section id="experience" class="py-28 relative">

    <h2
        class="text-4xl font-extrabold text-[var(--color-heading)] mb-20 text-center"
        data-aos="fade-up"
    >
      {{ t('experience.title') }}
    </h2>

    <div class="relative max-w-5xl mx-auto px-6">

      <!-- خط عمودی وسط -->
      <div
          class="absolute top-0 bottom-0 left-1/2 w-[3px] -translate-x-1/2
               bg-[var(--color-primary)] opacity-40 rounded-full"
      ></div>

      <!-- آیتم‌ها -->
      <div
          v-for="(item, i) in items"
          :key="i"
          class="relative w-full flex mb-20"
          :class="{
          // LTR
          'justify-start': !isFa && i % 2 === 0,
          'justify-end': !isFa && i % 2 === 1,

          // RTL
          'justify-end': isFa && i % 2 === 0,
          'justify-start': isFa && i % 2 === 1
        }"
      >

        <!-- دایره روی خط -->
        <div
            class="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full
                 bg-[var(--color-primary)]
                 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)]
                 z-20"
        ></div>

        <!-- کارت -->
        <div
            class="card-hover w-[42%] bg-white/10 backdrop-blur-xl border border-white/20
                 p-5 rounded-xl shadow-lg transition-all duration-500
                 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            :data-aos="computeAos(i)"
            data-aos-duration="800"
        >
          <h3 class="text-lg font-bold text-[var(--color-heading)] mb-1 text-center">
            {{ item.role }}
          </h3>

          <p class="text-primary font-medium mb-2 text-center">
            {{ item.company }}
          </p>

          <p class="text-sm text-text-secondary mb-3 text-center opacity-70">
            {{ item.period }}
          </p>

          <p class="text-text-secondary leading-relaxed text-justify text-[15px]">
            {{ item.desc }}
          </p>
        </div>

      </div>

    </div>
  </section>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t, tm } = useI18n()

const props = defineProps({
  isFa: Boolean
})

const items = computed(() => tm('experience.items'))

const computeAos = (i) => {
  if (props.isFa) {
    // RTL — معکوس
    return i % 2 === 0 ? 'fade-left' : 'fade-right'
  } else {
    // LTR
    return i % 2 === 0 ? 'fade-right' : 'fade-left'
  }
}
</script>
<style scoped>
/* فقط کمی smoothness */
.timeline-card {
  opacity: 0.9;
}
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
