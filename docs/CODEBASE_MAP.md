# نقشه فنی Repository

> Last reviewed: 2026-06-15  
> Repository root: `/home/develop/Projects/npmTodo`  
> Application root: `/home/develop/Projects/npmTodo`  
> Purpose: Repository architecture and navigation reference  
> Source of truth: Current repository source code

> این سند وضعیت Repository را در تاریخ آخرین بررسی توصیف می‌کند.  
> پیش از تغییر هر قابلیت، فایل‌های واقعی همان قابلیت باید دوباره بررسی شوند.  
> اگر این سند با Source Code فعلی تعارض داشت، Source Code منبع نهایی حقیقت است.

## 1. معرفی فنی Repository

این Repository یک frontend SPA برای مدیریت goals و tasks است. قابلیت‌های قابل مشاهده شامل ثبت‌نام و ورود، نمایش روزانه/هفتگی/ماهانه tasks، گزارش سالانه، مدیریت goals، تنظیم reminderها، اعلان‌های درون‌برنامه‌ای، Web Push، PWA و یک بخش محدود admin برای courseها و reportها است.

نام package برابر `npmtodo` است. برچسب‌های محصول در فایل‌های مختلف `Do It`، `Todo` و `TodoGoals` هستند؛ یک نام محصول canonical از Repository قابل اثبات نیست.

Backend، Database، Migration، Queue worker و منطق server-side در این Repository وجود ندارند. همه endpointها قراردادهای مصرف‌شده توسط frontend هستند، نه اثبات implementation سمت سرور.

## 2. Repository Root

- Root واقعی Git: `/home/develop/Projects/npmTodo`
- Branch هنگام بررسی: `master`
- وضعیت اولیه Worktree: clean
- ساختار: یک Application root؛ Monorepo یا Workspace چندپروژه‌ای نیست.
- `vendor/` وجود ندارد و Stack این Repository PHP/Laravel نیست.
- `node_modules/` و `dist/` روی Disk وجود دارند اما tracked نیستند و Crawl کامل نشده‌اند.

## 3. Application Rootها

| مسیر | نقش |
|---|---|
| `/home/develop/Projects/npmTodo` | Root برنامه، npm package و Vite project |
| `src/` | Source اصلی Vue |
| `public/` | Static assets، manifest و source Service Worker |

Backend یا Application root دیگری داخل Repository شناسایی نشد.

## 4. Stack و Versionهای واقعی

Versionهای resolved از `package-lock.json` استخراج شده‌اند. Rangeهای Manifest در صورت تفاوت کنار آن‌ها آمده‌اند.

| Technology | Manifest | Lock resolved |
|---|---:|---:|
| Node.js | `^20.19.0 || >=22.12.0` | Version runtime ثبت نشده |
| Vue | `^3.5.18` | `3.5.22` |
| Vite | `^7.0.6` | `7.1.7` |
| Pinia | `^3.0.3` | `3.0.3` |
| Vue Router | `^4.5.1` | `4.5.1` |
| Vue I18n | `^9.14.5` | `9.14.5` |
| Axios | `^1.11.0` | `1.12.2` |
| Tailwind CSS | `^4.1.12` | `4.1.13` |
| `@tailwindcss/vite` | `^4.1.12` | `4.1.13` |
| Vite PWA | `^1.0.3` | `1.0.3` |
| Prettier | `3.6.2` | `3.6.2` |
| Day.js | `^1.11.15` | `1.11.18` |
| Jalaliday | `^3.1.0` | `3.1.1` |
| `vue3-persian-datetime-picker` | `^1.2.2` | `1.2.2` |
| `vue3-toastify` | `^0.2.8` | `0.2.8` |
| `lucide-vue-next` | `^0.542.0` | `0.542.0` |
| AOS | `^2.3.4` | `2.3.4` |

زبان‌های اصلی JavaScript، Vue SFC، CSS و JSON هستند. `env.d.ts` فقط declaration مربوط به Vite است و Application عملاً TypeScript نیست.

