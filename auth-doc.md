# Auth Endpoints — دليل مطور Flutter

> **Base URL:** `/api/v1`  
> **Content-Type:** `application/json`  
> **Accept:** `application/json`

---

## نظرة عامة على مسار المصادقة

```
بدء التطبيق
    │
    ▼
[1] GET /settings/app          ← جلب إعدادات التطبيق (المحافظات، OTP، ...)
    │
    ├─── تسجيل جديد؟
    │        ▼
    │   [2] POST /auth/register
    │        │
    │        ├── next_route = "otp"    → OTP مفعّل
    │        │       ▼
    │        │   [3] POST /auth/verify-otp   (بالتوكن المؤقت)
    │        │       │
    │        │       └── next_route = "home" → انتقل للشاشة الرئيسية
    │        │
    │        └── next_route = "home"   → OTP معطّل، توكن دائم → انتقل للشاشة الرئيسية
    │
    ├─── لديك حساب؟
    │        ▼
    │   [4] POST /auth/login
    │        └── توكن دائم → انتقل للشاشة الرئيسية
    │
    ├─── تحديث رمز الإشعارات (بعد الدخول)
    │        ▼
    │   [5] PUT /auth/fcm-token
    │
    └─── نسيت كلمة المرور؟
             ▼
         [5] POST /auth/forget-password
                 ▼
             [3] POST /auth/verify-otp   (بالتوكن المؤقت)
                 │
                 └── next_route = "reset_password"
                         ▼
                     [6] POST /auth/reset-password   (بتوكن إعادة التعيين)
                             └── توكن دائم → انتقل للشاشة الرئيسية
```

---

## أنواع التوكنات — مهم جداً

| نوع التوكن               | متى يُعطى                                                                     | الاستخدام                      | الصلاحيات |
| ------------------------ | ----------------------------------------------------------------------------- | ------------------------------ | --------- |
| **OTP Temp Token**       | بعد Register أو Forget Password                                               | فقط لـ verify-otp و resend-otp | مؤقت      |
| **Password Reset Token** | بعد verify-otp في حالة forget-password                                        | فقط لـ reset-password          | مؤقت      |
| **Full Auth Token**      | بعد Login، أو Register بدون OTP، أو reset-password، أو verify-otp من Register | كل الـ endpoints المحمية       | دائم      |

> **ملاحظة:** جميع التوكنات تُرسَل في header: `Authorization: Bearer {token}`

---

## صيغة الرد العامة

### نجاح (Success)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### خطأ (Error)

```json
{
    "success": false,
    "message": "وصف الخطأ",
    "errors": {
        "code": "ERROR_CODE"
    }
}
```

### خطأ Validation (422)

```json
{
    "message": "The phone field is required.",
    "errors": {
        "phone": ["The phone field is required."]
    }
}
```

---

---

# 1. GET /settings/app

> **الغرض:** جلب إعدادات التطبيق قبل أي شيء — تُستدعى عند بدء تشغيل التطبيق.  
> تحتوي على المحافظات، إعدادات OTP، العملات، والخصائص الأخرى.

**Method:** `GET`  
**URL:** `/api/v1/settings/app`  
**Auth:** لا يلزم

---

### قاعدة مهمة: المحافظات وشاشة التسجيل

-   إذا كان `features.enable_multi_governorates = true` → **أظهر قائمة المحافظات** للمستخدم ليختار محافظته عند التسجيل.
-   إذا كان `features.enable_multi_governorates = false` → **القائمة ستكون فارغة** (أو تحتوي على محافظة واحدة فقط هي المحافظة الافتراضية)، ولا تُظهر قائمة الاختيار — استخدم `features.default_governorate_id` بصمت.

> استخدم دائماً المحافظات المُعادة من هذا الـ endpoint في شاشة التسجيل ولا تعتمد على بيانات مخزّنة مسبقاً.

---

