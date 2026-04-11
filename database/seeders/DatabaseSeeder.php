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
        // Copy images from storage/prodacts to storage/app/public/products
        $sourcePath = storage_path('prodacts');
        $destPath = storage_path('app/public/products');
        if (!\Illuminate\Support\Facades\File::exists($destPath)) {
            \Illuminate\Support\Facades\File::makeDirectory($destPath, 0755, true);
        }
        \Illuminate\Support\Facades\File::copyDirectory($sourcePath, $destPath);

        // Ensure storage directory is linked
        \Illuminate\Support\Facades\Artisan::call('storage:link');

        $this->call([
            SettingsTableSeeder::class,
            PermissionSeeder::class,
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

        // Create 20 Ads and attach images to each Ad
        $ads = Ad::factory(20)->recycle($users)->recycle($categories)->create();

        // Attach 1-3 random images from products directory to each Ad
        $images = ['car.jpg', 'car.png', 'car1.jpg', 'cars.jpg', 'elctronics.png', 'furniture.jpg', 'furniture.png', 'furniture1.jpg', 'furniture2.jpg', 'home.jpg', 'homes.jpg', 'house.jpg', 'house.png'];
        foreach ($ads as $ad) {
            $numImages = rand(1, 3);
            for ($i = 0; $i < $numImages; $i++) {
                $randomImage = $images[array_rand($images)];
                // Create image record
                \App\Models\AdImage::create([
                    'ad_id' => $ad->id,
                    'image_path' => 'products/' . $randomImage,
                ]);
            }
        }

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