## 5. Manifestها و Lock Fileهای مرجع

- `package.json`: نام package، Node engine، scripts و dependency rangeها
- `package-lock.json`: lockfile version `3` و Versionهای resolved
- `vite.config.js`: Vue، Tailwind، Vue DevTools و PWA build integration
- `.prettierrc.json`: `semi: false`، `singleQuote: true` و `printWidth: 100`
- `.env.example`: contract عمومی Environment
- `public/manifest.webmanifest`: manifest استاتیک PWA

در Versionهای dependency اختلاف طبیعی بین rangeهای `package.json` و Versionهای resolved در lockfile وجود دارد؛ برای بازتولید نصب، lockfile مرجع دقیق‌تر است.

## 6. ساختار سطح بالای Repository

```text
npmTodo/
├── AGENTS.md
├── docs/
│   ├── CODEBASE_MAP.md
│   └── PROJECT_CONTEXT.md
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   ├── sw.js
│   ├── manifest.webmanifest
│   ├── icons and favicons
│   └── sounds/
└── src/
    ├── main.js
    ├── App.vue
    ├── router/
    ├── plugins/
    ├── stores/
    ├── utils/
    ├── views/
    ├── components/
    ├── locales/
    └── assets/
```

## 7. مسئولیت پوشه‌ها

| مسیر | مسئولیت |
|---|---|
| `src/views/` | Route-level viewها و layoutهای اصلی |
| `src/components/` | Feature componentها و shared UI |
| `src/components/UI/` | Input، Select، Checkbox، Tooltip، Toast و update UI مشترک |
| `src/stores/` | Pinia state، API orchestration و client-side normalization |
| `src/plugins/` | Axios instanceها و helperهای admin API |
| `src/router/` | Route table و navigation guards |
| `src/utils/` | Jalali/Gregorian date، number، week و Web Push helpers |
| `src/locales/` | پیام‌های `fa` و `en` برای Vue I18n |
| `src/assets/` | CSS، font و imageهای importشده |
| `public/` | فایل‌هایی که با path ثابت سرو می‌شوند؛ `sw.js` source ویژه PWA است |

## 8. مسئولیت Featureها و Shared بخش‌ها

- Authentication: `src/views/Login.vue`، `src/views/Register.vue`، `src/stores/auth.js`
- Goals: `src/components/GoalsTab.vue`، `src/components/Goals/*`، `src/stores/goals.js`
- Tasks: `src/components/DayTab.vue`، `WeekTab.vue`، `MonthTab.vue`، `Days/*`، `Month/*`، `src/stores/tasks.js`
- Reports: `src/components/YearTab.vue`
- User settings: `src/components/SettingTab.vue` و `src/stores/userSetting.js`
- Notifications: `src/views/Notifications.vue`، `src/components/Layout/Header.vue`، `src/stores/systemNotifications.js`
- Toast: `src/stores/notification.js` و `src/components/UI/ToastNotification.vue`
- Admin course UI: `src/views/admin/*` و `src/plugins/api.js`
- Landing/contact: `src/views/landing/index.vue` و `src/components/Landing/*`

## 9. Entry Pointها

1. `index.html` عنصر `#app` را فراهم می‌کند.
2. `src/main.js` CSS، Vue، Pinia، I18n، Router و `App.vue` را bootstrap می‌کند.
3. `src/App.vue`، `RouterView` و global Toast را render می‌کند و AOS/User Settings را initialize می‌کند.
4. `src/router/index.js` Routeها و guardها را تعریف می‌کند.
5. `public/sw.js` entry مستقل Service Worker است و توسط browser register می‌شود.

## 10. Request Lifecycle

### درخواست‌های authenticated عمومی

```text
Route View/Component
→ Pinia Store action
→ src/plugins/axios.js
→ Authorization: Bearer <token>
→ external API at VITE_API_URL
→ response.data / response.data.data
→ store normalization/mutation
→ reactive Vue UI
→ Toast on selected success/error paths
```

