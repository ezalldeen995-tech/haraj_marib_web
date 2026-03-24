# 🛑 Project Audit Report: Haraj-Maareb

**Auditor:** Senior Technical Lead & Code Auditor
**Date:** 2026-03-09
**Scope:** Full codebase — Controllers, Models, Services, Repositories, Requests, Migrations, Policies, Observers, Resources, Routes, Middleware, Rules, Helpers, Notifications, Providers.

---

## 1. 🔒 Security Vulnerabilities

**Status: 🔴 Critical Issues**

### 1.1 Mass Assignment — Privilege Escalation via `role` field

- **Issue:** The `User` model's `$fillable` array includes `role`.
- **Location:** `app/Models/User.php` — Line 29
- **Code:**
  ```php
  protected $fillable = [
      'name', 'phone', 'email', 'password', 'avatar',
      'device_token', 'subscription_ends_at', 'role', 'lang', 'bio',
  ];
  ```
- **Reason:** Any endpoint that passes user input directly to `User::create()` or `$user->update($data)` allows an attacker to set `role` to `admin`.
- **Risk/Impact:** **CRITICAL — Full privilege escalation.** A normal user can register as admin or promote themselves via profile update.
- **Solution:** Remove `role` from `$fillable`. Set role only via explicit admin-only operations:
  ```php
  protected $fillable = [
      'name', 'phone', 'email', 'password', 'avatar',
      'device_token', 'lang', 'bio',
  ];
  ```
  Also remove `subscription_ends_at` from `$fillable` — it should only be set by the payment approval flow.

### 1.2 Mass Assignment — `subscription_ends_at` in `$fillable`

- **Issue:** `subscription_ends_at` is mass-assignable on the `User` model.
- **Location:** `app/Models/User.php` — Line 28
- **Reason:** If any controller passes unfiltered input to `$user->update()`, a user could set their own subscription expiry date.
- **Risk/Impact:** **HIGH — Users could grant themselves unlimited free subscriptions.**
- **Solution:** Remove from `$fillable`. Assignment happens only in `AdminController::approvePayment()`.

### 1.3 Weak OTP Generation — Predictable Codes

- **Issue:** OTP uses PHP's `rand()` function which is not cryptographically secure.
- **Location:** `app/Services/OtpService.php` — Line 17
- **Code:**
  ```php
  $code = rand(1000, 9999); // 4-digit
  ```
- **Reason:** `rand()` is a pseudo-random number generator. The output is predictable and can be brute-forced (only 9,000 possible codes).
- **Risk/Impact:** **HIGH — Account takeover via OTP brute-force.** An attacker needs at most 9,000 attempts.
- **Solution:** Use `random_int()` and increase to 6 digits. Add rate limiting on OTP verification:
  ```php
  $code = random_int(100000, 999999); // 6-digit, cryptographically secure
  ```

### 1.4 No Rate Limiting on OTP Endpoints

- **Issue:** The `otp/request`, `otp/verify`, `password/forgot`, and `password/reset` endpoints have no rate limiting.
- **Location:** `routes/api.php` — Lines 15–18
- **Reason:** Without throttling, an attacker can brute-force OTP codes or trigger OTP spam.
- **Risk/Impact:** **HIGH — OTP brute-force and SMS flooding attacks.**
- **Solution:** Apply `throttle` middleware:
  ```php
  Route::post('otp/request', ...)->middleware('throttle:3,10');
  Route::post('otp/verify', ...)->middleware('throttle:5,10');
  Route::post('password/reset', ...)->middleware('throttle:5,10');
  ```

### 1.5 OTP Code Stored in Plain Text

- **Issue:** The OTP code is stored in the `otp_code` column as plain text.
- **Location:** `app/Services/OtpService.php` — Line 18
- **Reason:** If the database is compromised, all active OTP codes are immediately visible.
- **Risk/Impact:** **MEDIUM — Account takeover in case of DB breach.**
- **Solution:** Hash the OTP code before storing, and compare using `Hash::check()`.

### 1.6 Predictable File Names for Uploaded Images

- **Issue:** Image filenames are generated using `time()` and `uniqid()`.
- **Location:** `app/Services/ImageService.php` — Line 30
- **Code:**
  ```php
  $filename = time() . '_' . uniqid() . '.jpg';
  ```
- **Reason:** `time()` is predictable and `uniqid()` is based on microseconds. An attacker could guess filenames.
- **Risk/Impact:** **MEDIUM — Direct access to uploaded files / enumeration attacks.**
- **Solution:** Use `Str::uuid()` or `Str::random(40)`:
  ```php
  $filename = \Illuminate\Support\Str::uuid() . '.jpg';
  ```

### 1.7 No Admin Authorization on `AdminController` Actions

