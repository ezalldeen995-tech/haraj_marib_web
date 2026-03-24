<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use App\Models\User;

class PaymentFlowTest extends DuskTestCase
{
    /**
     * Test the payment and subscription validation flow via the browser interface.
     */
    public function test_payment_flow()
    {
        // 1. Setup Data: User
        User::where('phone', '778888888')->forceDelete();
        $user = User::create([
            'name' => 'Dusk Payment User',
            'phone' => '778888888',
            'password' => bcrypt('password'),
            'role' => 'user'
        ]);

        $this->browse(function (Browser $browser) use ($user) {
            $browser->visit('/web/index.html')
                    ->script('localStorage.clear(); sessionStorage.clear();');
            
            // Perform UI Login
            $browser->visit('/web/login.html')
                    ->waitFor('#loginPhone', 5)
                    ->type('#loginPhone', '778888888')
                    ->type('#loginPassword', 'password')
                    ->click('button[type="submit"]')
                    ->waitForLocation('/web/index.html', 5);
                    
            // Navigate to Payments Page
            $browser->visit('/web/payments.html')
                    ->waitFor('#paymentForm', 5)
                    
                    // Fill Form
                    ->select('#paymentMonths', '1')
                    ->type('#paymentAmount', '5000');
                    
            // Generate valid receipt image
            if (!file_exists(__DIR__.'/receipt.png')) {
                $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
                file_put_contents(__DIR__.'/receipt.png', $png);
            }
            // Attach receipt hidden input
            $browser->attach('#receiptInput', __DIR__.'/receipt.png')
                    ->pause(1000)
                    ->script('document.getElementById("btnSubmitPayment").click();');
                    
            $browser->pause(2000);
            try {
                $browser->waitForDialog(5)->acceptDialog();
            } catch (\Exception $e) {
                // Ignore if no dialogue
            }

            // Verify a badge saying pending appears in the history list
            $browser->waitFor('.payment-status-pending', 10)
                    ->assertSee('قيد المراجعة');
                    
            // Explicit check that a DB entry was added
            $this->assertDatabaseHas('payments', [
                'user_id' => $user->id,
                'amount' => 5000,
                'months' => 1,
                'status' => 'pending'
            ]);
        });
    }
}