در `401`، interceptor توکن و user را پاک می‌کند و فقط اگر Route جاری `requiresAuth` داشته باشد به `/vorod` می‌رود.

### درخواست‌های auth/contact

`Login.vue`، `Register.vue` و `Contact.vue` از native `fetch` و Environment key متفاوت `VITE_API_BASE` استفاده می‌کنند. CAPTCHA با `POST` گرفته می‌شود و login/register از `credentials: 'include'` استفاده می‌کنند.

### درخواست‌های admin course

`CourseList.vue` و `Course.vue` از helperهای `src/plugins/api.js` استفاده می‌کنند. این فایل Axios instance موازی با interceptor متفاوت دارد.

## 11. Controller یا Handler Contracts

Controller محلی وجود ندارد. معادل client-side handlerها:

- Route handlerها در `src/router/index.js`
- Form handlerها مانند `onSubmit`، `save`، `handleTaskSubmit`
- Store actionها به‌عنوان orchestration boundary
- Service Worker event handlerهای `install`، `activate`، `fetch`، `push`، `notificationclick` و `message`

Signature این handlerها و component eventها contract داخلی هستند و باید قبل از تغییر مصرف‌کننده‌هایشان بررسی شوند.

## 12. Service Contracts

Service class مستقل وجود ندارد. Pinia storeها نقش service/state boundary را ترکیب کرده‌اند:

- `useAuthStore`: browser persistence و computed authorization
- `useGoalsStore`: CRUD goals و ساخت recurring goal tasks
- `useTasksStore`: CRUD tasks، normalization تاریخ/boolean و progress toast
- `useUserSettingStore`: load/save notification settings
- `useSystemNotificationsStore`: pagination، unread count، Web Push bridge و polling
- `useNotificationStore`: Toast state و API error mapping

Store actionهایی که error را swallow می‌کنند با actionهایی که error را دوباره throw می‌کنند رفتار یکسانی ندارند؛ caller باید implementation واقعی action را بررسی کند.

## 13. Repository و Persistence Contracts

Repository pattern محلی وجود ندارد. Persistence دو بخش دارد:

- Remote persistence از طریق external API
- Browser persistence از طریق `localStorage`

کلیدهای `localStorage` قطعی:

- `user`
- `token`
- `lang`
- `landing-theme`

تغییر شکل `user` یا نام این کلیدها می‌تواند session، role detection، locale و theme کاربران موجود را بشکند.

## 14. Model و Entity Conventions

Model/Entity رسمی یا Type definition وجود ندارد. Shapeها از مصرف frontend قابل استنباط‌اند، اما schema نهایی نیستند:

- User: حداقل `name` و `role`; role قطعی بررسی‌شده `admin`
- Goal: `id`, `title`, `description`, `priority`, `status`, `parent_id`, `children_count`, `tasks_count`, reminder fields و `stats`
- Task: `id`, `goal_id`, `day`, `is_done`
- Notification: `id`, `title`, `body`, `url`, `icon`, `tag`, `type`, `meta`, `time`/`created_at`, `read_at`
- Course: `slug`, `title`, `description`, `visual`, `colors`, `chapters`; chapterها `content` یا `steps` دارند.

این shapeها frontend contracts هستند؛ nullability، database type و relationهای backend نیازمند backend source یا API schema است.

## 15. Database و Migration Conventions

هیچ Database schema، Migration، Seeder یا ORM Model در Repository نیست. هیچ نام table، column type، index، foreign key، cascade behavior یا transaction boundary نباید از frontend اختراع شود.

## 16. Validation Conventions