- **Issue:** `AdminController` methods (`approvePayment`, `rejectPayment`, `approveAd`, `rejectAd`) do not use Policy authorization. They rely solely on the `RoleMiddleware`.
- **Location:** `app/Http/Controllers/AdminController.php` — Lines 19–101
- **Reason:** Single layer of defense. If middleware is accidentally removed from a route, all admin actions become public.
- **Risk/Impact:** **MEDIUM — Defense-in-depth violation.**
- **Solution:** Add `$this->authorize('update', $payment)` calls inside controller methods as a second layer.

### 1.8 Missing Authorization on `AdController::update()`

- **Issue:** The `update()` method loads the ad and updates it without calling `$this->authorize('update', $ad)`.
- **Location:** `app/Http/Controllers/AdController.php` — Lines 50–78
- **Reason:** Although `UpdateAdRequest::authorize()` checks ownership, the controller itself does not. If the Form Request is changed or bypassed, any user can edit any ad.
- **Risk/Impact:** **MEDIUM — Potential unauthorized ad modification.**
- **Solution:** Add explicit policy check: `$this->authorize('update', $ad);`

### 1.9 Admin Contact Messages Route Missing Admin Middleware

- **Issue:** The route `admin/contact-messages` is placed **outside** the admin middleware group.
- **Location:** `routes/api.php` — Line 67
- **Code:**
  ```php
  // admin contact list (OUTSIDE admin middleware group!)
  Route::get('admin/contact-messages', [ContactController::class, 'index']);
  ```
- **Reason:** Any authenticated user can view all contact messages.
- **Risk/Impact:** **HIGH — Information disclosure. All user contact messages exposed.**
- **Solution:** Move inside the admin middleware group.

### 1.10 `Payment::$fillable` includes `status`

- **Issue:** The `status` field is mass assignable on the `Payment` model.
- **Location:** `app/Models/Payment.php` — Line 11
- **Reason:** If any future code passes user input to `Payment::create()` or `update()`, a user could set their own payment status to `approved`.
- **Risk/Impact:** **MEDIUM — Potential payment fraud.**
- **Solution:** Remove `status` and `admin_notes` from `$fillable`. Set them explicitly in controller logic.

---

## 2. ⚡ Code Performance & Efficiency

**Status: 🔴 Critical Issues**

### 2.1 N+1 Query in `AdResource::is_favorited`

- **Issue:** Inside the `AdResource`, a **separate query** is executed for every single ad to check favorites.
- **Location:** `app/Http/Resources/AdResource.php` — Line 29
- **Code:**
  ```php
  'is_favorited' => auth()->check() ? $this->favorites()->where('user_id', auth()->id())->exists() : false,
  ```
- **Reason:** When listing 10 ads per page, this fires 10 additional queries. For pages with 50 ads, it fires 50 queries.
- **Risk/Impact:** **CRITICAL — O(N) database queries per page load. Severe performance degradation at scale.**
- **Solution:** Eager-load the relationship or use a subquery:
  ```php
  // In EloquentAdRepository::getFilteredAds()
  $userId = auth()->id();
  $query->withExists(['favorites as is_favorited' => function ($q) use ($userId) {
      $q->where('user_id', $userId);
  }]);
  ```

### 2.2 N+1 Query in `UserResource::rating`

- **Issue:** `UserResource` executes a separate AVG query for every user.
- **Location:** `app/Http/Resources/UserResource.php` — Line 29
- **Code:**
  ```php
  'rating' => $this->ratingsReceived()->avg('rating') ?? 0,
  ```
- **Reason:** Every time a `UserResource` is serialized (including inside every `AdResource`), a query is fired.
- **Risk/Impact:** **HIGH — Cascading N+1: listing 10 ads = 10 ad queries + 10 user rating queries = 20+ extra queries.**
- **Solution:** Use `withAvg('ratingsReceived', 'rating')` when loading users.

### 2.3 N+1 Queries in `ConversationResource`

- **Issue:** Two additional queries per conversation: `messages()->latest()->first()` and `messages()->where(...)->count()`.
- **Location:** `app/Http/Resources/ConversationResource.php` — Lines 18, 25
- **Reason:** Even though messages are eager-loaded with `limit(1)` in the controller, the resource makes **new** queries via `messages()` (relationship method, not loaded relation).
- **Risk/Impact:** **HIGH — 2×N extra queries when listing conversations.**
- **Solution:** Use the already-loaded relation: `$this->messages->first()` (property, not method). Pre-compute unread count with `withCount`.

### 2.4 `AdController::show()` — Increment Without Protection

- **Issue:** `$ad->increment('views_count')` runs on every request, including bots.
- **Location:** `app/Http/Controllers/AdController.php` — Line 42
- **Reason:** No de-duplication by IP/session. Bots or page refreshes inflate view counts.
- **Risk/Impact:** **MEDIUM — Inaccurate metrics and unnecessary DB writes.**
- **Solution:** Use Redis/cache to throttle increments per IP:
  ```php
  $cacheKey = "ad_view_{$id}_" . request()->ip();
  if (!Cache::has($cacheKey)) {
      $ad->increment('views_count');
      Cache::put($cacheKey, true, 300); // 5 min
  }
  ```

