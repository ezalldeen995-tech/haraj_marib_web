<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    private array $messages = [
        'السلام عليكم',
        'وعليكم السلام ورحمة الله',
        'بخصوص الإعلان، هل لا يزال متوفراً؟',
        'نعم تفضل',
        'كم آخر سعر؟',
        'السعر نهائي يا غالي',
        'وين موقعكم؟',
        'في مأرب',
        'تمام، بتواصل معاك لاحقاً',
        'حياك الله بأي وقت',
    ];

    public function definition(): array
    {
        return [
            'conversation_id' => \App\Models\Conversation::factory(),
            'sender_id' => \App\Models\User::factory(),
            'content' => $this->faker->randomElement($this->messages),
            'is_read' => $this->faker->boolean(70),
        ];
    }
}
