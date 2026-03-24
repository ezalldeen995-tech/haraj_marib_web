<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class YemeniPhone implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * Note: The Flutter app should also implement this regex check before sending the request to save bandwidth.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^(71|73|77|78)[0-9]{7}$/', $value)) {
            $fail('رقم الهاتف يجب أن يكون يمنياً صحيحاً ويبدأ بـ 77، 78، 71، أو 73');
        }
    }
}
