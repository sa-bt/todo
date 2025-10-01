// stores/theme.js
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

// تعریف تم‌های موجود (باید با کلاس‌های CSS شما مطابقت داشته باشد)
export const themes = {
    'minimal-sage': { name: 'Sage (پیش‌فرض)', class: 'theme-minimal-sage' },
    'minimal-sand': { name: 'Sand (شنی)', class: 'theme-minimal-sand' },
    'dark': { name: 'Dark (تیره)', class: 'theme-dark' }, // تم دارک اضافه شد!
    // اگر تم دیگری اضافه کردید، اینجا تعریف کنید
}

export const useThemeStore = defineStore('theme', () => {
    // 1. خواندن تم ذخیره شده یا استفاده از پیش‌فرض
    const savedTheme = localStorage.getItem('app-theme')
    const defaultThemeKey = themes[savedTheme] ? savedTheme : 'minimal-sage'
    const currentTheme = ref(defaultThemeKey)

    // متد برای تغییر تم
    function setTheme(themeKey) {
        if (themes[themeKey]) {
            currentTheme.value = themeKey
        } else {
            console.error(`Theme "${themeKey}" not found!`)
        }
    }

    // 2. تابع مرکزی برای اعمال کلاس و ذخیره
    function applyThemeClass(themeKey) {
        if (!themes[themeKey]) return // جلوگیری از خطای احتمالی

        const themeClass = themes[themeKey].class

        // **مهم:** اعمال کلاس به تگ <html>
        document.documentElement.className = themeClass

        // ذخیره برای بارهای بعدی
        localStorage.setItem('app-theme', themeKey)
        console.log(`Theme set to: ${themeKey} (${themeClass})`)
    }

    // 3. Watcher: اعمال تغییرات به محض تغییر State و در زمان راه‌اندازی اولیه
    watch(currentTheme, (newTheme) => {
        applyThemeClass(newTheme)
    }, { immediate: true }) // 'immediate: true' تضمین می‌کند که تم در اولین بارگذاری اعمال شود

    return {
        currentTheme,
        setTheme,
        // (اختیاری) اگر خواستید می‌توانید themes را هم برگردانید
        themes
    }
})