- Login/Register/Contact validation در View انجام می‌شود و server errorهای `errors`/`message` normalize می‌شوند.
- CAPTCHA answer اعداد فارسی و عربی را به انگلیسی تبدیل می‌کند.
- Login payload: `email`, `password`, `website`, `captcha_id`, `captcha_answer`
- Register payload: `name`, `email`, `password`, `password_confirmation`, `website`, `captcha_id`, `captcha_answer`
- OTP verification: `user_id`, `otp`
- Goal form: title الزامی؛ reminder time با pattern `HH:mm`؛ self-parent ممنوع
- Goal task: start date، duration و pattern validation در Modal
- Task store تاریخ را به `YYYY-MM-DD` و `is_done` را به boolean normalize می‌کند.

Server-side validation منبع نهایی است و در این Repository قابل مشاهده نیست.

## 17. Route و API Conventions

### Routeهای اصلی

| Path | Name | Meta |
|---|---|---|
| `/` | `landing` | `guest` |
| `/vorod` | `login` | `guest` |
| `/sabtenam` | `register` | `guest` |
| `/app/day` | `day` | inherited `requiresAuth` |
| `/app/week` | `week` | inherited `requiresAuth` |
| `/app/month` | `month` | inherited `requiresAuth` |
| `/app/goals` | `goals` | inherited `requiresAuth` |
| `/app/year` | `year` | inherited `requiresAuth` |
| `/app/settings` | `settings` | inherited `requiresAuth` |
| `/app/notifications` | `notifications` | inherited `requiresAuth` |
| `/admin` | `admin` | `requiresAuth`, `requiresAdmin` |
| `/admin/reports` | `adminReports` | admin |
| `/admin/courses` | `adminCoursesList` | admin |
| `/admin/course/:slug` | `adminCourseDetail` | parent admin match |

Route nameها در Header، notification navigation و redirectها public internal contract هستند.

### Endpointهای مصرف‌شده

- Auth/contact: `/api/captcha/new`, `/api/login`, `/api/register`, `/api/verify-otp`, `/api/resend-otp`, `/api/contact`
- Goals: `/goals`, `/goals/:id`, `/goals/parentable`, `/goal-tasks`
- Tasks: `/tasks`, `/tasks/:id`
- Settings: `/user-setting`
- Reports: `/activities/:year`
- Notifications: `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`
- Push: `/save-subscription`
- Admin: `/api/admin/stats`, `/admin/courses/list`, `/admin/course/:slug`

اغلب Axios responseها `data.data` را انتظار دارند. Notifications pagination انتظار nested shape با list و `meta.next_page_url` دارد.

## 18. Authentication و Authorization

- Token و user در `localStorage` ذخیره می‌شوند.
- Axios token را با header `Authorization: Bearer <token>` ارسال می‌کند.
- `isAuthenticated` وجود هم‌زمان token و user را بررسی می‌کند.
- `isAdmin` فقط `user.role === 'admin'` را بررسی می‌کند.
- Router guard برای `requiresAuth` و `requiresAdmin` client-side است.
- Authorization واقعی باید در API enforce شود؛ frontend guard امنیت server-side ایجاد نمی‌کند.
- Login و Register CAPTCHA/OTP workflow دارند، ولی server behavior فقط از responseهای مورد انتظار frontend شناخته می‌شود.

## 19. Frontend Architecture

- Vue Composition API در بیشتر componentها؛ Pinia هم setup-store و هم options-store دارد.
- Route-level lazy loading فقط برای `NotFound.vue` استفاده شده؛ بقیه viewها eager import هستند.
- Styling با Tailwind utilityها، CSS variableهای theme و فایل‌های `base.css`/`main.css`.
- RTL و زبان فارسی غالب است؛ Landing از Vue I18n برای `fa` و `en` استفاده می‌کند.
- Shared controls از `v-model` contract یعنی `modelValue` و `update:modelValue` استفاده می‌کنند.
- Modalها غالباً با `Teleport to="body"` render می‌شوند.
- Date UI شمسی است و API dateها عموماً Gregorian `YYYY-MM-DD` هستند.

## 20. Build Process

Scripts:

