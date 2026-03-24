# مستندات واجهة برمجة تطبيقات الإشعارات (Notifications API)

الرابط الأساسي (Base URL): `/api/v1/notifications`

هذا الملف يوضح التفاصيل الخاصة بمسارات (Endpoints) نظام الإشعارات. يُمكّن هذا النظام المستخدمين من جلب الإشعارات الواردة، معرفة عدد الإشعارات غير المقروءة، وتحديد الإشعارات كـ "مقروءة".

جميع المسارات أدناه **محمية (Protected)** وتتطلب إرسال التوكن (Bearer Token) في الترويسة (Headers).

---

## 1. قائمة الإشعارات (Get Notifications)
جلب قائمة الإشعارات الخاصة بالمستخدم الحالي. القائمة مقسمة لصفحات (Paginated) ومرتبة تنازلياً (الأحدث أولاً). يُمكِن دعم فلترة الإشعارات غير المقروءة فقط بإضافة مُعامل في الرابط (Query Parameter).

- **المسار:** `GET /notifications`
- **الحماية:** محمي (Protected)

### المُعاملات (Query Parameters) الاختيارية
| المُعامل | الوصف |
| :--- | :--- |
| `unread_only` | مرّر قيمة `1` أو `true` لجلب الإشعارات غير المقروءة فقط |
| `page` | رقم الصفحة (للتقسيم Pagination) |

### الاستجابة الناجحة (Paginated Response - 200 OK)
```json
{
  "success": true,
  "message": "data_retrieved",
  "data": [
    {
      "id": "e9b7f5e8-5b3a-4b6e-8d2a-1f8c4e6a7d9b",
      "type": "App\\Notifications\\NewAdNotification",
      "notifiable_type": "App\\Models\\User",
      "notifiable_id": 10,
      "data": {
        "title": "إعلان جديد توافق مع اهتماماتك",
        "message": "تم نشر إعلان سيارة تويوتا كامري 2020",
        "ad_id": 150
      },
      "read_at": null, // إذا كانت null، فهذا يعني أن الإشعار غير مقروء
      "created_at": "2026-03-01T10:00:00.000000Z",
      "updated_at": "2026-03-01T10:00:00.000000Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      ...
      "read_at": "2026-03-01T10:15:00.000000Z", // إشعار مقروء
      ...
    }
  ],
  "links": { ... },
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 100
  }
}
```

---

## 2. عدد الإشعارات غير المقروءة (Unread Count)
معرفة عدد الإشعارات التي لم يتم قراءتها بَعد (مفيد لعرض الـ Badge فوق أيقونة الجرس).

- **المسار:** `GET /notifications/unread-count`
- **الحماية:** محمي (Protected)

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "data_retrieved",
  "data": {
    "count": 5
  }
}
```

---

## 3. تحديد إشعار كمقروء (Mark Notification as Read)
يقوم بتحديث حالة إشعار مُعين من قِبل معرّفه (`id`) ليصبح "مقروء".

- **المسار:** `POST /notifications/{id}/read`
- **المتغيرات (URL Params):** `id` (معرف الإشعار من نوع UUID كما يظهر في قائمة الإشعارات)
- **الحماية:** محمي (Protected)

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "notification_marked_as_read",
  "data": null
}
```

### استجابات الخطأ (Error Responses)
- **404 Not Found:** `notification_not_found` (إذا كان الإشعار غير موجود أو لا يخص المستخدم).

---

## 4. تحديد كل الإشعارات كمقروءة (Mark All as Read)
يقوم بتحديث جميع إشعارات المستخدم الحالية غير المقروءة لتُصبح "مقروءة" دفعة واحدة.

- **المسار:** `POST /notifications/read-all`
- **الحماية:** محمي (Protected)

### الاستجابة الناجحة (Success Response - 200 OK)
```json
{
  "success": true,
  "message": "all_notifications_marked_as_read",
  "data": null
}
```