### رد ناجح — عندما يكون enable_multi_governorates = true

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "currencies": {
            "is_multi_currency_enabled": true,
            "base_currency": {
                "id": 1,
                "code": "YER",
                "name": "Yemeni Rial",
                "symbol": "﷼",
                "is_active": true,
                "is_base": true,
                "created_at": "2026-02-27 00:00:00",
                "updated_at": "2026-02-27 00:00:00"
            },
            "supported_currencies": [
                {
                    "id": 1,
                    "code": "YER",
                    "name": "Yemeni Rial",
                    "symbol": "﷼",
                    "is_active": true,
                    "is_base": true,
                    "created_at": "2026-02-27 00:00:00",
                    "updated_at": "2026-02-27 00:00:00"
                },
                {
                    "id": 2,
                    "code": "USD",
                    "name": "US Dollar",
                    "symbol": "$",
                    "is_active": true,
                    "is_base": false,
                    "created_at": "2026-02-27 00:00:00",
                    "updated_at": "2026-02-27 00:00:00"
                }
            ]
        },
        "locations": {
            "governorates": [
                {
                    "id": 1,
                    "name": "صنعاء",
                    "areas": [
                        { "id": 1, "name": "الأمانة" },
                        { "id": 2, "name": "صنعاء الجديدة" },
                        { "id": 3, "name": "حدة" }
                    ]
                },
                {
                    "id": 2,
                    "name": "عدن",
                    "areas": [
                        { "id": 4, "name": "كريتر" },
                        { "id": 5, "name": "التواهي" }
                    ]
                }
            ]
        },
        "features": {
            "is_rating_enabled": true,
            "is_publisher_request_enabled": true,
            "is_contact_info_visible": true,
            "require_publisher_approval": true,
            "require_property_approval": true,
            "enable_multi_governorates": true,
            "default_governorate_id": null,
            "enable_multi_currency": true
        },
        "otp": {
            "is_enabled": true,
            "is_required_for_registration": true,
            "expiration_minutes": 5,
            "max_attempts": 5
        }
    }
}
```

---

### رد ناجح — عندما يكون enable_multi_governorates = false

في هذه الحالة، `locations.governorates` **ستكون فارغة** لأن المحافظات معطّلة. استخدم `features.default_governorate_id` كمحافظة ثابتة للمستخدم.

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "currencies": {
            "is_multi_currency_enabled": false,
            "base_currency": {
                "id": 1,
                "code": "YER",
                "name": "Yemeni Rial",
                "symbol": "﷼",
                "is_active": true,
                "is_base": true,
                "created_at": "2026-02-27 00:00:00",
                "updated_at": "2026-02-27 00:00:00"
            },
            "supported_currencies": [
                {
                    "id": 1,
                    "code": "YER",
                    "name": "Yemeni Rial",
                    "symbol": "﷼",
                    "is_active": true,
                    "is_base": true,
                    "created_at": "2026-02-27 00:00:00",
                    "updated_at": "2026-02-27 00:00:00"
                }
            ]
        },
        "locations": {
            "governorates": []
        },
        "features": {
            "is_rating_enabled": true,
            "is_publisher_request_enabled": true,
            "is_contact_info_visible": true,
            "require_publisher_approval": true,
            "require_property_approval": true,
            "enable_multi_governorates": false,
            "default_governorate_id": 1,
            "enable_multi_currency": false
        },
        "otp": {
            "is_enabled": false,
            "is_required_for_registration": false,
            "expiration_minutes": 5,
            "max_attempts": 5
        }
    }
}
```

---

### كيفية استخدام البيانات في شاشة التسجيل

- إذا كان `features.enable_multi_governorates` يساوي `true`:
  - أظهر قائمة المحافظات من `locations.governorates`
  - المستخدم يختار المحافظة

- إذا كان `features.enable_multi_governorates` يساوي `false`:
  - لا تُظهر قائمة المحافظات
  - أرسل `features.default_governorate_id` تلقائياً عند التسجيل

---

### الأخطاء المتوقعة