```text
npm run dev      → vite
npm run build    → vite build
npm run preview  → vite preview
npm run format   → prettier --write src/
```

Vite pluginها:

- Vue
- Vue DevTools
- Tailwind CSS
- Vite PWA با `injectManifest`

`public/sw.js` در build به `dist/sw.js` تبدیل می‌شود و `self.__WB_MANIFEST` در injection point جای‌گذاری می‌شود. `self.BUILD_HASH` با `Date.now()` در هر config evaluation تولید می‌شود.

Build در این مرحله اجرا نشد؛ Node executable در محیط در دسترس نبود و درخواست نیز اجرای Build را منع کرده بود.

## 21. Test Process

هیچ test file، test directory، test dependency یا test script شناسایی نشد. بنابراین:

- Unit test process وجود ندارد.
- Component test process وجود ندارد.
- E2E test process وجود ندارد.
- Coverage configuration وجود ندارد.

Verification فعلی باید با static inspection و در تغییرات آینده با build/browser/API environment انجام شود.

## 22. Lint و Format Process

- Prettier configuration وجود دارد.
- `npm run format` write-mode و گسترده است؛ verification command محسوب نمی‌شود.
- ESLint، Stylelint یا lint script وجود ندارد.
- Type-check script وجود ندارد.
- README به TypeScript/type-check template اشاره می‌کند، اما package scripts و dependencyهای فعلی `vue-tsc` ندارند.

## 23. Event، Queue و Job Flow

Queue یا Job server-side در Repository نیست.

Browser eventها و message contractهای مهم:

- `swUpdateAvailable`: از `src/main.js` روی `window` dispatch می‌شود؛ detail شامل `newWorker`
- Service Worker message `{ action: 'skipWaiting' }` یا `{ type: 'SKIP_WAITING' }`
- Web Push bridge payload با `__kind: 'webpush'`
- Push notification payload شامل `notification_id`, `persisted`, `title`, `body`, `url`, `icon`, `tag`, `type`, `meta`

Header هنگام mount، bridge را attach و unread count را refresh می‌کند. Notification Store امکان polling دارد، اما invocation فعال `startUnreadPolling` در source یافت نشد.

## 24. Shared Coreها

- `src/plugins/axios.js`: HTTP/auth shared core اصلی
- `src/stores/auth.js`: session/role shared core
- `src/stores/tasks.js` و `goals.js`: domain state مشترک چند View
- `src/stores/notification.js`: global toast contract
- `src/components/UI/`: shared component props/emits
- `src/utils/jalali.js`: contract تاریخ بین UI و API
- PWA/Web Push files: cross-cutting و پرریسک
- CSS variables و classهای theme در assets: visual contract مشترک

## 25. Public Contracts

### Contract قطعی

- Route path/name/metaهای جدول بالا
- `localStorage` keyها
- Axios base key: `VITE_API_URL`
- Fetch base key مصرف‌شده: `VITE_API_BASE`
- Environment key Web Push: `VITE_PUSH_PUBLIC_KEY`
- `Authorization: Bearer` header
- Store idها: `auth`, `goals`, `tasks`, `notification`, `systemNotifications`, `userSetting`, `theme`
- Props/emits componentها، به‌خصوص shared UI و feature Modalها
- `swUpdateAvailable`, `__kind: 'webpush'`, `self.__WB_MANIFEST`, `self.BUILD_HASH`
- `#app` mount id و `notifications-menu` aria/DOM id

### Convention غالب

- API success payload در `response.data.data`
- Error payload در `errors` و/یا `message`
- Gregorian `YYYY-MM-DD` برای API؛ Jalali برای display
- Store action برای mutation remote و local state
- Toast برای feedback

### Legacy pattern

- Commentهای فارسی و علامت‌دار فراوان داخل source
- `src/stores/counter.js` شبیه template residue و بدون مصرف شناسایی‌شده
- README عمدتاً متن template Vue/Vite است.

### Parallel pattern

