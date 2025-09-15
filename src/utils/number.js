// تبدیل اعداد انگلیسی به فارسی
export function toPersianNumber(input) {
    const en = '0123456789';
    const fa = '۰۱۲۳۴۵۶۷۸۹';
    return String(input)
        .split('')
        .map(c => (en.includes(c) ? fa[en.indexOf(c)] : c))
        .join('');
}
