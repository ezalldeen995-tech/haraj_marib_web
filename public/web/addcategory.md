# إدارة الأقسام (Categories) — دليل مطور الأدمن

> **Base URL:** `/api/v1/admin`  
> **Content-Type:** `multipart/form-data` (لإنشاء وتعديل الأقسام مع أيقونات)  
> **Accept:** `application/json`

---

## نظرة عامة على إدارة الأقسام

تسمح هذه النقاط البرمجية لمدراء النظام بالتحكم الكامل في الأقسام (الأصناف) التي تظهر للمستخدمين في التطبيق والموقع. تشمل العمليات جلب القائمة، إضافة قسم جديد، تعديله، وحذفه.

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

### خطأ Validation (422)

```json
{
    "message": "The name_ar field is required.",
    "errors": {
        "name_ar": ["The name_ar field is required."]
    }
}
```

---

# 1. GET /admin/categories

> **الغرض:** جلب قائمة بجميع الأقسام للنظام الإداري.

**Method:** `GET`  
**URL:** `/api/v1/admin/categories`  
**Auth:** يلزم توكن أدمن (`Bearer {ADMIN_TOKEN}`)

### رد ناجح

```json
{
    "success": true,
    "message": "data_retrieved",
    "data": [
        {
            "id": 1,
            "name_ar": "عقارات",
            "name_en": "Real Estate",
            "icon": "categories/real_estate.png",
            "parent_id": null,
            "is_active": 1,
            "created_at": "2026-03-06T01:09:17",
            "updated_at": "2026-04-15T19:50:00"
        }
    ]
}
```

---

# 2. POST /admin/categories

> **الغرض:** إضافة قسم جديد للنظام.  
> **ملاحظة:** يجب استخدامه مع `multipart/form-data` عند رفع أيقونة.

**Method:** `POST`  
**URL:** `/api/v1/admin/categories`  
**Auth:** يلزم توكن أدمن (`Bearer {ADMIN_TOKEN}`)

### Request Body (FormData)

| الحقل      | النوع  | الشرط                 | الوصف                     |
| ---------- | ------ | --------------------- | ------------------------- |
| `name_ar`  | string | مطلوب                 | اسم القسم باللغة العربية  |
| `name_en`  | string | مطلوب                 | اسم القسم باللغة الإنجليزية |
| `icon`     | file   | اختياري (image)       | ملف صورة الأيقونة         |
| `is_active`| bool   | اختياري (default: 1)  | حالة القسم (نشط/غير نشط)  |

---

# 3. PUT /admin/categories/{id}

> **الغرض:** تعديل بيانات قسم موجود.  
> **ملاحظة:** بما أن Laravel لا يدعم `PUT` مع `FormData` لرفع الملفات، يجب إرسال الطلب كـ `POST` مع إضافة حقل `_method = PUT`.

**Method:** `POST` (مع `_method=PUT`)  
**URL:** `/api/v1/admin/categories/{id}`  
**Auth:** يلزم توكن أدمن (`Bearer {ADMIN_TOKEN}`)

### Request Body (FormData)

نفس حقول الـ POST، مع إمكانية إرسال الحقول المراد تعديلها فقط.

---

# 4. DELETE /admin/categories/{id}

> **الغرض:** حذف قسم من النظام نهائياً.  
> **تحذير:** حذف القسم سيؤدي إلى حذف الأيقونة المرتبطة به من الخادم.

**Method:** `DELETE`  
**URL:** `/api/v1/admin/categories/{id}`  
**Auth:** يلزم توكن أدمن (`Bearer {ADMIN_TOKEN}`)

### رد ناجح

```json
{
    "success": true,
    "message": "category_deleted",
    "data": null
}
```

---

## معالجة التخزين المؤقت (Cache)

- عند إجراء أي عملية (إضافة، تعديل، حذف)، يقوم النظام تلقائياً بمسح التخزين المؤقت للأقسام (`Cache::forget('categories')`).
- هذا يضمن أن المستخدمين سيشاهدون التحديثات فوراً في التطبيق والموقع دون الحاجة للانتظار.

---

## الأخطاء المتوقعة

| Status | الوصف                       | السبب المحتمل                               |
| ------ | --------------------------- | ------------------------------------------- |
| 401    | Unauthorized                | التوكن مفقود أو غير صحيح                     |
| 403    | Forbidden                   | المستخدم لا يملك صلاحيات أدمن               |
| 422    | Unprocessable Entity         | خطأ في التحقق من البيانات (Validation)      |
| 404    | Not Found                   | القسم غير موجود                             |
