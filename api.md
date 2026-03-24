# مستندات واجهة برمجة التطبيقات للمستخدم النهائي (End-User API Documentation)

الرابط الأساسي (Base URL): `/api/v1`

---

## 🔒 المصادقة والحسابات (Authentication & Accounts)

### مسارات عامة (Public Endpoints)
| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `POST` | `/register` | إنشاء حساب مستخدم جديد |
| `POST` | `/login` | تسجيل الدخول والحصول على التوكن |
| `POST` | `/otp/request` | طلب رمز التحقق (OTP) |
| `POST` | `/otp/verify` | التحقق من صحة رمز الـ OTP |
| `POST` | `/password/forgot` | طلب استعادة كلمة المرور |
| `POST` | `/password/reset` | إعادة تعيين كلمة المرور |

### مسارات محمية (Protected Endpoints - يتطلب التوكن)
| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/me` | جلب بيانات المستخدم الحالي |
| `POST` | `/refresh` | تجديد التوكن الحالي |
| `POST` | `/logout` | تسجيل الخروج وإبطال التوكن |
| `GET` | `/profile` | عرض تفاصيل الحساب الشخصي |
| `POST` | `/profile/update` | تحديث بيانات الحساب الشخصي |
| `POST` | `/profile/avatar` | رفع/تحديث الصورة الشخصية |
| `POST` | `/profile/token` | تحديث Device Token للإشعارات |
| `DELETE` | `/profile/delete` | حذف حساب المستخدم |

---

## 📢 الإعلانات (Ads)

### مسارات عامة (Public Endpoints)
| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/ads` | جلب قائمة الإعلانات المتاحة |
| `GET` | `/ads/{id}` | جلب تفاصيل إعلان محدد |

### مسارات محمية (Protected Endpoints - للمعلن)
| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `POST` | `/ads` | إضافة إعلان جديد |
| `PUT` | `/ads/{id}` | تحديث الإعلان الخاص بالمستخدم |
| `DELETE` | `/ads/{id}` | حذف الإعلان بشكل ناعم (Soft Delete) |
| `POST` | `/ads/{id}/renew` | تجديد مدة الإعلان |
| `POST` | `/ads/{id}/restore` | استعادة الإعلان المحذوف من سلة المهملات |

---

## 💬 المحادثات (Chat)
*جميع مسارات المحادثة تتطلب التوكن (Protected)*

| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/chats` | جلب قائمة محادثات المستخدم |
| `POST` | `/chat/start` | بدء أو استرجاع محادثة مع مستخدم آخر |
| `POST` | `/chat/send` | إرسال رسالة نصية في محادثة |
| `GET` | `/chats/{id}/messages` | جلب جميع رسائل محادثة معينة |

---

## 💳 المدفوعات والاشتراكات (Payments)
*تتطلب التوكن (Protected)*

| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/payments` | جلب قائمة مدفوعات واشتراكات المستخدم |
| `POST` | `/payments/request` | طلب اشتراك للوكالات والمعارض ورفع إيصال الدفع |

---

## 💬 التعليقات والتقييمات (Comments & Ratings)
*تتطلب التوكن (Protected)*

| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `POST` | `/comments` | إضافة تعليق على إعلان |
| `DELETE` | `/comments/{id}` | أرشفة التعليق (Soft Delete) بواسطة صاحب الإعلان/التعليق |
| `POST` | `/ratings` | تقييم مستخدم آخر بناءً على تعامل سابق |

---

## ⭐ المفضلة (Favorites)
*تتطلب التوكن (Protected)*

| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/favorites` | جلب قائمة الإعلانات المفضلة للمستخدم |
| `POST` | `/favorites/toggle` | إضافة/إزالة إعلان من المفضلة |

---

## 🛑 الحظر والتواصل (Blocking & Contact)
*تتطلب التوكن (Protected)*

| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `POST` | `/block/toggle` | حظر أو فك حظر مستخدم آخر (لمنع الرسائل والتعامل المستقبلي) |
| `POST` | `/contact` | إرسال رسالة "اتصل بنا" إلى إدارة المنصة |

---

## ⚙️ الإعدادات والأقسام (Categories & Settings)

### مسارات عامة (Public Endpoints)
| الطريقة (Method) | المسار (Endpoint) | الوصف (Description) |
| :--- | :--- | :--- |
| `GET` | `/categories` | جلب قائمة الأقسام والتصنيفات في التطبيق |
| `GET` | `/settings` | جلب إعدادات ومتغيرات النظام العامة (معلومات تواصل، روابط، إلخ) |
