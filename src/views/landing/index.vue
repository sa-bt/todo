<template>
  <div
    :class="[
      'surface min-h-screen overflow-x-hidden scroll-smooth',
      // اضافه شدن کلاس اعداد بر اساس زبان
      isFa ? 'digits-fa' : 'digits-en'
    ]"
    style="scroll-padding-top: 100px;"
  >

    <!-- Navbar -->
    <nav
      ref="navRef"
      :class="[
        'fixed top-0 left-0 w-full z-50 border-b transition-all duration-500 ease-in-out',
        // حالت اسکرول شده: کوچک، پس‌زمینه جامد، سایه‌دار
        isScrolled
          ? 'surface-soft/95 backdrop-blur-md shadow-lg border-token py-2'
          // حالت اولیه: بزرگ، شفاف
          : 'border-transparent py-6'
      ]"
    >
      <div class="container mx-auto px-6 flex justify-between items-center">

        <!-- Logo -->
        <a
          href="#hero"
          @click.prevent="scrollToSection($event, 'hero')"
          :class="[
            'font-bold transition-all duration-500 text-[var(--color-text)] hover:opacity-80',
            isScrolled ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'
          ]"
        >
          <LogoAB class="h-10" />
        </a>

        <!-- Desktop Menu -->
        <ul class="hidden md:flex gap-8 items-center list-none">
          <li v-for="item in menuItems" :key="item.id">
            <a
              :href="item.link"
              @click.prevent="scrollToSection($event, item.id)"
              :class="[
                'relative py-2 text-sm md:text-base font-medium transition-colors duration-300 cursor-pointer',
                activeSection === item.id
                  ? 'text-primary'
                  : 'text-[var(--color-text)] opacity-70 hover:opacity-100'
              ]"
            >
              <span
                v-if="activeSection === item.id"
                class="absolute bottom-0 left-0 w-full h-[2px] bg-current animate-width-line"
              ></span>
              {{ $t(item.label) }}
            </a>
          </li>
        </ul>

        <!-- کنترل‌ها و دکمه موبایل -->
        <div class="flex gap-4 items-center">
          <div class="hidden md:flex gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          <!-- دکمه همبرگر -->
          <button
            @click="isMenuOpen = !isMenuOpen"
            class="md:hidden text-[var(--color-text)] focus-visible:ring-accent p-2 rounded-md hover:bg-[var(--color-background-mute)] transition-colors z-50 relative"
            aria-label="Toggle Menu"
          >
            <div class="w-6 h-0.5 bg-current mb-1.5 transition-all" :class="{'rotate-45 translate-y-2': isMenuOpen}"></div>
            <div class="w-6 h-0.5 bg-current mb-1.5 transition-all opacity-0" :class="{'opacity-100': !isMenuOpen}"></div>
            <div class="w-6 h-0.5 bg-current transition-all" :class="{'-rotate-45 -translate-y-2': isMenuOpen}"></div>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      <!-- تغییرات اعمال شده: bg-black/5 و backdrop-blur-2xl برای پس‌زمینه تیره‌تر و مات‌تر -->
      <div
        v-if="isMenuOpen"
        :style="{ top: navHeight + 'px' }"
        class="md:hidden fixed left-0 w-[calc(100%)] h-[calc(100vh-var(--nav-height))]
               surface bg-black/5 backdrop-blur-2xl border-t border-token
               flex flex-col items-center justify-center gap-8 animate-fade-in-up z-40"
      >
        <a
          v-for="item in menuItems"
          :key="item.id"
          @click.prevent="scrollToSection($event, item.id)"
          class="text-xl font-medium transition-all cursor-pointer"
          :class="activeSection === item.id ? 'text-primary scale-110' : 'text-[var(--color-text)]'"
        >
          {{ $t(item.label) }}
        </a>

        <!-- کنترل‌های موبایل داخل منو -->
        <div class="flex gap-6 mt-8 md:hidden">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

    </nav>

    <!-- Spacer: این div ارتفاع هدر را اشغال می‌کند تا محتوا زیر هدر نرود -->
    <div :style="{ height: navHeight + 'px' }" class="pointer-events-none transition-all duration-500"></div>

    <!-- Sections -->
    <main>
      <section id="hero"><Hero :isFa="isFa" /></section>
      <section id="about"><About :isFa="isFa" /></section>
      <section id="skills"><Skills :isFa="isFa" /></section>
      <section id="timeline"><Timeline :isFa="isFa"/></section>
      <section id="contact"><Contact :isFa="isFa"/></section>
    </main>

    <Footer :isFa="isFa"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from 'vue-i18n'

