<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ad>
 */
class AdFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private array $titles = [
        'سيارة للبيع بحالة ممتازة',
        'شقة للإيجار في موقع مميز',
        'جوال ايفون مستعمل نظيف',
        'أرض للبيع بمساحة كبيرة',
        'لابتوب ديل للألعاب',
        'طقم كنب كلاسيكي للبيع',
        'مطلوب سائق توصيل',
        'شاشة سمارت 55 بوصة',
        'فيلا للبيع تشطيب راقي',
        'كاميرا نيكون احترافية',
    ];

    public function definition(): array
    {
        $status = fake()->randomElement(['active', 'active', 'active', 'pending', 'sold', 'rejected']);
        return [
            'user_id' => \App\Models\User::factory(),
            'category_id' => \App\Models\Category::factory(),
            'title' => fake()->randomElement($this->titles) . ' ' . fake()->numerify('###'),
            'description' => fake('ar_SA')->realText(200),
            'price' => fake()->numberBetween(100, 100000),
            'currency' => fake()->randomElement(['YER', 'SAR']),
            'address_text' => fake('ar_SA')->city() ?? 'مأرب',
            'lat' => fake()->latitude(12, 18),
            'lng' => fake()->longitude(42, 54),
            'status' => $status,
            'is_featured' => fake()->boolean(10),
            'views_count' => fake()->numberBetween(0, 1000),
            'expires_at' => $status === 'sold' ? now()->subDays(5) : now()->addDays(30),
        ];
    }
}
