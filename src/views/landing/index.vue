<template>
  <div
      class="surface min-h-screen text-[var(--color-text)] transition-colors duration-500"
  >
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 backdrop-blur-md surface-soft/80 border-b border-token px-6 py-4 flex justify-between items-center">
      <h1 class="font-bold text-lg md:text-xl text-[var(--color-heading)]">
        Ahmad Bakhshian
      </h1>

      <div class="flex gap-3 items-center">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </nav>

    <!-- Hero Section -->
    <Hero :isFa="isFa" />
    <About :isFa="isFa" />
    <Skills :isFa="isFa" />
    <Timeline :isFa="isFa"/>
    <Contact :isFa="isFa"/>
    <Footer :isFa="isFa"/>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import Hero from '@/components/Landing/Hero.vue'
import  {computed , watch}  from "vue";
import About from "../../components/Landing/About.vue";
import Skills from "../../components/Landing/Skills.vue";
import Timeline from "../../components/Landing/Timeline.vue";
import Contact from "../../components/Landing/Contact.vue";
import Footer from "../../components/Landing/Footer.vue";

const { locale } = useI18n()
const isFa = computed(() => locale.value.startsWith('fa'))
watch(() => locale.value, () => {
  setTimeout(() => {
    AOS.refreshHard()
  }, 50)
})

</script>

<style>
/* کنترل جهت فقط از این دو کلاس */
.rtl {
  direction: rtl ;
}
.ltr {
  direction: ltr ;
}
</style>
