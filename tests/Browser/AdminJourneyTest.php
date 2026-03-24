<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AdminJourneyTest extends DuskTestCase
{
    /**
     * Test the admin login and ad approval journey.
     *
     * @return void
     */
    public function testAdminJourney()
    {
        $this->browse(function (Browser $browser) {
            // Ensure admin exists
            $admin = \App\Models\User::firstOrCreate(
                ['phone' => '777777777'],
                ['name' => 'Admin', 'password' => bcrypt('password'), 'role' => 'admin']
            );
            
            // Ensure a pending ad exists to approve
            $user = \App\Models\User::factory()->create();
            $category = \App\Models\Category::first() ?? \App\Models\Category::factory()->create();
            \App\Models\Ad::factory()->create([
                'user_id' => $user->id,
                'category_id' => $category->id,
                'title' => 'Test Car',
                'status' => 'pending'
            ]);

            // 1. Admin Login
            $browser->visit('/admin/index.html')
                    ->waitFor('#phone', 10)
                    ->type('#phone', '777777777')
                    ->type('#password', 'password')
                    ->press('دخول')
                    ->waitForLocation('/admin/dashboard.html', 10)
                    ->pause(1000); // Wait for dashboard to fully render

            // 2. Verify Dashboard
            $browser->visit('/admin/dashboard.html')
                    ->waitForText('نظرة عامة')
                    ->assertSee('نظرة عامة');

            // 3. Approve Ad
            $browser->visit('/admin/ads.html')
                    ->waitForText('Test Car', 10);
            
            $adId = \App\Models\Ad::where('title', 'Test Car')->first()->id;        
            $browser->script("approveAd({$adId});");
                    
            $browser->waitFor('#bsConfirmBtn', 5)
                    ->pause(500)
                    ->script('document.getElementById("bsConfirmBtn").click();');
            
            $browser->waitForDialog(10)
                    ->acceptDialog()
                    ->pause(1000);
        });
    }
}
