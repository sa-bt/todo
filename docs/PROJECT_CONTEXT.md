# زمینه کسب‌وکاری پروژه

> Last reviewed: 2026-07-30  
> Source of truth: Current repository source code  
> Scope: قواعد و Workflowهای قابل‌اتکا از کد هر دو مخزن

## دو مخزن پروژه

این سند تا ۲۵ خرداد ۱۴۰۵ فقط سمت کاربر را می‌شناخت و می‌گفت Backend در دسترس نیست. آن جمله دیگر درست نیست. سمت سرور کنار همین مخزن قرار دارد:

```text
/home/develop/Projects/toDo/front
/home/develop/Projects/toDo/backend
```

هر دو مخزن گیت مستقل‌اند و پوشه بالای آن‌ها مخزن نیست.

پس قاعده‌ها دو دسته شده‌اند: آن‌هایی که فقط رفتار سمت کاربر را ثابت می‌کنند، و آن‌هایی که در سرور هم enforce شده‌اند. جای هرکدام در همین سند مشخص شده است.

## هدف کسب‌وکاری

برنامه به کاربر کمک می‌کند goals را تعریف کند، برای آن‌ها task بسازد، انجام taskها را در نماهای روزانه، هفتگی و ماهانه پیگیری کند و گزارش عملکرد سالانه ببیند. reminder، اعلان درون‌برنامه‌ای و Web Push برای پیگیری فعالیت‌ها در نظر گرفته شده‌اند.

بخش Landing یک فرم contact دارد. یک بخش admin نیز برای reportها و نمایش courseهای آموزشی وجود دارد. مالک محصول در ۸ مرداد ۱۴۰۵ تصمیم گرفت فعلاً روی گزارش admin کار نشود؛ اعدادش ساختگی است و مسیر `/api/admin/stats` که این صفحه صدا می‌زند در سمت سرور وجود ندارد.

بخش گزارش‌ها از تیر ۱۴۰۵ تا امروز به‌طور جدی گسترش یافته: گزارش بازه‌ای، کار عقب‌افتاده، رتبه‌بندی اهداف، الگوی روزهای هفته، زنجیره، بینش خودکار، کارت سالانه و رنگ‌بندی قابل تغییر توسط کاربر. تاریخچه تصمیم‌ها و موارد باز آن جدا نگهداری می‌شود:

```text
front/docs/REPORTS_ROADMAP.md
```

## کاربران و نقش‌های اصلی

- Guest: مشاهده Landing، ارسال contact، ثبت‌نام و ورود
- Authenticated user: مدیریت goals/tasks، گزارش‌ها، settings و notifications
- Admin: دسترسی client-side به `/admin` و course/report viewها

تنها role صریح در کد `admin` است. سمت سرور هم فقط همین یک Gate تعریف شده، پس فهرست نقش‌ها امروز دو حالت دارد: کاربر عادی و admin.

## Domainهای اصلی

- Authentication و account activation با CAPTCHA/OTP
- Goal management
- Task planning و completion tracking
- Jalali calendar و activity reporting
- Scheduled report notifications: روزانه، هفتگی و هشدار افت
- Task و goal reminders
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

این قواعد فقط رفتار frontend را ثابت می‌کنند. قاعده‌هایی که در سرور هم enforce شده‌اند در بخش بعدی آمده‌اند.

## Business Ruleهای enforce شده در سرور

این‌ها از کد مخزن سمت سرور خوانده شده‌اند و آزمون دارند:

- هر هدف در هر روز حداکثر یک task دارد. این قاعده در سطح Database است:

```text
unique(goal_id, day)
```

