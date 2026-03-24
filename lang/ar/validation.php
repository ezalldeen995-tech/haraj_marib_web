<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted'             => 'يجب قبول حقل :attribute.',
    'active_url'           => 'حقل :attribute ليس رابطاً صحيحاً.',
    'after'                => 'يجب أن يكون حقل :attribute تاريخاً لاحقاً لتاريخ :date.',
    'after_or_equal'       => 'يجب أن يكون حقل :attribute تاريخاً لاحقاً أو مطابقاً لتاريخ :date.',
    'alpha'                => 'يجب أن يحتوي حقل :attribute على أحرف فقط.',
    'alpha_dash'           => 'يجب أن يحتوي حقل :attribute على أحرف وأرقام وشرطات فقط.',
    'alpha_num'            => 'يجب أن يحتوي حقل :attribute على أحرف وأرقام فقط.',
    'array'                => 'يجب أن يكون حقل :attribute مصفوفة.',
    'before'               => 'يجب أن يكون حقل :attribute تاريخاً سابقاً لتاريخ :date.',
    'before_or_equal'      => 'يجب أن يكون حقل :attribute تاريخاً سابقاً أو مطابقاً لتاريخ :date.',
    'between'              => [
        'numeric' => 'يجب أن تكون قيمة :attribute بين :min و :max.',
        'file'    => 'يجب أن يكون حجم حقل :attribute بين :min و :max كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute بين :min و :max حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على عدد من العناصر بين :min و :max.',
    ],
    'boolean'              => 'يجب أن يكون حقل :attribute صحيحة (true) أو خاطئة (false).',
    'confirmed'            => 'تأكيد حقل :attribute غير مطابق.',
    'date'                 => 'حقل :attribute ليس تاريخاً صحيحاً.',
    'date_equals'          => 'يجب أن يكون حقل :attribute تاريخاً مطابقاً لتاريخ :date.',
    'date_format'          => 'حقل :attribute لا يتوافق مع الصيغة :format.',
    'different'            => 'يجب أن يكون حقل :attribute و :other مختلفين.',
    'digits'               => 'يجب أن يحتوي حقل :attribute على :digits أرقام.',
    'digits_between'       => 'يجب أن يحتوي حقل :attribute على عدد من الأرقام بين :min و :max.',
    'dimensions'           => 'حقل :attribute يحتوي على أبعاد صورة غير صالحة.',
    'distinct'             => 'حقل :attribute يحتوي على قيمة مكررة.',
    'email'                => 'يجب أن يكون حقل :attribute عنوان بريد إلكتروني صحيح.',
    'ends_with'            => 'يجب أن ينتهي حقل :attribute بأحد القيم التالية: :values',
    'exists'               => 'حقل :attribute المحدد غير صالح.',
    'file'                 => 'يجب أن يكون حقل :attribute ملفاً.',
    'filled'               => 'حقل :attribute إجباري.',
    'gt'                   => [
        'numeric' => 'يجب أن تكون قيمة :attribute أكبر من :value.',
        'file'    => 'يجب أن يكون حجم حقل :attribute أكبر من :value كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute أكبر من :value حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على أكثر من :value عناصر.',
    ],
    'gte'                  => [
        'numeric' => 'يجب أن تكون قيمة :attribute أكبر من أو تساوي :value.',
        'file'    => 'يجب أن يكون حجم حقل :attribute أكبر من أو يساوي :value كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute أكبر من أو يساوي :value حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على :value عناصر أو أكثر.',
    ],
    'image'                => 'يجب أن يكون حقل :attribute صورة.',
    'in'                   => 'حقل :attribute المحدد غير صالح.',
    'in_array'             => 'حقل :attribute غير موجود في :other.',
    'integer'              => 'يجب أن يكون حقل :attribute عدداً صحيحاً.',
    'ip'                   => 'يجب أن يكون حقل :attribute عنوان IP صحيحاً.',
    'ipv4'                 => 'يجب أن يكون حقل :attribute عنوان IPv4 صحيحاً.',
    'ipv6'                 => 'يجب أن يكون حقل :attribute عنوان IPv6 صحيحاً.',
    'json'                 => 'يجب أن يكون حقل :attribute نصاً من نوع JSON صحيحاً.',
    'lt'                   => [
        'numeric' => 'يجب أن تكون قيمة :attribute أصغر من :value.',
        'file'    => 'يجب أن يكون حجم حقل :attribute أصغر من :value كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute أصغر من :value حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على أقل من :value عناصر.',
    ],
    'lte'                  => [
        'numeric' => 'يجب أن تكون قيمة :attribute أصغر من أو تساوي :value.',
        'file'    => 'يجب أن يكون حجم حقل :attribute أصغر من أو يساوي :value كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute أصغر من أو يساوي :value حروف.',
        'array'   => 'يجب أن لا يحتوي حقل :attribute على أكثر من :value عناصر.',
    ],
    'max'                  => [
        'numeric' => 'يجب ألا تتجاوز قيمة :attribute :max.',
        'file'    => 'يجب ألا يتجاوز حجم حقل :attribute :max كيلوبايت.',
        'string'  => 'يجب ألا يتجاوز طول حقل :attribute :max حروف.',
        'array'   => 'يجب ألا يحتوي حقل :attribute على أكثر من :max عناصر.',
    ],
    'mimes'                => 'يجب أن يكون حقل :attribute ملفاً من نوع: :values.',
    'mimetypes'            => 'يجب أن يكون حقل :attribute ملفاً من نوع: :values.',
    'min'                  => [
        'numeric' => 'يجب أن تكون قيمة :attribute على الأقل :min.',
        'file'    => 'يجب أن يكون حجم حقل :attribute على الأقل :min كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute على الأقل :min حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على الأقل :min عناصر.',
    ],
    'not_in'               => 'حقل :attribute المحدد غير صالح.',
    'not_regex'            => 'صيغة حقل :attribute غير صالحة.',
    'numeric'              => 'يجب أن يكون حقل :attribute رقماً.',
    'password'             => 'كلمة المرور غير صحيحة.',
    'present'              => 'يجب تقديم حقل :attribute.',
    'regex'                => 'صيغة حقل :attribute غير صالحة.',
    'required'             => 'حقل :attribute مطلوب.',
    'required_if'          => 'حقل :attribute مطلوب عندما يكون :other هو :value.',
    'required_unless'      => 'حقل :attribute مطلوب إلا إذا كان :other موجوداً في :values.',
    'required_with'        => 'حقل :attribute مطلوب عندما يكون :values موجوداً.',
    'required_with_all'    => 'حقل :attribute مطلوب عندما تكون :values موجودة.',
    'required_without'     => 'حقل :attribute مطلوب عندما لا يكون :values موجوداً.',
    'required_without_all' => 'حقل :attribute مطلوب عندما لا تكون أي من :values موجودة.',
    'same'                 => 'يجب أن يتطابق حقل :attribute مع :other.',
    'size'                 => [
        'numeric' => 'يجب أن تكون قيمة :attribute :size.',
        'file'    => 'يجب أن يكون حجم حقل :attribute :size كيلوبايت.',
        'string'  => 'يجب أن يكون طول حقل :attribute :size حروف.',
        'array'   => 'يجب أن يحتوي حقل :attribute على :size عناصر.',
    ],
    'starts_with'          => 'يجب أن يبدأ حقل :attribute بأحد القيم التالية: :values',
    'string'               => 'يجب أن يكون حقل :attribute نصاً.',
    'timezone'             => 'يجب أن يكون حقل :attribute منطقة زمنية صحيحة.',
    'unique'               => 'قيمة حقل :attribute مُستخدمة من قبل.',
    'uploaded'             => 'فشل في تحميل الـ :attribute.',
    'url'                  => 'صيغة حقل :attribute غير صحيحة.',
    'uuid'                 => 'يجب أن يكون حقل :attribute رقم UUID صحيحاً.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    */

    'custom' => [
        'phone' => [
            'unique' => 'رقم الجوال هذا مسجل مسبقاً لدينا.',
        ],
        'password' => [
            'confirmed' => 'كلمة المرور غير متطابقة مع حقل التأكيد.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    */

    'attributes' => [
        'name'                  => 'الاسم',
        'username'              => 'اسم المستخدم',
        'email'                 => 'البريد الإلكتروني',
        'first_name'            => 'الاسم الأول',
        'last_name'             => 'الاسم الأخير',
        'password'              => 'كلمة المرور',
        'password_confirmation' => 'تأكيد كلمة المرور',
        'city'                  => 'المدينة',
        'country'               => 'الدولة',
        'address'               => 'العنوان',
        'phone'                 => 'رقم الجوال',
        'mobile'                => 'الجوال',
        'age'                   => 'العمر',
        'sex'                   => 'الجنس',
        'gender'                => 'النوع',
        'day'                   => 'اليوم',
        'month'                 => 'الشهر',
        'year'                  => 'السنة',
        'hour'                  => 'ساعة',
        'minute'                => 'دقيقة',
        'second'                => 'ثانية',
        'title'                 => 'العنوان',
        'content'               => 'المحتوى',
        'description'           => 'الوصف',
        'excerpt'               => 'المُلخص',
        'date'                  => 'التاريخ',
        'time'                  => 'الوقت',
        'available'             => 'متاح',
        'size'                  => 'الحجم',
        'price'                 => 'السعر',
        'category_id'           => 'القسم',
        'code'                  => 'كود التفعيل',
        'otp'                   => 'كود التفعيل',
        'new_password'          => 'كلمة المرور الجديدة',
        'new_password_confirmation' => 'تأكيد كلمة المرور الجديدة',
        'lat'                   => 'خط العرض',
        'lng'                   => 'خط الطول',
    ],
];
