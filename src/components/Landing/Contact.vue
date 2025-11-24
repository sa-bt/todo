<template>
  <section id="contact" class="py-32">

    <!-- عنوان -->
    <h2
        class="text-4xl font-extrabold text-[var(--color-heading)] text-center mb-10"
        data-aos="fade-up"
    >
      {{ t('contact.title') }}
    </h2>

    <!-- متن توضیحی -->
    <p
        class="max-w-2xl mx-auto text-center text-text-secondary leading-relaxed mb-14"
        data-aos="fade-up"
        data-aos-delay="100"
    >
      {{ t('contact.text') }}
    </p>

    <!-- فرم -->
    <form
        @submit.prevent="submitForm"
        class="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-8 rounded-2xl
             border border-white/20 shadow-lg
             transition-all duration-500"
        data-aos="fade-up"
        data-aos-delay="200"
    >

      <!-- نام -->
      <div class="mb-6">
        <label class="block mb-2 text-sm font-medium">{{ t('contact.name') }}</label>
        <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20
                 text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]
                 transition-all"
        />
      </div>

      <!-- ایمیل -->
      <div class="mb-6">
        <label class="block mb-2 text-sm font-medium">{{ t('contact.email') }}</label>
        <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20
                 text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]
                 transition-all"
        />
      </div>

      <!-- پیام -->
      <div class="mb-6">
        <label class="block mb-2 text-sm font-medium">{{ t('contact.message') }}</label>
        <textarea
            v-model="message"
            required
            rows="5"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20
                 text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]
                 transition-all resize-none"
        ></textarea>
      </div>

      <!-- دکمه -->
      <button
          type="submit"
          class="btn btn-primary px-8 py-3 text-lg shadow-md hover:shadow-lg transition-all"
      >
        {{ t('contact.send') }}
      </button>

      <!-- پیام وضعیت -->
      <p v-if="success" class="text-green-500 mt-4 text-center">{{ t('contact.success') }}</p>
      <p v-if="error" class="text-red-500 mt-4 text-center">{{ t('contact.error') }}</p>

    </form>

  </section>
</template>
<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const name = ref("")
const email = ref("")
const message = ref("")
const success = ref(false)
const error = ref(false)

const submitForm = () => {
  // فرنتم، پیام رو نمایش میدیم
  success.value = true
  error.value = false

  setTimeout(() => {
    success.value = false
  }, 3000)
}
</script>
<style scoped>
form {
  transition: transform .4s ease, box-shadow .4s ease;
}
form:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}
</style>
