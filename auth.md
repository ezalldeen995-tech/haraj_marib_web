# مستندات واجهة برمجة تطبيقات المصادقة (Authentication API)

الرابط الأساسي (Base URL): `/api/v1`

هذا الملف يوضح بالتفصيل مسارات (Endpoints) الخاصة بعمليات تسجيل الدخول، التسجيل، وطلب/التحقق من رمز OTP، واستعادة كلمة المرور المذكورة مسبقاً في `api.md`.

جميع المسارات أدناه تستقبل وترجع استجابة بصيغة `JSON`.

---

## 1. تسجيل حساب جديد (Register)
إنشاء حساب للمستخدم. بعد نجاح التسجيل، يتم إرسال كود OTP تلقائياً إلى رقم الجوال ليقوم المستخدم بتأكيده لاحقاً.

- **المسار:** `POST /register`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "name": "أحمد محمد",
  "phone": "771234567",
  "password": "password123"
}
```

### الاستجابة الناجحة (Success Response - 201 Created)
```json
{
  "success": true,
  "message": "register_success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJ..."
  }
}
```

---

## 2. تسجيل الدخول (Login)
تسجيل الدخول للمستخدم عبر رقم الجوال وكلمة المرور للحصول على التوكن.

- **المسار:** `POST /login`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "phone": "771234567",
  "password": "password123"
}
```

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "login_success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJ..."
  }
}
```

### الاستجابة في حال الخطأ (Error Response - 401 Unauthorized)
```json
{
  "success": false,
  "message": "login_failed"
}
```

---

## 3. طلب كود التفعيل (Request OTP)
يستخدم لطلب إعادة إرسال كود التفعيل إلى الجوال.

- **المسار:** `POST /otp/request`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "phone": "771234567"
}
```

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "otp_sent",
  "data": null
}
```

---

## 4. تأكيد كود التفعيل (Verify OTP)
يستخدم للتحقق من كود الـ OTP الذي وصل لجوال المستخدم.

- **المسار:** `POST /otp/verify`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "phone": "771234567",
  "code": "1234"
}
```

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "phone_verified",
  "data": null
}
```

---

## 5. نسيت كلمة المرور (Forgot Password)
طلب كود OTP إلى رقم الجوال بهدف إعادة تعيين كلمة المرور.

- **المسار:** `POST /password/forgot`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "phone": "771234567"
}
```

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "otp_sent",
  "data": null
}
```

---

## 6. إعادة تعيين كلمة المرور (Reset Password)
تغيير كلمة المرور باستخدام كود الـ OTP الذي تم إرساله مسبقاً في خطوة `forgot`.

- **المسار:** `POST /password/reset`
- **الحماية:** مسار عام (Public)

### البيانات المطلوبة (Request Body)
```json
{
  "phone": "771234567",
  "otp": "1234",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "password_reset_success",
  "data": null
}
```

---

## مسارات معلومات المستخدم وتجديد الجلسة (Protected Endpoints)
جميع المسارات التالية تتطلب إرسال التوكن في الـ Header (Bearer Token).

### 7. جلب بيانات المستخدم الحالي (Get Me)
- **المسار:** `GET /me`
- **الاستجابة:** تُرجع تفاصيل الحساب الحالي للمستخدم (الاسم، الجوال، الإيميل، الحالة، إلخ).

### 8. تجديد التوكن (Refresh Token)
- **المسار:** `POST /refresh`
- **الاستجابة:** تُرجع توكن جديد لاستخدامه في الطلبات القادمة (مفيد إذا كان التوكن القديم قارب على الانتهاء).

### 9. تسجيل الخروج (Logout)
- **المسار:** `POST /logout`
- **الاستجابة:** تبطل التوكن الحالي للمستخدم بشكل نهائي وتنهي الجلسة.