### 2.5 `PaymentController::myPayments()` — Filter in PHP, Not SQL

- **Issue:** Loads ALL user payments, then filters them in PHP using `->filter()`.
- **Location:** `app/Http/Controllers/PaymentController.php` — Lines 36–38
- **Code:**
  ```php
  $payments = Payment::where('user_id', auth()->id())->get()->filter(function ($p) {
      return auth()->user()->can('view', $p);
  });
  ```
- **Reason:** The policy check `can('view', $p)` for owned payments always returns true (owner check). This is redundant — all results already belong to the user.
- **Risk/Impact:** **LOW–MEDIUM — Unnecessary memory consumption and policy invocations.**
- **Solution:** Just return the query results directly:
  ```php
  $payments = Payment::where('user_id', auth()->id())->latest()->paginate(15);
  ```

### 2.6 `AdminController::update()` — Notification Loop to All Admins

- **Issue:** When updating an active ad, the code loads all admins and sends notifications in a loop.
- **Location:** `app/Http/Controllers/AdController.php` — Lines 60–68
- **Code:**
  ```php
  $admins = User::where('role', 'admin')->get();
  foreach ($admins as $admin) {
      FirebaseService::sendNotification($admin, ...);
  }
  ```
- **Reason:** Each `sendNotification` is a synchronous HTTP call to Firebase. If there are 10 admins, the response waits for 10 HTTP round-trips.
- **Risk/Impact:** **HIGH — Request timeout for the user. Blocks the response thread.**
- **Solution:** Dispatch a queued job for notifications:
  ```php
  dispatch(new \App\Jobs\NotifyAdminsOfUpdate($ad));
  ```

### 2.7 No Pagination on Admin Endpoints

- **Issue:** `AdminController::pendingPayments()` uses `->get()` without pagination.
- **Location:** `app/Http/Controllers/AdminController.php` — Line 14
- **Reason:** With thousands of pending payments, this loads everything into memory.
- **Risk/Impact:** **MEDIUM — Memory exhaustion on large datasets.**
- **Solution:** Use `->paginate(20)`.

---

## 3. 🏗️ Architecture & Design Patterns

**Status: 🟡 Needs Improvement**

### 3.1 Repository Pattern Applied Inconsistently

- **Issue:** Only `Ad` has a repository (`EloquentAdRepository`). All other models are queried directly in controllers.
- **Location:** `AdminController`, `ChatController`, `CommentController`, `FavoriteController`, `RatingController`, `BlockController`, `ContactController`, `DashboardController` — all use inline `Model::where(...)` calls.
- **Reason:** Violates architectural consistency. If the team chose the Repository pattern, it should be applied across the board, or not at all.
- **Risk/Impact:** **MEDIUM — Inconsistent codebase, harder to maintain, difficult to swap implementations.**
- **Solution:** Either create repositories for `Payment`, `Conversation`, `User`, etc. or drop the pattern entirely and use Services with Eloquent directly.

### 3.2 Fat Controllers — SRP Violations

- **Issue:** Multiple controllers contain business logic that should be in Services.
- **Locations:**
  - `AdminController::approvePayment()` (Lines 27–38): Contains subscription calculation logic.
  - `AdController::store()` (Lines 110–116): Contains spam protection / daily limit logic.
  - `AdController::update()` (Lines 59–68): Contains admin notification logic.
  - `ChatController` (Lines 36–42, 73–79, 142–148): Contains repeated block-check logic.
- **Reason:** Controllers should only handle HTTP concerns (receive request → delegate → return response).
- **Risk/Impact:** **MEDIUM — Business logic scattered, hard to unit test, leads to duplication.**
- **Solution:** Extract to services:
  - `SubscriptionService::activate($user, $months)`
  - `BlockService::areBlocked($userId1, $userId2): bool`
  - `AdService::canUserPostAd($user): bool`

### 3.3 Duplicated Block-Check Logic (3× Copy-Paste)

- **Issue:** The exact same block-check query is copy-pasted 3 times in `ChatController`.
- **Location:** `app/Http/Controllers/ChatController.php` — Lines 36–42, Lines 73–79, Lines 142–148
- **Code (repeated 3 times):**
  ```php
  if (\App\Models\BlockedUser::where(function ($q) use ($userId, $otherId) {
      $q->where('user_id', $userId)->where('blocked_user_id', $otherId);
  })->orWhere(function ($q) use ($userId, $otherId) {
      $q->where('user_id', $otherId)->where('blocked_user_id', $userId);
  })->exists()) {
      return response()->json(['message' => '...'], 403);
  }
  ```
- **Risk/Impact:** **MEDIUM — Any fix to block logic must be applied in 3 places.**
- **Solution:** Extract to `BlockedUser::areBlocked($userId1, $userId2): bool` scope or a `BlockService`.