| Status | الوصف         | مثال                                                               |
| ------ | ------------- | ------------------------------------------------------------------ |
| 500    | خطأ في الخادم | `{ "success": false, "message": "An unexpected error occurred." }` |

> هذا الـ endpoint لا يتوقع أخطاء منطقية — إذا فشل فهو خطأ في الخادم.

---

---

# 2. POST /auth/register

> **الغرض:** تسجيل مستخدم جديد.  
> بناءً على إعداد `enable_otp` في النظام:
>
> -   إذا كان **OTP مفعّلاً**: يُعاد توكن مؤقت + `next_route = "otp"` → انتقل لصفحة OTP.
> -   إذا كان **OTP معطّلاً**: يُعاد توكن دائم + `next_route = "home"` → انتقل للشاشة الرئيسية مباشرة.

**Method:** `POST`  
**URL:** `/api/v1/auth/register`  
**Auth:** لا يلزم

---

### Request Body

#### الحالة 1: enable_multi_governorates = true (المحافظات مفعّلة)

المستخدم يختار محافظته يدوياً:

```json
{
    "name": "أحمد محمد",
    "phone": "781234567",
    "password": "password123",
    "governorate_id": 1
}
```

#### الحالة 2: enable_multi_governorates = false (محافظة واحدة افتراضية)

نفس الـ body، لكن أرسل `governorate_id` الافتراضي تلقائياً من `features.default_governorate_id`:

```json
{
    "name": "أحمد محمد",
    "phone": "781234567",
    "password": "password123",
    "governorate_id": 1
}
```

> **ملاحظة:** الـ API يقبل نفس الـ body في الحالتين. في الحالة الثانية أنت فقط تُرسل `governorate_id` بصمت دون إظهاره للمستخدم.

### قواعد الحقول:

| Field            | النوع   | الشرط                                        |
| ---------------- | ------- | -------------------------------------------- |
| `name`           | string  | مطلوب، 2-255 حرف                             |
| `phone`          | string  | مطلوب، 9 أرقام، يبدأ بـ 78/77/73/71          |
| `password`       | string  | مطلوب، 6-255 حرف                             |
| `governorate_id` | integer | مطلوب، يجب أن يكون موجوداً في قاعدة البيانات |

---

### رد ناجح — الحالة أ: OTP مفعّل (`enable_otp = true`)

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "Registration successful. Please verify your phone number.",
        "token": "3|temp_otp_verification_token_abc123xyz...",
        "expires_at": "2026-03-04 06:20:00",
        "next_route": "otp"
    }
}
```

> **next_route = "otp"** → انتقل فوراً لصفحة إدخال كود OTP.  
> **التوكن مؤقت** → صالح لفترة محدودة ويُستخدم فقط لـ:
>
> -   `POST /auth/verify-otp`
> -   `POST /auth/resend-otp`
>
> **لا** تستخدمه للوصول لأي endpoint أخرى.

---

### رد ناجح — الحالة ب: OTP معطّل (`enable_otp = false`)

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "Registration successful. Welcome to Daleel.",
        "token": "7|laravel_sanctum_full_auth_token_xyz789...",
        "expires_at": null,
        "next_route": "home"
    }
}
```

> **next_route = "home"** → انتقل مباشرة للشاشة الرئيسية.  
> **التوكن دائم** (`expires_at = null`) → يُستخدم لكل الـ endpoints المحمية.  
> لا حاجة لأي خطوة إضافية — المستخدم مسجّل دخوله.

---

### منطق التنقل بناءً على next_route

- إذا كان `data.next_route` يساوي `"otp"`:
  - احفظ التوكن المؤقت
  - انتقل لصفحة OTP

- إذا كان `data.next_route` يساوي `"home"`:
  - احفظ التوكن الدائم
  - انتقل للشاشة الرئيسية

---

### الأخطاء المتوقعة

#### 422 — رقم الهاتف مستخدم مسبقاً

```json
{
    "message": "The phone has already been taken.",
    "errors": {
        "phone": ["This phone number is already registered."]
    }
}
```

