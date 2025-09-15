import jalaali from 'jalaali-js';
export function getTodayShamsi() {
    const today = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(today);
    // دو رقمی کردن ماه و روز
    const pad = (n) => n.toString().padStart(2, "0");
    return `${jy}-${pad(jm)}-${pad(jd)}`;
}
export function toPersianNumber(num) {
    const map = {
        '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    };
    return num.toString().replace(/\d/g, (d) => map[d]);
}
export function gregorianToJalali(date) {
    const gDate = typeof date === "string" ? new Date(date) : date;
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth() + 1;
    const gd = gDate.getDate();
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    let gd2 = gd - 1;
    let days = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd2 + g_d_m[gm2];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return `${toPersianNumber(jy)}/${toPersianNumber(jm.toString().padStart(2, '0'))}/${toPersianNumber(jd.toString().padStart(2, '0'))}`;
}
export function getShamsiWeekRange() {
    const today = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(today);
    // روز هفته شمسی: شنبه=0، جمعه=6
    const dayOfWeekShamsi = (today.getDay() + 1) % 7;
    // شروع هفته (شنبه)
    let startJd = jd - dayOfWeekShamsi;
    let startJm = jm;
    let startJy = jy;
    while (startJd <= 0) {
        startJm -= 1;
        if (startJm <= 0) {
            startJy -= 1;
            startJm = 12;
        }
        startJd += jalaali.jalaaliMonthLength(startJy, startJm);
    }
    // پایان هفته (جمعه)
    let endJd = jd + (6 - dayOfWeekShamsi);
    let endJm = jm;
    let endJy = jy;
    const monthDays = jalaali.jalaaliMonthLength(endJy, endJm);
    while (endJd > monthDays) {
        endJd -= monthDays;
        endJm += 1;
        if (endJm > 12) {
            endJy += 1;
            endJm = 1;
        }
    }
    const pad = (n) => n.toString().padStart(2, '0');
    const format = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
    return { start: format(startJy, startJm, startJd), end: format(endJy, endJm, endJd) };
}
export function getShamsiMonthRange() {
    const today = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(today);
    // روز هفته شمسی: شنبه=0، جمعه=6
    const dayOfWeekShamsi = (today.getDay() + 1) % 7;
    // شروع هفته (شنبه)
    let startJd = jd - dayOfWeekShamsi;
    let startJm = jm;
    let startJy = jy;
    while (startJd <= 0) {
        startJm -= 1;
        if (startJm <= 0) {
            startJy -= 1;
            startJm = 12;
        }
        startJd += jalaali.jalaaliMonthLength(startJy, startJm);
    }
    // پایان هفته (جمعه)
    let endJd = jd + (6 - dayOfWeekShamsi);
    let endJm = jm;
    let endJy = jy;
    const monthDays = jalaali.jalaaliMonthLength(endJy, endJm);
    while (endJd > monthDays) {
        endJd -= monthDays;
        endJm += 1;
        if (endJm > 12) {
            endJy += 1;
            endJm = 1;
        }
    }
    const pad = (n) => n.toString().padStart(2, '0');
    const format = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
    return { start: format(startJy, startJm, startJd), end: format(endJy, endJm, endJd) };
}