### 3.4 Services Are All Static — Cannot Be Mocked for Testing

- **Issue:** `OtpService`, `ImageService`, and `FirebaseService` are entirely static classes.
- **Location:** All files in `app/Services/`
- **Reason:** Static methods cannot be mocked in unit tests. They also bypass the DI container.
- **Risk/Impact:** **MEDIUM — Untestable business logic. Cannot write proper unit tests.**
- **Solution:** Convert to injectable services bound via `AppServiceProvider`, or use interfaces.

### 3.5 Inline Model References

- **Issue:** `AdminController` uses fully-qualified class names inline instead of importing them.
- **Location:** `app/Http/Controllers/AdminController.php` — Throughout
- **Code:**
  ```php
  $payment = \App\Models\Payment::findOrFail($id);
  \App\Services\FirebaseService::sendNotification(...);
  ```
- **Risk/Impact:** **LOW — PSR-12 violation, reduces readability.**
- **Solution:** Add proper `use` statements at the top of the file.

### 3.6 `AdminController::settings()` — Dual HTTP Method in One Action

- **Issue:** The `settings()` method handles both GET and POST via `isMethod('post')`.
- **Location:** `app/Http/Controllers/AdminController.php` — Lines 111–124
- **Reason:** Mixing concerns in a single action violates RESTful design and SRP.
- **Risk/Impact:** **LOW — Confusing API design, harder to document.**
- **Solution:** Split into separate `getSettings()` and `updateSetting()` methods with separate routes.

### 3.7 Malformed Closing Brace

- **Issue:** `AdminController` has a missing newline / doubled closing brace: `}}`
- **Location:** `app/Http/Controllers/AdminController.php` — Line 124
- **Risk/Impact:** **LOW — Code smell, PSR-12 violation.**

---

## 4. 📋 Business Logic & Scenario Adherence

**Status: 🟡 Needs Improvement**

### 4.1 No Check for Phone Verification Before Login

- **Issue:** Users can log in immediately after registration without verifying their phone via OTP.
- **Location:** `app/Http/Controllers/AuthController.php` — `login()` method, Lines 78–87
- **Reason:** The `register()` method sends an OTP but the `login()` method never checks `phone_verified_at`.
- **Risk/Impact:** **HIGH — Defeats the purpose of OTP verification. Unverified users can access the full system.**
- **Solution:** Add a check in `login()`:
  ```php
  $user = User::where('phone', $credentials['phone'])->first();
  if ($user && !$user->phone_verified_at) {
      return response()->json(['message' => 'Phone not verified'], 403);
  }
  ```

### 4.2 Subscription Expiry Not Checked on Ad Creation

- **Issue:** `AdController::store()` checks `hasActiveSubscription()` for daily limits, but doesn't verify if the subscription expired *between* checking and creating.
- **Location:** `app/Http/Controllers/AdController.php` — Lines 111–127
- **Reason:** `is_featured` is set to `true` based on subscription status at creation time. If subscription expires mid-session, the ad still gets featured status.
- **Risk/Impact:** **LOW — Race condition allowing one extra featured ad.**
- **Solution:** Use a DB transaction and re-check subscription atomically.

### 4.3 Ad Renewal Bypasses Status Checks

- **Issue:** The `renew()` method sets any ad to `active` regardless of its current status.
- **Location:** `app/Repositories/EloquentAdRepository.php` — Lines 78–85
- **Code:**
  ```php
  $ad->status = 'active';
  ```
- **Reason:** A `rejected` ad can be re-activated by calling renew, bypassing admin approval.
- **Risk/Impact:** **HIGH — Rejected content can bypass moderation.**
- **Solution:** Only allow renewal for `active` or `expired` ads:
  ```php
  if (!in_array($ad->status, ['active', 'expired'])) {
      abort(403, 'Cannot renew a rejected ad');
  }
  ```

### 4.4 Blocked User Can Still Rate Another User

- **Issue:** The `RatingController::store()` does not check if a block exists between the users.
- **Location:** `app/Http/Controllers/RatingController.php` — Lines 9–33
- **Reason:** Block checks are only in `ChatController`. A blocked user could still leave negative ratings.
- **Risk/Impact:** **MEDIUM — Harassment vector after blocking.**
- **Solution:** Add block check before allowing ratings.

### 4.5 Blocked User Can Still Comment on Ads

- **Issue:** `CommentController::store()` does not check if the commenter is blocked by the ad owner.
- **Location:** `app/Http/Controllers/CommentController.php` — Lines 9–22
- **Risk/Impact:** **MEDIUM — Blocked users can still harass via comments.**
- **Solution:** Add block check against `$ad->user_id`.

### 4.6 Users Can Favorite Their Own Ads

