<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCarYear implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $currentYear = date('Y');
        if (!is_numeric($value) || $value < 1990 || $value > $currentYear + 1) {
            $fail("The car year must be between 1990 and " . ($currentYear + 1) . ".");
        }
    }
}