- `src/plugins/api.js` در کنار `src/plugins/axios.js`
- Native `fetch` برای auth/contact در کنار Axios برای featureهای authenticated
- `src/components/SettingTab.vue` در کنار `src/views/settings/NotificationSettings.vue`
- چند utility تاریخ: `date.js`, `jalali.js`, `week.js`
- دو manifest: `vite.config.js` manifest و `public/manifest.webmanifest`

## 26. Generated Code Boundaries

- `node_modules/`: dependency install output؛ edit ممنوع
- `dist/`: build output؛ edit مستقیم ممنوع
- `public/sw.js`: generated نیست؛ source Service Worker است.
- `package-lock.json`: generated lockfile است ولی contract dependency محسوب می‌شود؛ فقط در dependency task تغییر کند.
- Assetهای binary و fontها نباید برای analysis معمول Crawl شوند.

## 27. سه نمونه واقعی توسعه

### نمونه 1: Login با CAPTCHA

- Feature name: ورود کاربر
- Complexity: Simple
- Files: `src/router/index.js`, `src/views/Login.vue`, `src/stores/auth.js`
- Flow:

```text
/vorod route
→ Login.vue onMounted
→ POST {VITE_API_BASE}/api/captcha/new
→ client validation and CAPTCHA normalization
→ POST {VITE_API_BASE}/api/login
→ expect data.data.user and data.data.token
→ auth.setAuth()
→ localStorage user/token
→ route by user.role to admin or day
```

- Strengths: error normalization، field feedback، CAPTCHA refresh، honeypot، role-based redirect
- Limitations: base Environment contract با `.env.example` ناسازگار است؛ native fetch interceptor مشترک ندارد؛ backend validation/permission قابل مشاهده نیست.
- الگو برای: formهای guest با CAPTCHA و response errorهای مشابه
- Copy نشود: endpointها، payload fieldها یا role redirect بدون بررسی API واقعی

### نمونه 2: Task روزانه

- Feature name: مدیریت taskهای امروز
- Complexity: Medium
- Files: `src/components/DayTab.vue`, `src/components/Days/AddTaskModal.vue`, `src/components/Days/TaskItem.vue`, `src/stores/tasks.js`, `src/stores/goals.js`, `src/plugins/axios.js`, `src/utils/jalali.js`
- Flow:

```text
/app/day
→ parallel fetch goals and tasks for today
→ GET /goals?without_children=1
→ GET /tasks?start_date=...&end_date=...
→ normalize day and is_done
→ render stats/list
→ POST /tasks or PUT /tasks/:id or DELETE /tasks/:id
→ mutate Pinia task state
→ optional progress Toast from API message
```

- Strengths: focused store boundary، partial update payload، normalization، pending toggle guard، shared delete modal
- Limitations: `fetchGoals` cache query-aware نیست؛ no automated test؛ exact backend uniqueness rule برای goal/day مشخص نیست.
- الگو برای: authenticated CRUD با Pinia و Axios
- Copy نشود: `res.data.data.task` update shape یا task uniqueness بدون API confirmation

### نمونه 3: Recurring goal task و Web Push side effects

- Feature name: ساخت taskهای goal با recurrence و notification integration
- Complexity: Complex
- Files: `src/components/GoalsTab.vue`, `src/components/Goals/GoalModal.vue`, `src/components/Goals/AddTaskModal.vue`, `src/stores/goals.js`, `src/components/SettingTab.vue`, `src/stores/userSetting.js`, `src/utils/webpush.js`, `src/main.js`, `public/sw.js`, `src/stores/systemNotifications.js`, `src/components/Layout/Header.vue`
- Flow:

```text
/app/goals
→ fetch goals
→ open recurring task modal
→ validate date/duration/pattern
→ payload {goal_id,start_date,duration,pattern,step,offset,days_of_week}
→ POST /goal-tasks
→ merge returned goal state
→ Toast

settings/save or app startup
→ browser notification permission
→ Service Worker registration
→ PushSubscription
→ POST /save-subscription
→ push event in public/sw.js
→ show system notification + postMessage to clients
→ systemNotifications store updates list/unread count
```