#### 422 — رقم الهاتف بصيغة خاطئة

```json
{
    "message": "The phone field format is invalid.",
    "errors": {
        "phone": [
            "Invalid phone number format. Must be 9 digits starting with 78, 77, 73, or 71."
        ]
    }
}
```

#### 422 — المحافظة غير موجودة

```json
{
    "message": "The selected governorate id is invalid.",
    "errors": {
        "governorate_id": ["Selected governorate does not exist."]
    }
}
```

#### 422 — حقول ناقصة

```json
{
    "message": "The name field is required.",
    "errors": {
        "name": ["Name is required."],
        "password": ["Password is required."]
    }
}
```

#### 429 — كثرة الطلبات (Too Many Requests)

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "errors": []
}
```

#### 503 — خطأ في إرسال OTP

يحدث عندما يكون OTP مفعّلاً لكن فشل إرساله عبر WhatsApp:

```json
{
    "success": false,
    "message": "Failed to send OTP. Please try again later.",
    "errors": {
        "code": "SERVICE_ERROR"
    }
}
```

> في هذه الحالة **لم يُنشأ المستخدم** — العملية بالكامل ملفوفة في transaction، فإذا فشل إرسال OTP يتم التراجع عن إنشاء المستخدم أيضاً. يمكنه المحاولة مرة أخرى.

#### 500 — خطأ عام في الخادم

```json
{
    "success": false,
    "message": "An unexpected error occurred. Please try again later.",
    "errors": []
}
```

---

---

# 3. POST /auth/verify-otp

> **الغرض:** التحقق من كود OTP المُرسَل عبر WhatsApp.  
> يُستخدم في حالتين:
>
> 1. بعد التسجيل (Register) → `next_route = "home"`
> 2. بعد نسيت كلمة المرور (Forget Password) → `next_route = "reset_password"`
>
> الـ API يُحدد الحالة تلقائياً بناءً على نوع التوكن المُرسَل.

**Method:** `POST`  
**URL:** `/api/v1/auth/verify-otp`  
**Auth:** `Bearer {OTP_TEMP_TOKEN}` ← **مطلوب التوكن المؤقت** (من Register أو Forget Password)

---

### Request Body

```json
{
    "code": "4839"
}
```

| Field  | النوع  | الشرط                 |
| ------ | ------ | --------------------- |
| `code` | string | مطلوب، 4 أرقام بالضبط |

---

### رد ناجح — الحالة أ: OTP جاء من Register

بعد تأكيد OTP التسجيل، يُعاد **توكن دائم** ومعلومات المستخدم، وينتقل للشاشة الرئيسية:

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "user": {
            "id": 42,
            "phone": "781234567",
            "name": "أحمد محمد",
            "governorate_id": 1,
            "is_active": true,
            "created_at": "2026-03-04 06:15:00",
            "updated_at": "2026-03-04 06:15:00"
        },
        "token": "8|laravel_sanctum_full_auth_token_abc123...",
        "roles": ["user"],
        "permissions": [],
        "next_route": "home"
    }
}
```

> **next_route = "home"** → احفظ التوكن الدائم وانتقل للشاشة الرئيسية.

---

### رد ناجح — الحالة ب: OTP جاء من Forget Password

