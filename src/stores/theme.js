// src/stores/theme.js
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const themes = {
    'minimal-sage': { name: 'Sage (پیش‌فرض)', class: null },
    'minimal-sand': { name: 'Sand (شنی)', class: 'theme-minimal-sand' },
    'dark': { name: 'Dark (تیره)', class: 'theme-dark' }
}

const STORAGE_KEY = 'landing-theme'

export const useThemeStore = defineStore('theme', () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    const defaultThemeKey = themes[savedTheme] ? savedTheme : 'minimal-sage'
    const currentTheme = ref(defaultThemeKey)

    function setTheme(themeKey) {
        if (themes[themeKey]) currentTheme.value = themeKey
        else console.error(`Theme "${themeKey}" not found!`)
    }

    function applyThemeClass(themeKey) {
        if (!themes[themeKey]) return
        const html = document.documentElement

        // حذف کلاس‌های تم قدیمی
        Object.values(themes)
            .map(t => t.class)
            .filter(Boolean)
            .forEach(c => html.classList.remove(c))

        // Sage بدون کلاس است
        const themeClass = themes[themeKey].class
        if (themeClass) html.classList.add(themeClass)

        // ذخیره و لاگ
        localStorage.setItem(STORAGE_KEY, themeKey)
        if (import.meta.env.DEV) console.log(`Theme applied: ${themeKey}`)
    }

    // Watcher
    watch(currentTheme, (newTheme) => applyThemeClass(newTheme), { immediate: true })

    return { currentTheme, setTheme, themes }
})
