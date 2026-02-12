<template>
  <div
      :class="[
      'surface min-h-screen overflow-x-hidden scroll-smooth transition-colors duration-300',
      isFa ? 'digits-fa' : 'digits-en'
    ]"
      style="scroll-padding-top: 80px;"
  >
  <!-- Navbar -->
  <nav
      ref="navRef"
      :class="[
        'fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ease-in-out',
        isScrolled
          ? 'surface-soft/90 backdrop-blur-md shadow-sm border-token py-2'
          : 'border-transparent py-4 bg-transparent'
      ]"
  >
    <div class="container mx-auto px-4 md:px-6 flex justify-between items-center h-full">

      <!-- Logo -->
      <a
          href="#hero"
          @click.prevent="scrollToSection($event, 'hero')"
          class="flex items-center font-bold transition-all duration-300 text-[var(--color-text)] hover:opacity-80 focus:outline-none focus-visible:ring-2 ring-primary rounded"
          :class="isScrolled ? 'scale-90' : 'scale-100'"
      >
        <LogoAB class="h-10 w-auto" />
      </a>

      <!-- Desktop Menu (Hidden on Mobile/Tablet, Visible on Large Screens) -->
      <!-- تغییر: از md:flex به lg:flex تغییر دادیم تا در تبلت هم گرید بندی به هم نریزه -->
      <ul class="hidden lg:flex gap-6 xl:gap-8 items-center list-none">
        <li v-for="item in menuItems" :key="item.id" class="relative group">
          <a
              :href="item.link"
              @click.prevent="scrollToSection($event, item.id)"
              class="relative py-2 text-sm xl:text-base font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1"
              :class="activeSection === item.id ? 'text-primary' : 'text-[var(--color-text)] opacity-80 group-hover:opacity-100'"
          >
            <span class="relative z-10">{{ $t(item.label) }}</span>
            <!-- Animated Underline (CSS Transition based) -->
            <span
                class="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 ease-out"
                :class="activeSection === item.id ? 'w-full' : 'w-0 group-hover:w-full'"
            ></span>
          </a>
        </li>
      </ul>

      <!-- Controls & Hamburger -->
      <div class="flex gap-2 lg:gap-2 items-center">
        <!-- دکمه‌های سوییچ در دسکتاپ -->
        <div class="hidden lg:flex gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>

        <!-- دکمه همبرگر (Visible on Mobile/Tablet) -->
        <button
            @click="toggleMenu"
            class="lg:hidden text-[var(--color-text)] p-2 rounded-md hover:bg-[var(--color-background-mute)] transition-colors z-50 relative focus:outline-none focus-visible:ring-2 ring-primary"
            aria-label="Toggle Menu"
        >
          <div class="w-6 h-0.5 bg-current mb-1.5 transition-all duration-300" :class="{'rotate-45 translate-y-2': isMenuOpen}"></div>
          <div class="w-6 h-0.5 bg-current mb-1.5 transition-all duration-300 opacity-100" :class="{'opacity-0 translate-x-2': isMenuOpen}"></div>
          <div class="w-6 h-0.5 bg-current transition-all duration-300" :class="{'-rotate-45 -translate-y-2': isMenuOpen}"></div>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <!-- تغییر: اضافه کردن translate-y برای انیمیشن اسلایدی -->
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
    >
      <!-- در بخش Mobile Menu Overlay -->
      <div
          v-if="isMenuOpen"
          class="lg:hidden fixed left-0 w-full
         /* تغییر کلیدی: -top-1 و border-t-0 برای چسبیدن دقیق به منو */
         -top-[1px]
         surface shadow-2xl border-t border-token backdrop-blur-xl
         flex flex-col items-center justify-start gap-6 py-8 z-40 min-h-[50vh]"
      >
        <a
            v-for="(item, index) in menuItems"
            :key="item.id"
            @click.prevent="scrollToSection($event, item.id)"
            class="text-lg md:text-xl font-medium transition-all cursor-pointer px-4 py-1 rounded-lg hover:bg-[var(--color-background-mute)]"
            :class="[
              activeSection === item.id ? 'text-primary bg-[var(--color-primary-light)]/10' : 'text-[var(--color-text)]',
              // Staggered Animation: تاخیر در نمایش آیتم‌ها
              `animate-fade-in-item`
            ]"
            :style="{ animationDelay: `${index * 50}ms` }"
        >
          {{ $t(item.label) }}
        </a>

        <!-- کنترل‌های موبایل داخل منو -->
        <div class="flex gap-6 mt-4 pt-6 border-t border-token animate-fade-in-item" style="animation-delay: 300ms;">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </Transition>
  </nav>

  <!-- Spacer -->
  <div :style="{ height: navHeight + 'px' }" class="pointer-events-none"></div>

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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
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

// --- قفل کردن اسکرول بادی هنگام باز بودن منو ---
watch(isMenuOpen, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// --- تابع باز/بسته کردن منو ---
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// --- تابع اسکرول نرم ---
const scrollToSection = (e, id) => {
  e.preventDefault();
  isMenuOpen.value = false; // بستن منو

  // تاخیر کوچک برای اینکه ترنزیشن منو تمام بشه و بعد اسکرول کنه
  setTimeout(() => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = navHeight.value + 20;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }, 300);
}

// --- Logic: ScrollSpy & Shrink ---
let ticking = false;
const updateScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      isScrolled.value = window.scrollY > 20;

      const scrollPosition = window.scrollY + (navHeight.value + 100);

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
      ticking = false;
    });
    ticking = true;
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll);

  const resizeObserver = new ResizeObserver(() => {
    updateNavHeight();
    // اگر منو باز باشه و سایز تغییر کنه، هدر رو آپدیت کن
    if(isMenuOpen.value) updateNavHeight();
  });

  if (navRef.value) resizeObserver.observe(navRef.value);

  updateNavHeight();
  updateScroll();
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll);
  document.body.style.overflow = '' // ریست کردن استایل اسکرول
})
</script>

<style scoped>
/* --- تنظیمات اعداد دیجیتال --- */
.digits-fa {
  font-family: 'Shabnam FD', sans-serif;
}

.digits-en {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- انیمیشن آیتم‌های منوی موبایل --- */
@keyframes fadeInItem {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-item {
  animation: fadeInItem 0.4s ease-out forwards;
  opacity: 0; /* شروع با شفافیت صفر تا انیمیشن اجرا بشه */
}

[dir="rtl"] {
  direction: rtl;
}
[dir="ltr"] {
  direction: ltr;
}
</style>
