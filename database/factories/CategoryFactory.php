<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private array $categories = [
        ['ar' => 'سيارات', 'en' => 'Cars'],
        ['ar' => 'عقارات', 'en' => 'Real Estate'],
        ['ar' => 'أجهزة ذكية', 'en' => 'Smart Devices'],
        ['ar' => 'أثاث', 'en' => 'Furniture'],
        ['ar' => 'خدمات', 'en' => 'Services'],
        ['ar' => 'وظائف', 'en' => 'Jobs'],
        ['ar' => 'مواشي وحيوانات', 'en' => 'Livestock & Animals'],
        ['ar' => 'أخرى', 'en' => 'Others'],
    ];

    public function definition(): array
    {
        // Use a static index to ensure uniqueness across loops if needed
        static $index = 0;
        $category = $this->categories[$index % count($this->categories)];
        $index++;

        return [
            'name_ar' => $category['ar'],
            'name_en' => $category['en'],
            'is_active' => true,
        ];
    }
}