- **Issue:** No check preventing a user from favoriting their own ad.
- **Location:** `app/Http/Controllers/FavoriteController.php` — Lines 9–30
- **Risk/Impact:** **LOW — Cosmetic issue, inflates favorite counts.**

### 4.7 No Maximum Content Length for Comments

- **Issue:** `CommentController::store()` validates `content` as `required|string` with no `max` limit.
- **Location:** `app/Http/Controllers/CommentController.php` — Line 13
- **Risk/Impact:** **MEDIUM — A user could submit a multi-megabyte comment.**
- **Solution:** Add `'content' => 'required|string|max:1000'`.

### 4.8 Duplicate Notification on Ad Status Change

- **Issue:** Both `AdminController::approveAd()/rejectAd()` AND `AdObserver::updated()` send notifications when ad status changes to active/rejected.
- **Location:**
  - `app/Http/Controllers/AdminController.php` — Lines 77–82, 93–98
  - `app/Observers/AdObserver.php` — Lines 23–31
- **Reason:** The observer fires on every `save()`, so when the admin approves an ad, the user gets **two** push notifications.
- **Risk/Impact:** **MEDIUM — Duplicate notifications annoy users.**
- **Solution:** Remove the notification from either the controller or the observer. The observer is the better place.

---

## 5. ✅ Completeness & Errors

**Status: 🔴 Critical Issues**

### 5.1 `ActivityLog` Model Is Empty

- **Issue:** The `ActivityLog` model has no `$fillable`, no relationships, and no table columns.
- **Location:** `app/Models/ActivityLog.php` — Lines 1–11
- **Code:**
  ```php
  class ActivityLog extends Model
  {
      //
  }
  ```
- **Reason:** The `PaymentObserver` tries to `ActivityLog::create([...])` with fields like `user_id`, `action`, `subject_type`, etc. — but the model has no `$fillable` and the migration only has `id` and `timestamps`.
- **Risk/Impact:** **CRITICAL — `ActivityLog::create()` will throw a MassAssignmentException. All payment operations will fail silently or crash.**
- **Solution:** Add `$fillable` to the model and add proper columns to the migration:
  ```php
  protected $fillable = ['user_id','action','subject_type','subject_id','description','ip_address','user_agent'];
  ```

### 5.2 `activity_logs` Migration Is Empty

- **Issue:** The migration only creates `id` and `timestamps` columns.
- **Location:** `database/migrations/2026_03_06_025909_create_activity_logs_table.php` — Lines 14–17
- **Code:**
  ```php
  Schema::create('activity_logs', function (Blueprint $table) {
      $table->id();
      $table->timestamps();
  });
  ```
- **Reason:** The `PaymentObserver` writes `user_id`, `action`, `subject_type`, `subject_id`, `description`, `ip_address`, `user_agent` — none of these columns exist.
- **Risk/Impact:** **CRITICAL — SQL errors on every payment creation/update.**
- **Solution:** Add the missing columns to the migration.

### 5.3 `modify_users_table_add_custom_columns` Migration Is Empty

- **Issue:** The migration body is completely empty — no columns are added.
- **Location:** `database/migrations/2026_03_06_010909_modify_users_table_add_custom_columns.php` — Lines 14–16
- **Code:**
  ```php
  Schema::table('users', function (Blueprint $table) {
      //
  });
  ```
- **Risk/Impact:** **LOW — Dead code, but confusing for developers.**
- **Solution:** Delete this migration or add the intended columns.

### 5.4 `Message` Model Missing `sender` Relationship

- **Issue:** The `Message` model has no `sender()` relationship, only `conversation()`.
- **Location:** `app/Models/Message.php` — Lines 1–17
- **Reason:** `MessageResource` references `sender_id` but can never eager-load the sender. Any future `.sender.name` access will be an N+1 or null.
- **Risk/Impact:** **LOW — Missing relationship, future N+1 risk.**
- **Solution:**
  ```php
  public function sender(): BelongsTo
  {
      return $this->belongsTo(User::class, 'sender_id');
  }
  ```

### 5.5 `NoProfanity` Rule Has Placeholder Bad Words

- **Issue:** The profanity filter only contains `['badword1', 'badword2', 'profanity', 'offensive']`.
- **Location:** `app/Rules/NoProfanity.php` — Line 17
- **Reason:** These are clearly placeholder values, not actual profanity. The filter is non-functional.
- **Risk/Impact:** **HIGH — No actual content moderation. Profanity passes through unchecked.**
- **Solution:** Load bad words from a config file or database. Include actual Arabic + English profanity lists.

### 5.6 `lat` and `lng` Are NOT Nullable in DB but `sometimes` in Validation

- **Issue:** The `ads` migration defines `lat` and `lng` as `decimal(10,8)` and `decimal(11,8)` — non-nullable. But `StoreAdRequest` marks them as `sometimes`.
- **Location:**
  - `database/migrations/2026_03_06_010924_create_ads_table.php` — Lines 23–24
  - `app/Http/Requests/StoreAdRequest.php` — Lines 32–33
