// jalali.js

// اصلاح: ایمپورت JalaaliDate برای استفاده از متدهای کلاسیک
import * as jalaali from 'jalaali-js';

// نام ماه‌های شمسی برای نمایش در UI
const SHAMSI_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
const DAY_NAMES = ['ش','ی','د','س','چ','پ','ج'];


export function getTodayShamsi(date = new Date()) {
    const { jy, jm, jd } = jalaali.toJalaali(date);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${jy}-${pad(jm)}-${pad(jd)}`;
}

// تابع toPersianNumber حذف شد

// تابع gregorianToJalali برای نمایش اعداد فارسی بود و حذف می‌شود
// اگر به تبدیل میلادی به شمسی نیاز دارید، از فرمت YYYY-MM-DD استفاده می‌کنیم:
export function gregorianToJalali(date) {
    const gDate = typeof date === "string" ? new Date(date) : date;
    const { jy, jm, jd } = jalaali.toJalaali(gDate);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${jy}-${pad(jm)}-${pad(jd)}`;
}

export function getShamsiWeekRange() {
    const today = new Date();
    // تبدیل تاریخ میلادی به شمسی
    const { jy, jm, jd } = jalaali.toJalaali(today);
    // 0: شنبه (بر اساس منطق شمسی)
    const dayOfWeekShamsi = (today.getDay() + 1) % 7;

    // برای استفاده از متدهای JalaaliDate باید آن را مستقیما از پکیج jalaali-js ایمپورت کرد
    // چون در اینجا فقط 'jalaali' ایمپورت شده، باید از شیوه متناوب استفاده کنیم.
    // (JalaaliDate در این پکیج به سادگی به عنوان jalaali.JalaaliDate در دسترس نیست.)

    // **اصلاح منطق: استفاده از توابع کتابخانه به جای کلاس JalaaliDate**

    // 1. محاسبه تاریخ میلادی شروع هفته (شنبه)
    // روزهای میلادی: 0=یکشنبه، 1=دوشنبه، ... 6=شنبه.
    // dayOfWeekShamsi: 0=شنبه، 6=جمعه.
    const todayGregorianDay = today.getDay(); // 0 (یکشنبه) تا 6 (شنبه)

    // تعداد روزهایی که باید به عقب برگردیم تا به شنبه (روز 6 میلادی) برسیم.
    // اگر امروز شنبه (6) باشد، 0 روز عقب. اگر یکشنبه (0) باشد، 6 روز عقب.
    const daysToSubtract = (todayGregorianDay === 6) ? 0 : todayGregorianDay + 1;

    // تاریخ میلادی شروع هفته (شنبه)
    const startOfWeekGregorian = new Date(today.getTime());
    startOfWeekGregorian.setDate(today.getDate() - daysToSubtract);

    // تاریخ میلادی پایان هفته (جمعه)
    const endOfWeekGregorian = new Date(startOfWeekGregorian.getTime());
    endOfWeekGregorian.setDate(startOfWeekGregorian.getDate() + 6);


    // تبدیل مجدد به شمسی برای فرمت دهی
    const startShamsi = jalaali.toJalaali(startOfWeekGregorian);
    const endShamsi = jalaali.toJalaali(endOfWeekGregorian);

    const pad = (n) => n.toString().padStart(2, '0');
    const format = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

    return {
        start: format(startShamsi.jy, startShamsi.jm, startShamsi.jd),
        end: format(endShamsi.jy, endShamsi.jm, endShamsi.jd)
    };
}

/**
 * ماه قبل را محاسبه می‌کند
 * @param {Date} date - تاریخ میلادی
 * @returns {Date} - تاریخ میلادی ماه قبل
 */
export function getPreviousMonth(date) {
    const { jy, jm } = jalaali.toJalaali(date);
    let newJm = jm - 1;
    let newJy = jy;

    if (newJm < 1) {
        newJm = 12;
        newJy -= 1;
    }
    const gDate = jalaali.toGregorian(newJy, newJm, 1);
    return new Date(gDate.gy, gDate.gm - 1, gDate.gd);
}

/**
 * ماه بعد را محاسبه می‌کند
 * @param {Date} date - تاریخ میلادی
 * @returns {Date} - تاریخ میلادی ماه بعد
 */
export function getNextMonth(date) {
    const { jy, jm } = jalaali.toJalaali(date);
    let newJm = jm + 1;
    let newJy = jy;

    if (newJm > 12) {
        newJm = 1;
        newJy += 1;
    }
    const gDate = jalaali.toGregorian(newJy, newJm, 1);
    return new Date(gDate.gy, gDate.gm - 1, gDate.gd);
}

/**
 * تولید اطلاعات تقویم ماه شمسی (برای Month.vue)
 * @param {Date} date - تاریخ میلادی فعلی که ماه را مشخص می‌کند
 */
export function getShamsiMonthInfo(date) {
    const todayShamsi = getTodayShamsi();
    const { jy, jm } = jalaali.toJalaali(date);

    const monthName = SHAMSI_MONTH_NAMES[jm - 1];
    const totalDaysInMonth = jalaali.jalaaliMonthLength(jy, jm);

    const firstDayObj = jalaali.toGregorian(jy, jm, 1);
    const firstDayOfMonth = new Date(firstDayObj.gy, firstDayObj.gm - 1, firstDayObj.gd);
    const lastDayObj = jalaali.toGregorian(jy, jm, totalDaysInMonth);
    const lastDayOfMonth = new Date(lastDayObj.gy, lastDayObj.gm - 1, lastDayObj.gd);

    let startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7;

    let grid = [];
    let week = Array(7).fill(null);
    let day = 1;

    for (let i = 0; i < startDayOfWeek; i++) {
        week[i] = null;
    }

    let currentDayOfWeek = startDayOfWeek;
    for (day = 1; day <= totalDaysInMonth; day++) {
        const currentShamsi = jalaali.toGregorian(jy, jm, day);
        const currentDate = new Date(currentShamsi.gy, currentShamsi.gm - 1, currentShamsi.gd);
        const isoDate = getTodayShamsi(currentDate);

        week[currentDayOfWeek] = {
            dayOfMonth: day,
            isoDate: isoDate,
            isCurrentMonth: true,
            isToday: isoDate === todayShamsi,
        };

        if (currentDayOfWeek === 6) {
            grid.push(week);
            week = Array(7).fill(null);
            currentDayOfWeek = 0;
        } else {
            currentDayOfWeek++;
        }
    }

    if (currentDayOfWeek !== 0) {
        grid.push(week);
    }

    return {
        monthName: monthName,
        year: jy,
        startDate: getTodayShamsi(firstDayOfMonth),
        endDate: getTodayShamsi(lastDayOfMonth),
        today: todayShamsi,
        grid: grid,
        dayNames: DAY_NAMES,
    };
}
