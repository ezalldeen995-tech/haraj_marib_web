<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;

class UserJourneyTest extends DuskTestCase
{
    /**
     * Test the user registration, login, and ad creation journey.
     *
     * @return void
     */
    public function testUserJourney()
    {
        // Ensure user doesn't exist to prevent unique constraint error
        User::where('phone', '771111111')->forceDelete();

        $this->browse(function (Browser $browser) {
            // 1. Visit Landing Page
            $browser->visit('/web/index.html')
                    ->waitForText('حراج مأرب', 10)
                    ->assertSee('حراج مأرب');

            // 2. Register
            $browser->visit('/web/register.html')
                    ->waitFor('#regName', 10)
                    ->type('#regName', 'Test User')
                    ->type('#regPhone', '771111111')
                    ->type('#regPassword', 'password123')
                    ->type('#regPasswordConfirm', 'password123')
                    ->press('التالي - إنشاء الحساب');

            // Wait for the alert and accept it
            try {
                $browser->waitForDialog(5)->acceptDialog();
            } catch (\Exception $e) {
            }

            $browser->waitFor('#step2', 10);
            
            // Get the OTP code directly from the database for the user
            $user = User::where('phone', '771111111')->latest()->first();
            $otp = $user->otp_code ?? '1234';

            $browser->type('#otpCode', $otp)
                    ->press('تأكيد الكود')
                    ->waitForLocation('/web/index.html', 10)
                    ->pause(1000); 

            // Logout (clear localStorage and sessionStorage to force logout for testing)
            $browser->script('localStorage.clear(); sessionStorage.clear();');

            // 3. Login
            $browser->visit('/web/login.html')
                    ->waitFor('#loginPhone', 10)
                    ->type('#loginPhone', '771111111')
                    ->type('#loginPassword', 'password123')
                    ->press('دخول')
                    ->waitForLocation('/web/index.html', 10)
                    ->pause(1000);

            // 4. Create Ad
            $browser->visit('/web/post-ad.html')
                    ->waitFor('#adTitle', 10)
                    ->type('#adTitle', 'Test Car')
                    ->type('#adDescription', 'Test Description for the car ad')
                    ->type('#adPrice', '1000000')
                    ->select('#adCategory', '1') // Select Category ID 1
                    ->type('#adAddress', 'Sana\'a - Haddah')
                    ->type('#adLat', '15.47')
                    ->type('#adLng', '45.32');
            
            // Generate dummy image if not exists
            if (!file_exists(__DIR__.'/dummy.png')) {
                $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
                file_put_contents(__DIR__.'/dummy.png', $png);
            }
                    
            $browser->attach('#adImages', __DIR__.'/dummy.png')
                    ->click('button[type="submit"].btn-primary.btn-lg')
                    ->pause(2000);
                    
            $browser->waitUntil('return window.location.pathname.includes("ad-details.html") || window.location.pathname.includes("ads.html");', 10);
        });
    }
}
