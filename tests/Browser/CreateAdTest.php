<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;
use App\Models\Category;

class CreateAdTest extends DuskTestCase
{
    /**
     * Test user can create an ad.
     *
     * @return void
     */
    public function test_user_can_create_ad()
    {
        // 1. Setup Data: User and Category
        User::where('phone', '779999999')->forceDelete();
        $user = User::create([
            'name' => 'Dusk Ad Creator',
            'phone' => '779999999',
            'password' => bcrypt('password'),
            'role' => 'user'
        ]);
        
        // Ensure a Category exists for the dropdown
        $category = Category::first() ?? Category::factory()->create();

        $this->browse(function (Browser $browser) use ($user, $category) {
            // Because this is an API-driven vanilla JS frontend, 
            // the PHP loginAs($user) won't propagate to the JS localStorage.
            // We need to either perform a UI login or manually set localStorage.
            // Let's perform a quick UI login to ensure realistic E2E flow.
            
            $browser->visit('/web/index.html')
                    ->script('localStorage.clear(); sessionStorage.clear();');
            
            // Perform UI Login
            $browser->visit('/web/login.html')
                    ->waitFor('#loginPhone', 5)
                    ->type('#loginPhone', '779999999')
                    ->type('#loginPassword', 'password')
                    ->click('button[type="submit"]')
                    ->waitForLocation('/web/index.html', 5);
                    
            // Navigate to Post Ad Page
            $browser->visit('/web/post-ad.html')
                    ->waitFor('#adTitle', 5)
                    
                    // Fill Form
                    ->type('#adTitle', 'Dusk Test Car')
                    ->type('#adDescription', 'This is a test ad created by Dusk. Minimum length requires 10 chars.')
                    ->type('#adPrice', '5000000')
                    ->select('#adCategory', (string)$category->id)
                    ->type('#adAddress', 'Sana\'a - Test Location')
                    ->type('#adLat', '15.47')
                    ->type('#adLng', '45.32');
                    
            // Images (Mandatory by Backend API, creating a valid PNG dummy)
            if (!file_exists(__DIR__.'/dummy.png')) {
                $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
                file_put_contents(__DIR__.'/dummy.png', $png);
            }
            $browser->attach('#adImages', __DIR__.'/dummy.png');

            // Submit
            $browser->click('button[type="submit"]')
                    ->pause(1000);

            // Assert: Check for success message OR URL redirect
            $browser->waitUntil('return window.location.pathname.includes("ad-details.html") || window.location.pathname.includes("ads.html");', 10);
            
            // Final explicit assertion
            $this->assertTrue(
                str_contains($browser->driver->getCurrentURL(), 'ad-details.html') || 
                str_contains($browser->driver->getCurrentURL(), 'ads.html'),
                'The browser did not redirect to ads.html or ad-details.html upon ad creation.'
            );
        });
    }
}