- **Risk/Impact:** **CRITICAL — If `lat`/`lng` are not provided, the INSERT will fail with a NOT NULL constraint error.**
- **Solution:** Either make the DB columns nullable or make the validation `required`.

### 5.7 `AdResource` Hardcodes Currency as 'SAR'

- **Issue:** The formatted price hardcodes `SAR` (Saudi Riyal) but the ad model and migration use `YER` (Yemeni Rial) as default currency.
- **Location:** `app/Http/Resources/AdResource.php` — Line 22
- **Code:**
  ```php
  'formatted_price' => number_format($this->price, 2) . ' SAR',
  ```
- **Risk/Impact:** **MEDIUM — Incorrect currency display for all ads.**
- **Solution:** Use the ad's actual currency: `number_format($this->price, 2) . ' ' . $this->currency`

### 5.8 `Category` Model Missing Multilingual Columns

- **Issue:** The migration `modify_categories_table_multilang` exists but was not checked. The `Category` model's `$fillable` only has `['name','icon','parent_id','is_active']` — no `name_ar`, `name_en`, or similar fields.
- **Location:** `app/Models/Category.php` — Line 12
- **Risk/Impact:** **MEDIUM — Multilingual support may be incomplete.**

---

## 6. 🔁 Redundancy & Optimization

**Status: 🟡 Needs Improvement**

### 6.1 Duplicate DB Query in `UpdateAdRequest::authorize()`

- **Issue:** `UpdateAdRequest::authorize()` calls `Ad::findOrFail()`, and then `AdController::update()` calls `$this->adRepository->find($id)` again — same ad, two queries.
- **Location:**
  - `app/Http/Requests/UpdateAdRequest.php` — Line 15
  - `app/Http/Controllers/AdController.php` — Line 52
- **Risk/Impact:** **LOW — Unnecessary duplicate query.**
- **Solution:** Load the ad once. Use route model binding or pass the ad from the request.

### 6.2 Unused Imports

- **Issue:** Several files have unused imports.
- **Locations:**
  - `app/Http/Controllers/AuthController.php` Line 9: `use Illuminate\Validation\Rule;` — never used.
  - `app/Http/Controllers/AdController.php` Line 10: `use App\Models\User;` — used, but only for admin queries that should be in a service.
  - `app/Http/Controllers/PaymentController.php` Line 7: `use Illuminate\Support\Facades\Storage;` — never used.
  - `app/Http/Requests/UpdateUserRequest.php` Line 6: `use Illuminate\Validation\Rule;` — actually used on Line 27.
  - `app/Notifications/OtpNotification.php` Lines 7, 9: `MailMessage` and `BroadcastMessage` — never used.
  - `app/Http/Controllers/CategoryController.php` Line 7: `use Illuminate\Http\Request;` — never used.
  - `app/Http/Controllers/SettingController.php` Line 6: `use Illuminate\Http\Request;` — never used.
- **Risk/Impact:** **LOW — Code clutter, minor autoloader overhead.**
- **Solution:** Remove all unused imports.

### 6.3 `setting_helper.php` — Redundant Wrapper

- **Issue:** The helper functions `get_setting()` and `set_setting()` are simple wrappers around `Setting::get()` and `Setting::set()`.
- **Location:** `app/Helpers/setting_helper.php`
- **Reason:** They add no value over calling the model directly.
- **Risk/Impact:** **LOW — Unnecessary indirection.**
- **Solution:** Fine to keep for convenience, but ensure it's registered in `composer.json` autoload.

### 6.4 `AdController::destroy()` — Images Already Handled by Model Event

- **Issue:** `AdController::destroy()` manually loops through images to delete files, but `Ad::booted()` already handles file deletion on force delete.
- **Location:**
  - `app/Http/Controllers/AdController.php` — Lines 90–94
  - `app/Models/Ad.php` — Lines 49–60
- **Reason:** The controller method runs on soft-delete (files are deleted prematurely), while the model event runs on force-delete. These are **conflicting** behaviors.
- **Risk/Impact:** **MEDIUM — Image files are deleted on soft-delete but the DB records remain, causing broken images if the ad is restored.**
- **Solution:** Only delete image files on force-delete. Remove file deletion from the controller.

---

## 7. 🗄️ Database Integrity

**Status: 🟡 Needs Improvement**

### 7.1 Missing Indexes on Frequently Queried Columns

