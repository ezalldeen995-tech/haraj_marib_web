# مستندات واجهة برمجة تطبيقات الحساب الشخصي (Profile API)

الرابط الأساسي (Base URL): `/api/v1/profile`

هذا الملف يوضح بالتفصيل مسارات (Endpoints) الخاصة بإدارة الحساب الشخصي للمستخدم، كعرض بيانات الحساب، تعديل المعلومات الأساسية، تغيير الصورة الشخصية، تحديث توكن الإشعارات، وحذف الحساب.

جميع المسارات أدناه **محمية (Protected)** وتتطلب إرسال التوكن (Bearer Token) في الترويسة (Headers).
جميع المسارات ترجع استجابة بصيغة `JSON`، ماعدا المسارات التي تتطلب رفع صور (`multipart/form-data`).

---

## 1. عرض بيانات الحساب (Get Profile)
إرجاع بيانات المستخدم الحالي مع عدد إعلاناته النشطة ومتوسط تقييماته.

- **المسار:** `GET /profile`
- **الحماية:** محمي (Protected)

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "data_retrieved",
  "data": {
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "phone": "967771234567",
      "email": "ahmed@example.com",
      "avatar": "http://haraj-maareb.test/storage/avatars/default.png",
      "role": "user",
      "created_at": "2026-03-01T10:00:00.000000Z"
    },
    "active_ads_count": 5,
    "rating_avg": 4.5
  }
}
```

---

## 2. تحديث بيانات الحساب (Update Profile)
تعديل المعلومات الأساسية للمستخدم (الاسم والبريد الإلكتروني). لا يمكن تعديل رقم الهاتف من هنا.

- **المسار:** `POST /profile/update`
- **الحماية:** محمي (Protected)

### البيانات المطلوبة (Request Body - JSON)
| الحقل | الوصف | قواعد التحقق (Validation) |
| :--- | :--- | :--- |
| `name` | اسم المستخدم | اختياري (نص) |
| `email` | البريد الإلكتروني | اختياري (يجب أن يكون بريداً صالحاً غير مستخدم مسبقاً) |

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "profile_updated",
  "data": { ... } // بيانات المستخدم بعد التحديث
}
```

---

## 3. تعديل الصورة الشخصية (Update Avatar)
تحديث الصورة الرمزية (Avatar) للمستخدم الحالي. يقوم هذا المسار بحذف الصورة القديمة (إن وجدت ولم تكن الصورة الافتراضية) وحفظ الجديدة.
> **ملاحظة:** يجب إرسال الطلب بصيغة `multipart/form-data`.

- **المسار:** `POST /profile/avatar`
- **الحماية:** محمي (Protected)

### البيانات المطلوبة (Request Body - `multipart/form-data`)
| الحقل | الوصف | قواعد التحقق (Validation) |
| :--- | :--- | :--- |
| `avatar` | الصورة الشخصية | مطلوب (ملف صورة jpeg, png، كحد أقصى 2 ميجا) |

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "avatar_updated",
  "data": {
    "avatar": "/storage/avatars/new_image_name.jpg"
  }
}
```

---

## 4. تحديث توكن الإشعارات (Update Device Token)
تحديث رمز الجهاز (Device Token) الخاص بخدمة Firebase Cloud Messaging (FCM) لاستقبال إشعارات الدفع (Push Notifications).

- **المسار:** `POST /profile/token`
- **الحماية:** محمي (Protected)

### البيانات المطلوبة (Request Body - JSON)
| الحقل | الوصف | قواعد التحقق (Validation) |
| :--- | :--- | :--- |
| `device_token` | رمز الجهاز القادم من FCM | مطلوب (نص) |

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "device_token_updated",
  "data": null
}
```

---

## 5. حذف الحساب (Delete Account)
حذف أو إيقاف حساب المستخدم الحالي. (سيؤدي لتسجيل الخروج تلقائياً بالنسبة للواجهة الأمامية).

- **المسار:** `DELETE /profile/delete`
- **الحماية:** محمي (Protected)

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "account_deleted",
  "data": null
}
```
