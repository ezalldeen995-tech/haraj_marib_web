<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;

class AuthFlowTest extends DuskTestCase
{
    /**
     * Test user login flow via the browser interface.
     */
    public function test_user_can_login()
    {
        // 1. Create a known test user with deterministic credentials
        User::where('phone', '771234567')->forceDelete();
        $user = User::create([
                'name' => 'Dusk QA User',
                'phone' => '771234567',
                'password' => bcrypt('password'),
                'role' => 'user'
            ]
        );
        $user->role = 'user';
        $user->save();

        $this->browse(function (Browser $browser) {
            // 2. Clear previous session/storage context before running
            $browser->visit('/web/index.html')
                    ->script('localStorage.clear(); sessionStorage.clear();');
            
            // 3. Begin Scenario
            $browser->visit('/web/index.html')
                    ->waitForText('حراج مأرب', 10)
                    ->assertSee('حراج مأرب')
                    ->clickLink('تسجيل الدخول')
                    ->waitForLocation('/web/login.html', 10)
                    ->waitFor('#loginPhone', 10)
                    ->type('#loginPhone', '771234567')
                    ->type('#loginPassword', 'password')
                    ->click('button[type="submit"]')
                    ->waitForLocation('/web/index.html', 10)
                    ->assertPathIs('/web/index.html')
                    ->pause(1000); // Wait for the UI header to switch to logged-in state 
        });
    }
}