- **Issue:** Several columns used in WHERE clauses have no explicit indexes.
- **Locations:**
  - `ads.status` — Queried in nearly every ad listing. No index.
  - `ads.category_id` — Already has foreign key index (OK).
  - `ads.user_id` — Already has foreign key index (OK).
  - `ads.expires_at` — Used in expiry checks. No index.
  - `users.phone` — Has unique constraint (OK, implicitly indexed).
  - `users.role` — Queried by `RoleMiddleware` and admin queries. No index.
  - `messages.conversation_id` — Has foreign key index (OK).
  - `messages.is_read` — Queried in mark-as-read logic. No index.
  - `messages.sender_id` — Queried for unread count. No index (only FK).
  - `payments.status` — Queried for pending payments. No index.
  - `conversations.buyer_id` — Has FK (OK).
  - `conversations.seller_id` — Has FK (OK).
- **Risk/Impact:** **MEDIUM — Full table scans on large datasets.**
- **Solution:** Add a migration to create indexes:
  ```php
  $table->index('status');           // ads
  $table->index('expires_at');       // ads
  $table->index('status');           // payments
  $table->index(['is_read', 'sender_id']); // messages (composite)
  ```

### 7.2 No Unique Constraint on `conversations(ad_id, buyer_id, seller_id)`

- **Issue:** There's no unique constraint preventing duplicate conversations for the same ad+buyer+seller.
- **Location:** `database/migrations/2026_03_06_011001_create_conversations_table.php`
- **Reason:** The controller checks with `firstOrCreate`-style logic, but without a DB-level constraint, race conditions could create duplicates.
- **Risk/Impact:** **MEDIUM — Data integrity issue under concurrent requests.**
- **Solution:** Add `$table->unique(['ad_id', 'buyer_id', 'seller_id']);`

### 7.3 `activity_logs` Table Completely Broken

- **Issue:** As noted in Section 5.1 and 5.2, the migration and model are both incomplete.
- **Risk/Impact:** **CRITICAL — `PaymentObserver` will crash.**

### 7.4 Missing `currency` Column Index

- **Issue:** The `currency` column in `ads` is a string with default `YER` but no index. If multi-currency filtering is ever added, this will be slow.
- **Risk/Impact:** **LOW — Future-proofing concern.**

---

## 8. 🌐 API Standards

**Status: 🟡 Needs Improvement**

### 8.1 Inconsistent JSON Response Structure

- **Issue:** Responses vary wildly across controllers:
  - `AuthController::register()` → `{"token": "..."}`
  - `UserController::profile()` → `{"user": {...}, "active_ads_count": 1, "rating_avg": 4.5}`
  - `AdController::store()` → `{"message": "...", "ad": {...}}`
  - `FavoriteController::toggleFavorite()` → `{"favorited": true}`
  - `BlockController::toggleBlock()` → `{"blocked": true}`
  - `CommentController::store()` → Raw model JSON (no wrapper)
  - `AdminController::pendingPayments()` → Raw collection JSON (no wrapper)
  - `AdminController::logs()` → Raw paginated JSON
  - `PaymentController::myPayments()` → Raw collection JSON
- **Reason:** No standardized API response envelope.
- **Risk/Impact:** **HIGH — Frontend developers cannot write a generic response handler. Different response shapes for different endpoints.**
- **Solution:** Adopt a standard envelope:
  ```json
  {
      "success": true,
      "message": "...",
      "data": { ... },
      "meta": { "pagination": { ... } }
  }
  ```

### 8.2 Incorrect HTTP Status Codes

- **Issue:** Several endpoints return wrong status codes.
- **Locations:**
  - `AuthController::logout()` — Returns 200 with `{"message": "Logged out successfully"}`. Should return **204 No Content**.
  - `ChatController::startOrGetConversation()` — Returns 200 whether creating a new conversation or returning an existing one. Should return **201** when creating.
  - `AdController::update()` — Returns 200. Correct.
  - `FavoriteController::toggleFavorite()` — Returns 200 for both create and delete. Should return **201** on create, **200** on delete.
  - `BlockController::toggleBlock()` — Same issue as favorites.
  - `RatingController::store()` — Returns 200. Should return **201** for new ratings.
  - `PaymentController::requestSubscription()` — Returns 200. Should return **201**.
- **Risk/Impact:** **MEDIUM — Non-compliance with HTTP/REST standards. Confusing for API consumers.**

### 8.3 Hardcoded English Messages in Some Locations

- **Issue:** Some messages use `__('messages.xxx')` (translatable) while others are hardcoded in English.
- **Locations:**
  - `AuthController::logout()` Line 95: `'message' => 'Logged out successfully'`
  - `ChatController` Lines 32, 41, 78, 147: `'You cannot start a conversation with yourself'`, `'You cannot interact with this user'`
  - `UserController::deleteAccount()` Line 94: `'Account deleted'`
  - `ContactController::store()` Line 20: `'Message received'`
- **Risk/Impact:** **MEDIUM — Breaks i18n support. Arabic-speaking users see English error messages.**
- **Solution:** Use `__('messages.xxx')` consistently for ALL user-facing messages.

### 8.4 No API Versioning Enforcement