// Import Components
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import Hero from '@/components/Landing/Hero.vue'
import About from "../../components/Landing/About.vue";
import Skills from "../../components/Landing/Skills.vue";
import Timeline from "../../components/Landing/Timeline.vue";
import Contact from "../../components/Landing/Contact.vue";
import Footer from "../../components/Landing/Footer.vue";
import LogoAB from '../../components/LogoAB.vue'

// --- Setup I18n ---
const { locale } = useI18n()
const isFa = computed(() => locale.value.startsWith('fa'))

// --- Menu Data ---
const menuItems = [
  { id: 'hero', label: 'nav.home', link: '#hero' },
  { id: 'about', label: 'nav.about', link: '#about' },
  { id: 'skills', label: 'nav.skills', link: '#skills' },
  { id: 'timeline', label: 'nav.projects', link: '#timeline' },
  { id: 'contact', label: 'nav.contact', link: '#contact' },
]

// --- State Management ---
const isMenuOpen = ref(false)
const activeSection = ref('hero')
const isScrolled = ref(false)
const navRef = ref(null)
const navHeight = ref(80)

// --- تابع بروزرسانی ارتفاع هدر ---
const updateNavHeight = () => {
  if (navRef.value) {
    navHeight.value = navRef.value.offsetHeight;
    document.documentElement.style.setProperty('--nav-height', `${navRef.value}px`);
  }
}

// --- تابع اسکرول نرم ---
const scrollToSection = (e, id) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (!element) return;

  const headerOffset = navHeight.value + 20;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });

  isMenuOpen.value = false;
}

// --- Logic: ScrollSpy & Shrink ---
const updateScroll = () => {
  isScrolled.value = window.scrollY > 20;

  const scrollPosition = window.scrollY + (navHeight.value + 50);

  let current = 'hero';

  menuItems.forEach(item => {
    const section = document.getElementById(item.id);
    if (section) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = item.id;
      }
    }
  });

  activeSection.value = current;
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll);

  // استفاده از ResizeObserver برای رصد تغییر سایز هدر (کوچک و بزرگ شدن)
  const resizeObserver = new ResizeObserver(() => updateNavHeight());
  if (navRef.value) resizeObserver.observe(navRef.value);

  updateNavHeight();
  updateScroll();
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll);
})
</script>

<style scoped>
/* انیمیشن لاین زیر لینک فعال */
@keyframes widthLine {
  from { width: 0; left: 50%; }
  to { width: 100%; left: 0; }
}
/* --- تنظیمات اعداد دیجیتال --- */

/* حالت فارسی: فعال کردن ویژگی 1 (معمولاً برای اعداد فارسی در شبنام و وزیر) */
.digits-fa {
  font-family: 'Shabnam FD', sans-serif;
}

/* حالت انگلیسی: ریست کردن ویژگی‌ها به حالت عادی (عدم اعمال ویژگی) */
.digits-en {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.animate-width-line {
  animation: widthLine 0.3s ease-out forwards;
}

[dir="ltr"] .animate-width-line {
  animation-name: widthLineLTR;
}

@keyframes widthLineLTR {
  from { width: 0; left: 50%; }
  to { width: 100%; left: 0; }
}

/* انیمیشن منوی موبایل */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.rtl { direction: rtl; }
.ltr { direction: ltr; }
</style>