<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoProfanity implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $badWords = ['badword1', 'badword2', 'profanity', 'offensive']; // Define bad words here

        $lowerValue = strtolower($value);
        foreach ($badWords as $word) {
            if (str_contains($lowerValue, $word)) {
                $fail('The ' . $attribute . ' contains prohibited content.');
                return;
            }
        }
    }
}
