<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private array $comments = [
        'كم السعر النهائي؟',
        'هل تقبل البدل؟',
        'بالتوفيق إن شاء الله',
        'كم الممشى؟',
        'وين الموقع بالضبط؟',
        'هل يوجد توصيل؟',
        'ممكن صور إضافية؟',
        'سعر ممتاز',
        'هل المنتج متوفر؟',
        'الرجاء التواصل معي على الخاص',
    ];

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'ad_id' => \App\Models\Ad::factory(),
            'content' => fake()->randomElement($this->comments),
        ];
    }
}
