// stores/toastSound.js
import { defineStore } from 'pinia'

/*
|--------------------------------------------------------------------------
| صدای اعلان‌های داخل برنامه (Toast)
|--------------------------------------------------------------------------
| فهرست صداها ثابت است و کاربر فقط یکی از آن‌ها را انتخاب می‌کند؛
| امکان آپلود صدای دلخواه وجود ندارد.
| انتخاب کاربر روی همین دستگاه در localStorage نگه داشته می‌شود،
| چون پخش صدا یک ترجیح مربوط به دستگاه است نه حساب کاربری.
*/

const STORAGE_KEY = 'toast-sound'

export const SILENT_SOUND = 'silent'
// صدای پیش‌فرض همان صدایی است که پیش از افزودن این تنظیم پخش می‌شد.
export const DEFAULT_SOUND = 'classic'

export const toastSounds = [
    { value: 'classic', label: 'کلاسیک (پیش‌فرض)', file: '/sounds/toast.wav' },
    { value: 'chime', label: 'زنگ نرم', file: '/sounds/chime.wav' },
    { value: 'ding', label: 'دینگ روشن', file: '/sounds/ding.wav' },
    { value: 'marimba', label: 'ماریمبا', file: '/sounds/marimba.wav' },
    { value: 'arpeggio', label: 'آرپژ شاد', file: '/sounds/arpeggio.wav' },
    { value: 'bubble', label: 'حباب کوتاه', file: '/sounds/bubble.wav' },
    { value: 'soft-tap', label: 'تقّه‌ی آرام', file: '/sounds/soft-tap.wav' },
    { value: 'button', label: 'کلیک ملایم', file: '/sounds/mixkit-light-button-2580.wav' },
    { value: SILENT_SOUND, label: 'بی‌صدا', file: null },
]

function isKnownSound(key) {
    return toastSounds.some((sound) => sound.value === key)
}

function readStoredSound() {
    if (typeof localStorage === 'undefined') return DEFAULT_SOUND

    const stored = localStorage.getItem(STORAGE_KEY)

    return isKnownSound(stored) ? stored : DEFAULT_SOUND
}

// همیشه فقط یک صدا در حال پخش باشد تا پیش‌نمایش‌های پشت‌سرهم روی هم نیفتند.
let activeAudio = null

export const useToastSoundStore = defineStore('toastSound', {
    state: () => ({
        current: readStoredSound(),
        volume: 0.6,
    }),

    getters: {
        options: () => toastSounds,

        currentSound: (state) =>
            toastSounds.find((sound) => sound.value === state.current) || null,

        isMuted: (state) => state.current === SILENT_SOUND,
    },

    actions: {
        /**
         * انتخاب صدا و ذخیره آن روی همین دستگاه
         * @param {string} key - کلید یکی از صداهای فهرست
         */
        setSound(key) {
            if (!isKnownSound(key)) return

            this.current = key

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, key)
            }
        },

        /**
         * پخش صدای انتخاب‌شده‌ی کاربر
         */
        play() {
            this.playSound(this.current)
        },

        /**
         * پخش یک صدای مشخص، برای پیش‌نمایش در تنظیمات
         * @param {string} key - کلید صدا
         */
        playSound(key) {
            const sound = toastSounds.find((item) => item.value === key)

            if (!sound?.file) return

            if (activeAudio) {
                activeAudio.pause()
                activeAudio.currentTime = 0
            }

            const audio = new Audio(sound.file)
            audio.volume = this.volume
            activeAudio = audio

            // مرورگر تا اولین تعامل کاربر اجازه پخش نمی‌دهد؛ خطایش نادیده گرفته می‌شود.
            audio.play().catch(() => {})
        },
    },
})
