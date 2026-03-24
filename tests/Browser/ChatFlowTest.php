<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;
use App\Models\Ad;
use App\Models\Category;

class ChatFlowTest extends DuskTestCase
{
    /**
     * Test user can initiate and send a chat message from an ad.
     *
     * @return void
     */
    public function test_user_can_chat_from_ad()
    {
        // 1. Setup Data: Seller, Category, Ad, and Buyer
        User::whereIn('phone', ['779123456', '779654321'])->forceDelete();
        
        $seller = User::create([
            'name' => 'Dusk Chat Seller',
            'phone' => '779123456',
            'password' => bcrypt('password'),
            'role' => 'user'
        ]);

        $category = Category::first() ?? Category::factory()->create();

        $ad = Ad::factory()->create([
            'user_id' => $seller->id,
            'category_id' => $category->id,
            'status' => 'active'
        ]);

        $buyer = User::create([
            'name' => 'Dusk Chat Buyer',
            'phone' => '779654321',
            'password' => bcrypt('password'),
            'role' => 'user'
        ]);

        $this->browse(function (Browser $browser) use ($buyer, $ad) {
            
            // Clear storage before test
            $browser->visit('/web/index.html')
                    ->script('localStorage.clear(); sessionStorage.clear();');
            
            // 2. Perform UI Login as Buyer
            $browser->visit('/web/login.html')
                    ->waitFor('#loginPhone', 5)
                    ->type('#loginPhone', '779654321')
                    ->type('#loginPassword', 'password')
                    ->click('button[type="submit"]')
                    ->waitForLocation('/web/index.html', 5);
                    
            // 3. Navigate to the Ad Details Page
            $browser->visit('/web/ad-details.html?id=' . $ad->id)
                    ->waitFor('#adTitle', 5)
                    // Wait for the contact seller button to be active
                    ->waitFor('#btnChat:not([disabled])', 5)
                    ->pause(500); // Give JS a tiny moment to bind events fully
                    
            // 4. Click contact seller
            $browser->click('#btnChat')
                    // 5. Assert redirection to chat page
                    ->waitForLocation('/web/chat.html', 5)
                    ->assertQueryStringHas('ad_id', (string)$ad->id);

            // Wait for chat to load the specific DOM elements
            $browser->waitFor('#chatActive', 10)
                    ->waitFor('#messageInput', 5);

            // 6. Send a message
            $browser->type('#messageInput', 'Hello from Dusk Test!')
                    ->click('#btnSendMessage')
                    // Wait for the optimistic bubble to append
                    ->waitFor('.chat-bubble-sent', 5)
                    ->assertSeeIn('.chat-bubble-sent', 'Hello from Dusk Test!');
        });
    }
}
