# مستندات واجهة برمجة تطبيقات المدفوعات والاشتراكات (Payments & Subscriptions API)

الرابط الأساسي (Base URL): `/api/v1/payments`

هذا الملف يوضح مسارات (Endpoints) الخاصة بنظام المدفوعات، والذي يسمح للمستخدم بطلب اشتراك عن طريق رفع صورة إيصال التحويل البنكي، بالإضافة إلى عرض سجل مدفوعاته السابقة.

جميع المسارات أدناه **محمية (Protected)** وتتطلب إرسال التوكن (Bearer Token) في الترويسة (Headers).

---

## 1. طلب اشتراك جديد (Request Subscription Payment)
يستخدم هذا المسار لرفع صورة إيصال التحويل البنكي لطلب تفعيل تفضيلات الاشتراك بناءً على عدد الأشهر المطلوبة. يظل الطلب معلقاً (Pending) حتى يقوم مسؤول النظام (Admin) بالموافقة عليه أو رفضه.
> **ملاحظة:** يجب إرسال الطلب بصيغة `multipart/form-data` بسبب وجود ملف صورة الإيصال.

- **المسار:** `POST /payments/request`
- **الحماية:** محمي (Protected)

### البيانات المطلوبة (Request Body - `multipart/form-data`)
| الحقل | التنسيق | الوصف | قواعد التحقق (Validation) |
| :--- | :--- | :--- | :--- |
| `amount` | رقم (Numeric) | قيمة التحويل المالي الموجودة في الإيصال | مطلوب |
| `months` | رقم صحيح (Integer) | مدة الاشتراك المطلوبة بالأشهر | مطلوب (يجب أن يكون أحد القيم: `1`, `3`, `6`, `12`) |
| `receipt_image` | ملف (File) | صورة إيصال التحويل البنكي | مطلوب (صورة `jpeg, png, jpg`، الحجم الأقصى 4 ميجابايت) |

### الاستجابة الناجحة (Success Response - 201 Created)
```json
{
  "success": true,
  "message": "payment_request_submitted",
  "data": null
}
```

### استجابات الخطأ المحتملة (Error Responses)
- **422 Unprocessable Entity:** في حال كان هناك نقص في المدخلات أو صيغة الصورة غير مدعومة أو حجمها أكبر من 4 ميجابايت.

---

## 2. سجل المدفوعات الخاص بي (My Payments)
إرجاع قائمة بجميع طلبات الدفع والاشتراكات السابقة التي قام بها المستخدم للاطلاع على حالتها (معلق، مقبول، مرفوض).

- **المسار:** `GET /payments`
- **الحماية:** محمي (Protected)

### ميزات الاستجابة:
- القائمة مرتبة تنازلياً (الأحدث أولاً).
- تدعم تقسيم الصفحات (Paginated) بمعدل 15 عنصراً في كل صفحة (أضف `?page=2` في الرابط للصفحة التالية).

### الاستجابة الناجحة (Paginated Response - 200 OK)
```json
{
  "success": true,
  "message": "data_retrieved",
  "data": [
    {
      "id": 1,
      "user_id": 10,
      "amount": "150.00",
      "months": 3,
      "type": "subscription",
      "status": "pending", 
      "receipt_image": "payments/jXk8Z...jpg",
      "created_at": "2026-03-01T10:00:00.000000Z",
      "updated_at": "2026-03-01T10:00:00.000000Z"
    },
    {
      "id": 2,
      "user_id": 10,
      "amount": "500.00",
      "months": 12,
      "type": "subscription",
      "status": "approved", // يمكن أن تكون: pending, approved, rejected
      "receipt_image": "payments/abc12...png",
      "created_at": "2025-02-15T08:30:00.000000Z",
      "updated_at": "2025-02-16T09:00:00.000000Z"
    }
  ],
  "links": {
    "first": "http://haraj-maareb.test/api/v1/payments?page=1",
    "last": "http://haraj-maareb.test/api/v1/payments?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 2
  }
}
```
> **ملاحظة للواجهة الأمامية (Frontend):** يمكن الاستفادة من حقل `status` لتلوين حالة الطلب (مثال: برتقالي لـ `pending`، أخضر لـ `approved`، وأحمر لـ `rejected`). ولعرض صورة الإيصال يتم إضافة المسار الأساسي `http://haraj-maareb.test/storage/` قبل قيمة `receipt_image`.