- Strengths: explicit recurrence payload، Service Worker/client bridge، persisted/non-persisted push distinction
- Limitations: recurrence semantics و scheduling server-side نامشخص؛ permission در startup درخواست می‌شود؛ subscription data در console log می‌شود؛ PWA runtime verification ضروری است.
- الگو برای: Flow چندفایلی با browser API و server side effect
- Copy نشود: recurrence values، Push payload shape، cache strategy یا permission timing بدون owner/backend confirmation

## 28. نقاط حساس و Regression Riskها

- Route name/pathها و guest/admin guardها
- Environment key و base URL composition
- Auth token/user persistence و `401` behavior
- `response.data.data` shapeها
- Goal cache و query variantهای `without_children`
- Date conversion، timezone و comparison رشته‌ای `YYYY-MM-DD`
- Shared task state بین Day/Week/Month
- Notification pagination URL؛ ممکن است absolute یا relative باشد.
- PWA cache، Service Worker lifecycle و update event
- Push payload و unread counter consistency
- Shared UI props/emits و Teleport/focus behavior
- API-provided notification URL navigation
- Admin course content renderer که block typeهای مشخص را انتظار دارد.

## 29. Legacy Patterns

- Source commentها و loggingهای debug-like زیاد و ناهمگون‌اند.
- `counter.js` ظاهراً template residue است و import آن یافت نشد.
- README با پروژه فعلی همگام نیست.
- Admin reports دارای اعداد hard-coded و placeholder است.
- Admin summary inline template placeholder است.
- `UpdateUiVersion.vue` وجود دارد، ولی import/render آن در source یافت نشد.

این موارد در setup task اصلاح نشده‌اند.

## 30. Parallel Patterns

1. دو Axios client با interceptor متفاوت
2. Axios و native Fetch با base keyهای متفاوت
3. دو notification settings UI
4. چند date utility با behavior متفاوت (`toISOString` در `week.js` در برابر local date در `jalali.js`)
5. دو PWA manifest source
6. Goal taskهای recurring (`/goal-tasks`) در برابر task CRUD معمول (`/tasks`)

قبل از consolidate کردن هر مورد، consumerها و backend contract باید بررسی شوند.

## 31. Confirmed Technical Inconsistencies

1. `Login.vue` به `/register` link می‌دهد، ولی Route ثبت‌نام `/sabtenam` است.
2. `Register.vue` به `/login` link می‌دهد، ولی Route ورود `/vorod` است.
3. `.env.example` فقط `VITE_API_URL` را تعریف می‌کند، اما `Login.vue`، `Register.vue` و `Contact.vue` از `VITE_API_BASE` استفاده می‌کنند.
4. با مقدار نمونه `VITE_API_URL=http://localhost:8085/api`، helper `getAdminStats()` path `/api/admin/stats` را به شکل دارای `/api/api/` compose می‌کند؛ صحت Environment واقعی بدون خواندن `.env` بررسی نشده، اما قرارداد example و path فعلی ناسازگارند.
5. `fetchGoals` هر داده موجود را بدون توجه به query قبلی cache می‌کند؛ فراخوانی `without_children` و فراخوانی full list می‌توانند یکدیگر را اشتباه skip کنند.
6. `SettingTab.vue`، `setNotification` را در دو محل با آرگومان‌های positional فراخوانی می‌کند، در حالی که action یک object destructuring می‌خواهد؛ در این فراخوانی `message` مقدار مورد انتظار را نمی‌گیرد و Toast صحیح ساخته نمی‌شود.
7. `WeekTab.vue` در شاخه ساخت task، خروجی کامل `tasksStore.addTask()` را به‌عنوان task ذخیره می‌کند، در حالی که action `res.data` را برمی‌گرداند نه لزوماً task object.
8. `public/manifest.webmanifest` و manifest داخل `vite.config.js` در `name`, `short_name`, `description`, icon metadata و RTL metadata یکسان نیستند.
9. README می‌گوید TypeScript type-check انجام می‌شود، ولی script/dependency مربوط در package configuration وجود ندارد.