بعد تأكيد OTP إعادة التعيين، يُعاد **توكن إعادة تعيين كلمة المرور**، وينتقل لصفحة إدخال كلمة مرور جديدة:

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "OTP verified successfully.",
        "token": "12|password_reset_token_def456...",
        "expires_at": "2026-03-04 07:00:00",
        "next_route": "reset_password"
    }
}
```

> **next_route = "reset_password"** → انتقل لصفحة إدخال كلمة المرور الجديدة.  
> **احفظ هذا التوكن** — ستحتاجه لـ `POST /auth/reset-password`.  
> هذا التوكن **مؤقت** ويُستخدم فقط لـ reset-password.

---

### منطق التنقل بناءً على next_route

- إذا كان `data.next_route` يساوي `"home"`:
  - توكن دائم — المستخدم سجّل دخوله
  - احفظ التوكن وانتقل للشاشة الرئيسية

- إذا كان `data.next_route` يساوي `"reset_password"`:
  - توكن مؤقت لإعادة تعيين كلمة المرور
  - احفظ التوكن وانتقل لصفحة إعادة التعيين

---

### الأخطاء المتوقعة

#### 401 — التوكن مفقود أو غير صالح

```json
{
    "success": false,
    "message": "Unauthorized. Please login to access this resource.",
    "errors": []
}
```

> إذا أرسلت طلباً بدون توكن أو بتوكن منتهي الصلاحية.

#### 422 — كود OTP خاطئ

```json
{
    "success": false,
    "message": "Invalid OTP code. 4 attempt(s) remaining.",
    "errors": {
        "code": "VALIDATION_ERROR"
    }
}
```

> العدد المتبقي من المحاولات يتناقص مع كل محاولة فاشلة. أظهر هذه الرسالة للمستخدم.

#### 422 — كود OTP منتهي الصلاحية أو لا يوجد OTP نشط

```json
{
    "success": false,
    "message": "Invalid or expired OTP code.",
    "errors": {
        "code": "VALIDATION_ERROR"
    }
}
```

> يحدث إذا انتهت صلاحية الكود (افتراضياً 5 دقائق) أو تم استخدامه مسبقاً. اطلب من المستخدم إعادة الإرسال.

#### 403 — الهاتف محظور مؤقتاً (كثرة المحاولات الخاطئة)

```json
{
    "success": false,
    "message": "Too many failed attempts. This phone number is temporarily blocked.",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

أو مع وقت الانتظار:

```json
{
    "success": false,
    "message": "This phone number is temporarily blocked. Please try again in 15 minute(s).",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

> بعد تجاوز الحد الأقصى للمحاولات (افتراضياً 5 محاولات)، يُحظر الهاتف لفترة مؤقتة (افتراضياً 15 دقيقة). أظهر رسالة واضحة ولا تسمح بإدخال كود جديد حتى انتهاء الوقت.

#### 422 — كود OTP تم استخدامه

```json
{
    "success": false,
    "message": "OTP has already been used. Please request a new one.",
    "errors": {
        "code": "VALIDATION_ERROR"
    }
}
```

#### 403 — الحساب موقوف

```json
{
    "success": false,
    "message": "Account is inactive or suspended.",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

#### 422 — صيغة الكود خاطئة (validation)

```json
{
    "message": "The code must be 4 digits.",
    "errors": {
        "code": ["OTP code must be exactly 4 digits."]
    }
}
```

#### 429 — كثرة الطلبات

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "errors": []
}
```

---

---

# 4. POST /auth/resend-otp

> **الغرض:** إعادة إرسال كود OTP جديد عبر WhatsApp.  
> يُستخدم عندما لم يصل الكود أو انتهت صلاحيته.

**Method:** `POST`  
**URL:** `/api/v1/auth/resend-otp`  
**Auth:** `Bearer {OTP_TEMP_TOKEN}` ← **مطلوب التوكن المؤقت** (نفس التوكن المُعاد من Register أو Forget Password)

**Request Body:** لا يوجد (الهاتف يُستخرج من التوكن تلقائياً)

---

### رد ناجح

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "OTP resent successfully."
    }
}
```

> يُرسَل كود جديد للهاتف المرتبط بالتوكن. نفس التوكن المؤقت لا يزال صالحاً.

---

### الأخطاء المتوقعة

#### 401 — التوكن مفقود أو غير صالح

```json
{
    "success": false,
    "message": "Unauthorized. Please login to access this resource.",
    "errors": []
}
```

#### 429 — كثرة طلبات إعادة الإرسال

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "errors": []
}
```

> يوجد حد معيّن لعدد مرات إعادة الإرسال في فترة زمنية محددة.

#### 503 — فشل إرسال OTP

```json
{
    "success": false,
    "message": "Failed to send OTP. Please try again later.",
    "errors": {
        "code": "SERVICE_ERROR"
    }
}
```

---

---

# 5. POST /auth/login

> **الغرض:** تسجيل دخول مستخدم موجود بالهاتف وكلمة المرور.  
> لا يتطلب OTP — يُعاد توكن دائم مباشرة.

**Method:** `POST`  
**URL:** `/api/v1/auth/login`  
**Auth:** لا يلزم

---

### Request Body

```json
{
    "phone": "781234567",
    "password": "password123"
}
```

| Field      | النوع  | الشرط                               |
| ---------- | ------ | ----------------------------------- |
| `phone`    | string | مطلوب، 9 أرقام، يبدأ بـ 78/77/73/71 |
| `password` | string | مطلوب، 6+ أحرف                      |

---

### رد ناجح

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "user": {
            "id": 42,
            "phone": "781234567",
            "name": "أحمد محمد",
            "governorate_id": 1,
            "is_active": true,
            "created_at": "2026-03-01 10:00:00",
            "updated_at": "2026-03-04 06:15:00"
        },
        "token": "15|laravel_sanctum_full_auth_token_ghj012...",
        "roles": ["user"],
        "permissions": []
    }
}
```

