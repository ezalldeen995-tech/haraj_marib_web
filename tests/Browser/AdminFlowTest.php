<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;
use App\Models\Ad;
use App\Models\Category;

class AdminFlowTest extends DuskTestCase
{
    /**
     * Test the admin login and checking pending ads flow.
     */
    public function test_admin_flow()
    {
        // 1. Setup Admin User
        User::where('phone', '777777777')->forceDelete();
        $admin = User::create([
            'phone' => '777777777',
            'name' => 'Super Admin',
            'password' => bcrypt('password')
        ]);
        $admin->role = 'admin';
        $admin->save();

        // 2. Setup a Dummy Ad for checking
        $category = Category::first() ?? Category::factory()->create();
        $user = User::first() ?? User::factory()->create();
        
        $adTitle = 'Dusk Test Car';
        
        // Ensure at least one ad with this title exists
        if (!Ad::where('title', $adTitle)->exists()) {
            Ad::factory()->create([
                'user_id' => $user->id,
                'category_id' => $category->id,
                'title' => $adTitle,
                'status' => 'pending'
            ]);
        }

        $this->browse(function (Browser $browser) use ($adTitle) {
            // Clear storage
            $browser->visit('/admin/index.html')
                    ->script('localStorage.clear(); sessionStorage.clear();');
                    
            // Visit Admin Login
            $browser->visit('/admin/index.html')
                    ->waitFor('#phone', 5)
                    ->type('#phone', '777777777')
                    ->type('#password', 'password')
                    ->click('button[type="submit"]')
                    ->waitForLocation('/admin/dashboard.html', 5)
                    ->assertPathIs('/admin/dashboard.html')
                    ->pause(1000); // Wait for dashboard render

            // Navigate to Ads List
            $browser->visit('/admin/ads.html')
                    ->waitFor('.table', 10)
                    ->pause(1000)
                    ->assertSee($adTitle);
                    
            // Optional: Approve the Ad
            
            // Execute the JS click on the element directly
            $browser->script('document.querySelector(".btn-approve").click();');
            
            // Wait for the Confirm Modal to appear and click confirm
            $browser->waitFor('#bsConfirmBtn', 5)
                    ->pause(500)
                    ->script('document.getElementById("bsConfirmBtn").click();');
            
            // Wait for the browser's native alert/dialog that indicates success
            try {
                $browser->waitForDialog(5)->acceptDialog();
            } catch (\Exception $e) {
                // Continue if no dialog
            }
            
            $browser->pause(1000);
            
            // Re-assert we're still effectively on the ads page and no errors crashed the UI
            $browser->assertPathIs('/admin/ads.html');
        });
    }
}