- **Issue:** Routes are defined without a version prefix in `api.php`.
- **Location:** `routes/api.php`
- **Reason:** The Swagger docs reference `/api/v1/...` but the actual routes are `/api/...`.
- **Risk/Impact:** **MEDIUM — Version mismatch between documentation and implementation.**
- **Solution:** Add `Route::prefix('v1')->group(...)` to all routes.

### 8.5 Missing API Resources for Some Endpoints

- **Issue:** Some controllers return raw models instead of using API Resources.
- **Locations:**
  - `CommentController::store()` — Returns raw `Comment` model.
  - `AdminController::pendingPayments()` — Returns raw `Payment` collection.
  - `UserController::updateProfile()` — Returns raw `User` model (exposes all attributes including sensitive ones).
  - `PaymentController::myPayments()` — Returns raw `Payment` collection.
  - `AuthController::me()` — Returns raw `User` model.
  - `RatingController::store()` — Returns raw `Rating` model.
- **Reason:** Sensitive data like `otp_code`, `otp_expires_at`, `device_token` could leak through raw model serialization.
- **Risk/Impact:** **HIGH — Data leakage of sensitive user fields.**
- **Solution:** Always use API Resources. Ensure `$hidden` on models covers all sensitive fields.

---

## 9. 💡 Suggestions for Enhancement

### 9.1 Add Rate Limiting on Login Endpoint
- The `login` route has no throttle. Attackers can brute-force credentials.
- **Suggestion:** `Route::post('login', ...)->middleware('throttle:5,1');`

### 9.2 Implement Scheduled Command for Expired Ads
- There's no mechanism to automatically mark ads as expired when `expires_at` passes.
- **Suggestion:** Create an Artisan command `ads:expire` that runs via scheduler:
  ```php
  Ad::where('status', 'active')->where('expires_at', '<', now())->update(['status' => 'expired']);
  ```

### 9.3 Add Search Functionality
- The ad listing only supports filtering by category, price range, and address. Full-text search on `title` and `description` is missing.
- **Suggestion:** Add a `search` parameter using `LIKE` or Laravel Scout.

### 9.4 Implement Token Blacklisting for JWT
- After logout, the JWT token can still be used until it expires.
- **Suggestion:** Implement token blacklisting or reduce token TTL.

### 9.5 Add API Documentation Middleware
- Swagger annotations exist only on a few endpoints (`register`, `login`, `resetPassword`).
- **Suggestion:** Add `@OA` annotations to ALL endpoints.

### 9.6 Database Transactions for Multi-Step Operations
- `AdminController::approvePayment()` updates `Payment`, then updates `User`. If the second step fails, data becomes inconsistent.
- **Suggestion:** Wrap in `DB::transaction()`.

### 9.7 Add Soft Deletes to Comments
- Comments are hard-deleted. If a user deletes a comment that an admin needs to review, it's gone.
- **Suggestion:** Add `SoftDeletes` to the `Comment` model.

### 9.8 Implement User Reporting System
- The `reports` table migration exists but there's no `Report` model, controller, or routes.
- **Suggestion:** Implement the full report flow.

### 9.9 Add Request Logging/Monitoring
- No logging middleware for API requests.
- **Suggestion:** Add a middleware to log request/response for debugging.

### 9.10 Admin Should Not Be Able to Delete Their Own Account
- `UserController::deleteAccount()` has no role check. An admin can accidentally delete their account.
- **Suggestion:** Add guard: `if ($user->role === 'admin') { abort(403); }`

### 9.11 Missing Test Suite
- The `tests/` directory appears to have no custom tests.
- **Suggestion:** Add Feature and Unit tests for all critical flows (auth, payments, ads CRUD).

---

## 📊 Summary Scorecard

| Aspect | Status | Severity |
|---|---|---|
| Security Vulnerabilities | 🔴 Critical | 10 issues found |
| Performance & Efficiency | 🔴 Critical | 7 issues (N+1 queries, sync notifications) |
| Architecture & Design | 🟡 Needs Improvement | 7 issues (fat controllers, static services) |
| Business Logic | 🟡 Needs Improvement | 8 edge cases missed |
| Completeness | 🔴 Critical | Broken `ActivityLog`, empty migrations |
| Redundancy | 🟡 Needs Improvement | Duplicate queries, unused imports |
| Database Integrity | 🟡 Needs Improvement | Missing indexes, no unique constraints |
| API Standards | 🟡 Needs Improvement | Inconsistent responses, wrong status codes |

### 🔴 Top 5 Issues to Fix Immediately:
1. **Remove `role` from User `$fillable`** — Privilege escalation risk.
2. **Fix `ActivityLog` model and migration** — Breaks payment flow entirely.
3. **Fix `lat`/`lng` nullable mismatch** — Ad creation crashes.
4. **Move `admin/contact-messages` inside admin middleware** — Data exposure.
5. **Fix N+1 queries in `AdResource` and `ConversationResource`** — Performance degradation.

---

*End of Audit Report*
