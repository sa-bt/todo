import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/*
 * منطقه زمانی آزمون‌ها روی تهران بسته می‌شود، همان منطقه‌ای که سرور با آن کار
 * می‌کند. بدون این، آزمون تاریخ روی ماشینی با منطقه زمانی دیگر نتیجه متفاوت
 * می‌داد و آن اختلاف، خودش یکی از ریسک‌های ثبت‌شده تاریخ در این پروژه است.
 * این مقدار پیش از ساخته شدن فرایندهای آزمون تنظیم می‌شود، پس به آن‌ها می‌رسد.
 */
process.env.TZ = 'Asia/Tehran'

/*
 * تنظیم آزمون، جدا از تنظیم ساخت.
 *
 * تنظیم ساخت پلاگین‌های Vue، Tailwind و PWA را دارد و هیچ‌کدام برای آزمون منطق
 * خالص لازم نیستند. فایل جدا یعنی آزمون‌ها سریع بالا می‌آیند و هیچ پلاگینی در
 * نتیجه دخالت نمی‌کند.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
})
