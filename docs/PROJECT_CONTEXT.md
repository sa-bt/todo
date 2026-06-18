# زمینه کسب‌وکاری پروژه

> Last reviewed: 2026-06-15  
> Source of truth: Current repository source code  
> Scope: فقط قواعد و Workflowهایی که از رفتار فعلی frontend قابل‌اتکا هستند

## هدف کسب‌وکاری

برنامه به کاربر کمک می‌کند goals را تعریف کند، برای آن‌ها task بسازد، انجام taskها را در نماهای روزانه، هفتگی و ماهانه پیگیری کند و گزارش عملکرد سالانه ببیند. reminder، اعلان درون‌برنامه‌ای و Web Push برای پیگیری فعالیت‌ها در نظر گرفته شده‌اند.

بخش Landing یک فرم contact دارد. یک بخش admin نیز برای reportها و نمایش courseهای آموزشی وجود دارد، اما میزان نهایی‌بودن این بخش از Repository قابل اثبات نیست.

## کاربران و نقش‌های اصلی

- Guest: مشاهده Landing، ارسال contact، ثبت‌نام و ورود
- Authenticated user: مدیریت goals/tasks، گزارش‌ها، settings و notifications
- Admin: دسترسی client-side به `/admin` و course/report viewها

تنها role صریح در کد `admin` است. نام و Permission roleهای دیگر مشخص نیست.

## Domainهای اصلی

- Authentication و account activation با CAPTCHA/OTP
- Goal management
- Task planning و completion tracking
- Jalali calendar و activity reporting
- User notification settings
- In-app notifications و Web Push
- Admin course content
- Contact form

## اصطلاحات Domain

- Goal: هدفی با title، description، priority، status و parent اختیاری
- Child goal: هدفی با `parent_id`
- Task: فعالیت روزانه مرتبط با `goal_id` و `day`
- Goal task: درخواست ساخت یک یا چند task برای goal با recurrence pattern
- Reminder: تنظیم زمان‌بندی اعلان برای goal یا تنظیمات عمومی کاربر
- Activity: آمار تجمیعی taskها برای یک روز در گزارش سالانه
- Persisted notification: اعلانی که در لیست server-backed notificationها نیز وجود دارد.
- Course: محتوای آموزشی admin با chapter و content block یا visual step

## Workflowهای اصلی

### ثبت‌نام

1. دریافت CAPTCHA
2. ارسال name، email، password، confirmation، honeypot و CAPTCHA
3. دریافت `user_id` و email برای OTP
4. تأیید OTP شش‌رقمی
5. دریافت user/token و ورود به بخش goals
6. امکان resend پس از timer صدوبیست‌ثانیه‌ای UI

### ورود

1. دریافت CAPTCHA
2. ارسال credential، honeypot و CAPTCHA
3. ذخیره user/token
4. هدایت admin به admin و کاربر عادی به نمای روزانه

### مدیریت goal

1. ایجاد یا ویرایش title، description، priority، status، parent و reminder
2. جلوگیری UI از self-parent
3. غیرفعال‌شدن انتخاب parent برای goal دارای task یا child
4. امکان ساخت taskهای recurring برای goal

### مدیریت task

1. انتخاب goal و تاریخ
2. ساخت task
3. toggle وضعیت انجام‌شده
4. تغییر روز در UIهای مربوط
5. حذف با confirmation در Flowهای اصلی
6. نمایش progress بر اساس نسبت taskهای انجام‌شده

### Notification

1. ذخیره تنظیمات report/reminder/progress
2. اخذ browser permission
3. ساخت PushSubscription و ارسال آن به API
4. دریافت Push در Service Worker
5. نمایش system notification و ارسال payload به tabهای باز
6. به‌روزرسانی list/unread count در Pinia

## Business Ruleهای قطعی در Frontend

- `title` برای goal الزامی است.
- reminder time در UI باید شکل `HH:mm` داشته باشد.
- goal نمی‌تواند خودش parent خودش باشد.
- UI برای goal دارای task یا child تغییر parent را غیرفعال می‌کند.
- task API dateها به `YYYY-MM-DD` normalize می‌شوند.
- `is_done` به boolean normalize می‌شود.
- الگوی هفتگی حداقل یک روز هفته می‌خواهد.
- CAPTCHA answer اعداد فارسی و عربی را normalize می‌کند.
- Admin detection در frontend بر اساس `user.role === 'admin'` است.
- notification خارجی در tab جدید با `noopener,noreferrer` باز می‌شود.

این قواعد فقط رفتار frontend را ثابت می‌کنند؛ enforce شدن آن‌ها در Backend باید جداگانه بررسی شود.

## تصمیم‌های معماری قابل مشاهده

- SPA مبتنی بر Vue Router
- Pinia به‌عنوان state و API orchestration
- API خارجی با Bearer token
- localStorage برای session، language و theme
- Jalali برای UI و Gregorian برای API
- PWA با custom Service Worker و Vite `injectManifest`
- Web Push bridge بین Service Worker و Pinia Store

## محدودیت‌های کسب‌وکاری شناخته‌شده

- Backend و Database در این Repository نیستند.
- Offline behavior فقط cache-first برای asset/requestهای غیر API دارد؛ offline mutation queue وجود ندارد.
- Authorization frontend جایگزین authorization server نیست.
- Admin report فعلی placeholder و دارای اعداد hard-coded است.
- نام canonical محصول در فایل‌ها یکسان نیست.

## موارد نیازمند تأیید مالک پروژه

- نام رسمی محصول و مخاطب اصلی
- سیاست hierarchy goals و حداکثر عمق
- uniqueness task برای goal/day
- semantics و timezone recurrence/reminder
- وضعیت‌ها و transitionهای مجاز goal
- نقش‌ها و Permissionهای واقعی
- lifecycle token و account
- سیاست حذف و retention داده
- شرایط دقیق notificationهای persisted/non-persisted
- جایگاه نهایی course/admin report در محصول
- Acceptance Criteria برای گزارش‌های روزانه، هفتگی، ماهانه و سالانه