> **التوكن دائم** — لا `next_route` هنا لأن الوجهة هي الشاشة الرئيسية دائماً.  
> احفظ `token` واستخدمه في كل الطلبات اللاحقة.

---

### الأخطاء المتوقعة

#### 422 — صيغة بيانات خاطئة (Validation)

```json
{
    "message": "The phone field format is invalid.",
    "errors": {
        "phone": [
            "Invalid phone number format. Must be 9 digits starting with 78, 77, 73, or 71."
        ]
    }
}
```

#### 401 — بيانات خاطئة (هاتف أو كلمة مرور غير صحيحة)

```json
{
    "success": false,
    "message": "Invalid credentials.",
    "errors": {
        "code": "UNAUTHORIZED"
    }
}
```

> يُعاد نفس الرد سواء كان الهاتف غير مسجّل أو كلمة المرور خاطئة — لأسباب أمنية لا يُفصَّل السبب.

#### 403 — الحساب موقوف

```json
{
    "success": false,
    "message": "Account is inactive or suspended.",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

> أظهر رسالة واضحة للمستخدم بأن حسابه موقوف وعليه التواصل مع الدعم.

#### 429 — كثرة محاولات تسجيل الدخول

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "errors": []
}
```

---

---

# 6. POST /auth/forget-password

> **الغرض:** بدء عملية إعادة تعيين كلمة المرور.  
> يُرسَل كود OTP على الهاتف المُدخَل، ويُعاد توكن مؤقت لاستخدامه في `verify-otp`.

**Method:** `POST`  
**URL:** `/api/v1/auth/forget-password`  
**Auth:** لا يلزم

---

### Request Body

```json
{
    "phone": "781234567"
}
```

| Field   | النوع  | الشرط                                                     |
| ------- | ------ | --------------------------------------------------------- |
| `phone` | string | مطلوب، 9 أرقام، يبدأ بـ 78/77/73/71، ويجب أن يكون مسجّلاً |

---

