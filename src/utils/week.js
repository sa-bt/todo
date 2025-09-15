/**
 * پیدا کردن شنبه و جمعه هفته جاری
 * خروجی: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
 */
export function getWeekRange() {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - ((day + 1) % 7)); // برگرد به شنبه
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);
    return {
        start: saturday.toISOString().split("T")[0],
        end: friday.toISOString().split("T")[0]
    };
}
