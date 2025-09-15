// src/utils/date.ts
import dayjs from "dayjs";
import jalaliday from "jalaliday";
dayjs.extend(jalaliday);
export function toPersianDate(date) {
    return toPersianNumber(dayjs(date).calendar("jalali").locale("fa").format("YYYY/MM/DD"));
}
// تبدیل عدد به فارسی
export function toPersianNumber(num) {
    return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}
// فرمت تاریخ به فارسی (YYYY/MM/DD)
export function formatPersianDate(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
    }).format(d);
}
