<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Ad;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\SettingsTableSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SettingsTableSeeder::class,
        ]);

        User::updateOrCreate(
            ['phone' => '777777777'],
            [
                'name' => 'مدير النظام',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]
        );

        // Create 10 Users
        $users = User::factory(10)->create();
        
        // Create 5 Categories
        $categories = Category::factory(5)->create();

        // Create 20 Ads
        $ads = Ad::factory(20)->recycle($users)->recycle($categories)->create();

        // Create 30 Comments
        Comment::factory(30)->recycle($ads)->recycle($users)->create();

        // Create 5 Conversations with 15 Messages inside them
        for ($i = 0; $i < 5; $i++) {
            $ad = $ads->random();
            // Ensure buyer is not the same as the seller (ad owner)
            $availableBuyers = $users->where('id', '!=', $ad->user_id);
            $buyer = $availableBuyers->isNotEmpty() ? $availableBuyers->random() : $users->random();

            $conversation = Conversation::factory()->create([
                'ad_id' => $ad->id,
                'buyer_id' => $buyer->id,
                'seller_id' => $ad->user_id,
            ]);

            for ($j = 0; $j < 15; $j++) {
                $sender_id = rand(0, 1) ? $conversation->buyer_id : $conversation->seller_id;
                
                Message::factory()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender_id,
                ]);
            }
        }
    }
}