## 32. Items Requiring Runtime Verification

- Build compatibility با Node range اعلام‌شده و Versionهای lock
- نتیجه واقعی `npm run build`
- مقدار و composition صحیح `VITE_API_URL`/`VITE_API_BASE`
- CORS، cookie و `credentials: include` برای auth
- همه response shapeها و validation error shapeها
- Router behavior برای Linkهای اشتباه و direct navigation
- Service Worker install/update، `__WB_MANIFEST` injection و cache invalidation
- تشخیص API request در `public/sw.js`؛ فقط URLهای شامل `/api/` از cache handler کنار گذاشته می‌شوند.
- Push permission timing، subscription renewal و notification click
- Notification pagination با `next_page_url`
- timezone/date boundaries در تهران و browserهای دیگر
- admin authorization سمت server
- Course content block rendering برای داده واقعی
- accessibility و focus trapping Modalها
- browser support برای `color-mix`, PWA و Web Push

## 33. Business Rules Requiring Owner Confirmation

- نام canonical محصول: `npmtodo`، `Do It`، `Todo` یا `TodoGoals`
- آیا هر goal در هر روز فقط یک task می‌تواند داشته باشد؟
- تفاوت دقیق goal، child goal و goal task چیست؟
- آیا goal دارای child یا task واقعاً نباید parent جدید بگیرد یا این فقط UI policy است؟
- semantics دقیق `daily`, `alternate_odd`, `alternate_even`, `weekly`, `step`, `offset`
- timezone رسمی scheduling و reportها
- roleهای معتبر غیر از `admin`
- سیاست expiry و refresh token
- زمان/شرایط درخواست notification permission
- معنای `persisted: false` در Push
- هدف کسب‌وکاری admin course area و reportهای placeholder
- حذف goal/task/notification باید cascade یا recoverable باشد؟

## 34. فایل‌ها و گروه‌های بررسی‌شده

- Root: `package.json`, `package-lock.json`, `vite.config.js`, `README.md`, `.env.example`, `.prettierrc.json`, `.gitignore`, `index.html`
- Bootstrap/routing: `src/main.js`, `src/App.vue`, `src/router/index.js`
- تمام `src/stores/*.js`
- تمام `src/utils/*.js`
- HTTP: `src/plugins/api.js`, `src/plugins/axios.js`
- Auth: `Login.vue`, `Register.vue`
- Task views/components: Day، Week، Month و componentهای مرتبط
- Goals: Store، Tab، List/Item، Goal Modal و Add Task Modal
- Notifications/settings: Header، Notifications View، SettingTab، alternate settings View، Web Push و Service Worker
- Admin: Dashboard، Reports، CourseList، Course
- Landing/contact و public manifest
- Shared component contracts با search سراسری props/emits/events
- Git status، tracked file structure و recent history

فایل `.env` واقعی، `node_modules/`، `dist/` و binary assetها خوانده یا Crawl کامل نشدند.

## 35. قواعد نگهداری و به‌روزرسانی سند

1. پس از تغییر Architecture، Route، Environment contract، Store boundary، PWA flow یا API shape این سند را به‌روزرسانی کنید.
2. تاریخ `Last reviewed` فقط پس از بررسی واقعی source تغییر کند.
3. Versionها از lockfile و rangeها از Manifest ثبت شوند.
4. Contract قطعی از assumption و runtime item جدا بماند.
5. مشکل رفع‌شده از بخش inconsistency حذف یا با وضعیت جدید جایگزین شود.
6. Feature flowها باید با file path واقعی همگام بمانند.
7. Source Code فعلی همیشه منبع نهایی حقیقت است.