### رد ناجح

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "OTP sent successfully.",
        "token": "18|temp_password_reset_otp_token_mno345...",
        "expires_at": "2026-03-04 06:35:00"
    }
}
```

> احفظ هذا **التوكن المؤقت** واستخدمه في `POST /auth/verify-otp`.  
> بعد verify-otp ستحصل على توكن إعادة تعيين كلمة المرور.

---

### خطوات نسيت كلمة المرور الكاملة:

```
1. POST /auth/forget-password  →  توكن OTP مؤقت
2. POST /auth/verify-otp       →  توكن إعادة التعيين (next_route = "reset_password")
3. POST /auth/reset-password   →  توكن دائم + انتقل للشاشة الرئيسية
```

---

### الأخطاء المتوقعة

#### 422 — رقم الهاتف غير مسجّل

```json
{
    "message": "The selected phone is invalid.",
    "errors": {
        "phone": ["This phone number is not registered."]
    }
}
```

#### 422 — صيغة رقم الهاتف خاطئة

```json
{
    "message": "The phone field format is invalid.",
    "errors": {
        "phone": [
            "Invalid phone number format. Must be 9 digits starting with 78, 77, 73, or 71."
        ]
    }
}
```

#### 403 — الحساب موقوف

```json
{
    "success": false,
    "message": "Account is inactive or suspended.",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

#### 403 — الهاتف محظور مؤقتاً

```json
{
    "success": false,
    "message": "This phone number is temporarily blocked. Please try again in 10 minute(s).",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

#### 429 — كثرة الطلبات

```json
{
    "success": false,
    "message": "Too many OTP requests. Please try again later.",
    "errors": {
        "code": "RATE_LIMITED"
    }
}
```

> يحدث عند إرسال طلبات كثيرة في فترة قصيرة. انتظر قبل المحاولة مرة أخرى.

#### 503 — فشل إرسال OTP

```json
{
    "success": false,
    "message": "Failed to send OTP. Please try again later.",
    "errors": {
        "code": "SERVICE_ERROR"
    }
}
```

---

---

# 7. POST /auth/reset-password

> **الغرض:** تعيين كلمة مرور جديدة بعد التحقق من OTP.  
> يُستخدم فقط بعد الحصول على توكن إعادة التعيين من `verify-otp`.

**Method:** `POST`  
**URL:** `/api/v1/auth/reset-password`  
**Auth:** `Bearer {PASSWORD_RESET_TOKEN}` ← **مطلوب توكن إعادة التعيين** (من verify-otp بحالة forget-password)

---

### Request Body

```json
{
    "password": "newPassword123"
}
```

| Field      | النوع  | الشرط            |
| ---------- | ------ | ---------------- |
| `password` | string | مطلوب، 6-255 حرف |

---

### رد ناجح

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "user": {
            "id": 42,
            "phone": "781234567",
            "name": "أحمد محمد",
            "governorate_id": 1,
            "is_active": true,
            "created_at": "2026-03-01 10:00:00",
            "updated_at": "2026-03-04 07:00:00"
        },
        "token": "21|laravel_sanctum_full_auth_token_pqr678...",
        "roles": ["user"],
        "permissions": []
    }
}
```

> **التوكن دائم** — المستخدم الآن مسجّل دخوله. احفظ التوكن وانتقل للشاشة الرئيسية.

---

### الأخطاء المتوقعة

#### 401 — التوكن مفقود أو غير صالح

```json
{
    "success": false,
    "message": "Unauthorized. Valid password reset token required.",
    "errors": {
        "code": "UNAUTHORIZED"
    }
}
```

أو من الـ middleware:

```json
{
    "success": false,
    "message": "Unauthorized. Please login to access this resource.",
    "errors": []
}
```

#### 403 — التوكن لا يملك صلاحية إعادة التعيين

```json
{
    "success": false,
    "message": "Forbidden. Token does not have password reset permission.",
    "errors": {
        "code": "FORBIDDEN"
    }
}
```

> يحدث إذا أرسلت توكن OTP مؤقتاً (من Register) بدلاً من توكن إعادة التعيين.

#### 422 — كلمة المرور قصيرة جداً

```json
{
    "message": "The password field must be at least 6 characters.",
    "errors": {
        "password": ["Password must be at least 6 characters."]
    }
}
```

#### 503 — خطأ في تحديث كلمة المرور

```json
{
    "success": false,
    "message": "Failed to reset password. Please try again later.",
    "errors": {
        "code": "SERVICE_ERROR"
    }
}
```

---

---

# 8. POST /auth/change-password

> **الغرض:** تغيير كلمة المرور للمستخدم المسجّل دخوله.  
> يتطلب إدخال كلمة المرور الحالية.

**Method:** `POST`  
**URL:** `/api/v1/auth/change-password`  
**Auth:** `Bearer {FULL_AUTH_TOKEN}` ← **توكن دائم مطلوب**

---

### Request Body

```json
{
    "current_password": "oldPassword123",
    "new_password": "newSecurePassword456"
}
```

| Field              | النوع  | الشرط            |
| ------------------ | ------ | ---------------- |
| `current_password` | string | مطلوب، 6+ أحرف   |
| `new_password`     | string | مطلوب، 6-255 حرف |

---

### رد ناجح

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "message": "Password changed successfully."
    }
}
```

> التوكن الحالي لا يزال صالحاً بعد تغيير كلمة المرور.

---

### الأخطاء المتوقعة

#### 401 — غير مسجّل دخوله

```json
{
    "success": false,
    "message": "Unauthorized. Please login to access this resource.",
    "errors": []
}
```

#### 422 — كلمة المرور الحالية خاطئة

```json
{
    "success": false,
    "message": "Current password is incorrect.",
    "errors": {
        "code": "VALIDATION_ERROR"
    }
}
```

#### 422 — بيانات خاطئة

```json
{
    "message": "The new password field must be at least 6 characters.",
    "errors": {
        "new_password": ["New password must be at least 6 characters."]
    }
}
```

#### 429 — كثرة الطلبات

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "errors": []
}
```