- جدول task ستون کاربر ندارد؛ مالکیت فقط از راه goal تعیین می‌شود.
- همه مسیرهای گزارش به اهداف کاربر واردشده محدود هستند.
- درخواست گزارش با `goal_id` متعلق به کاربر دیگر پاسخ `403` می‌گیرد.
- سال بیرون از بازه ۱۳۰۰ تا ۱۵۰۰ پاسخ `422` می‌گیرد.
- سقف بازه گزارش یازده‌صد روز است؛ بیشتر از آن پاسخ `422` می‌گیرد.
- روزهای آینده در خلاصه و رتبه‌بندی نمی‌آیند.
- مسیرهای admin پشت `auth:sanctum` و Gate با نام `admin` هستند، پس guard سمت کاربر تنها لایه نیست.
- ورود و ثبت‌نام، CAPTCHA و فرم contact محدودساز نرخ دارند و فرم contact honeypot هم دارد.
- حذف goal، taskهایش را آبشاری حذف می‌کند. یعنی اعداد تاریخی گزارش با حذف یک goal عوض می‌شوند.
- منطقه زمانی برنامه روی `Asia/Tehran` ثابت است. زمان‌بندی اعلان‌ها به همین منطقه است، نه منطقه زمانی کاربر.

## اعلان‌های زمان‌بندی‌شده

پنج فرمان روی زمان‌بند سرور کار می‌کنند:

- گزارش روزانه، در ساعت انتخاب کاربر
- گزارش هفتگی، در روز و ساعت انتخاب کاربر و پیش‌فرض جمعه ساعت بیست
- هشدار افت، شنبه ساعت ده صبح برای همه، حداکثر یک بار در دو هفته
- یادآوری task
- یادآوری goal

گزارش هفتگی و هشدار افت پیش‌فرض خاموش‌اند. متن هر سه گزارش از یک سرویس مشترک می‌آید، پس اعداد اعلان و صفحه گزارش نمی‌توانند با هم اختلاف داشته باشند.

## تصمیم‌های معماری قابل مشاهده

- SPA مبتنی بر Vue Router
- Pinia به‌عنوان state و API orchestration
- API خارجی با Bearer token
- localStorage برای session، language و theme
- Jalali برای UI و Gregorian برای API
- PWA با custom Service Worker و Vite `injectManifest`
- Web Push bridge بین Service Worker و Pinia Store

## محدودیت‌های کسب‌وکاری شناخته‌شده

- Backend و Database در این Repository نیستند، ولی در مخزن همسایه در دسترس‌اند.
- Offline behavior فقط cache-first برای asset/requestهای غیر API دارد؛ offline mutation queue وجود ندارد. یعنی تیک زدن یک task بدون اینترنت از دست می‌رود.
- Authorization frontend جایگزین authorization server نیست، ولی مسیرهای admin در سرور هم Gate دارند.
- Admin report فعلی placeholder و دارای اعداد hard-coded است و مسیر آماری‌اش در سرور ساخته نشده.
- نام canonical محصول در فایل‌ها یکسان نیست.
- بازنشانی گذرواژه وجود ندارد. کاربری که گذرواژه‌اش را فراموش کند راهی برای بازگشت ندارد.
- حذف حساب و برون‌بری داده کاربر وجود ندارد.
- زمان‌بندی همه اعلان‌ها به منطقه زمانی تهران است، پس کاربر بیرون از ایران اعلان را در ساعت اشتباه می‌گیرد.
- ترجمه انگلیسی فقط برای Landing کامل است؛ کل بخش برنامه تک‌زبانه است.

## موارد نیازمند تأیید مالک پروژه

پرسش‌هایی که از خرداد ۱۴۰۵ پاسخ گرفته‌اند از این فهرست بیرون رفتند و در دو بخش قبلی ثبت شدند: uniqueness task برای goal/day، نقش‌های واقعی، و timezone گزارش‌ها به‌عنوان وضعیت فعلی نه تصمیم نهایی.

- نام رسمی محصول و مخاطب اصلی
- سیاست hierarchy goals و حداکثر عمق
- semantics دقیق recurrence
- منطقه زمانی رسمی: تهران برای همه بماند یا به منطقه زمانی کاربر برود؟
- وضعیت‌ها و transitionهای مجاز goal
- lifecycle token و account، شامل خروج از همه دستگاه‌ها
- سیاست حذف و retention داده: حذف آبشاری goal بماند یا بایگانی جایش را بگیرد؟
- شرایط دقیق notificationهای persisted/non-persisted
- جایگاه نهایی course/admin report در محصول
- Acceptance Criteria برای گزارش‌های روزانه، هفتگی، ماهانه و سالانه