---

---

# 9. POST /auth/logout

> **الغرض:** تسجيل الخروج وإلغاء التوكن الحالي.

**Method:** `POST`  
**URL:** `/api/v1/auth/logout`  
**Auth:** `Bearer {FULL_AUTH_TOKEN}` ← **توكن دائم مطلوب**  
**Request Body:** لا يوجد

---

### رد ناجح

```json
{
    "success": true,
    "message": "Logged out successfully."
}
```

> بعد تسجيل الخروج، احذف التوكن المحلي وانتقل لصفحة تسجيل الدخول.

---

### الأخطاء المتوقعة

#### 401 — غير مسجّل دخوله

```json
{
    "success": false,
    "message": "Unauthorized. Please login to access this resource.",
    "errors": []
}
```

---

---

## ملخص جميع الـ Endpoints

| #   | Method | URL                     | Auth           | الغرض                      |
| --- | ------ | ----------------------- | -------------- | -------------------------- |
| 1   | GET    | `/settings/app`         | لا             | إعدادات التطبيق والمحافظات |
| 2   | POST   | `/auth/register`        | لا             | تسجيل مستخدم جديد          |
| 3   | POST   | `/auth/verify-otp`      | OTP Temp       | التحقق من كود OTP          |
| 4   | POST   | `/auth/resend-otp`      | OTP Temp       | إعادة إرسال كود OTP        |
| 5   | POST   | `/auth/login`           | لا             | تسجيل الدخول               |
| 6   | POST   | `/auth/forget-password` | لا             | نسيت كلمة المرور           |
| 7   | POST   | `/auth/reset-password`  | Reset Token    | تعيين كلمة مرور جديدة      |
| 8   | POST   | `/auth/change-password` | Full Auth      | تغيير كلمة المرور          |
| 9   | POST   | `/auth/logout`          | Full Auth      | تسجيل الخروج               |

---

## ملخص أكواد HTTP

| Code  | المعنى العام                               |
| ----- | ------------------------------------------ |
| `200` | نجح الطلب                                  |
| `401` | غير مصرّح — التوكن مفقود أو منتهي الصلاحية |
| `403` | ممنوع — الحساب موقوف أو هاتف محظور         |
| `422` | خطأ في البيانات المُرسَلة                  |
| `429` | كثرة الطلبات — انتظر قبل المحاولة          |
| `503` | خطأ في خدمة خارجية (مثل إرسال WhatsApp)    |
| `500` | خطأ داخلي في الخادم                        |
