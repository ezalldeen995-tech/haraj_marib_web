<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\User;

class PaymentSnippetTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_request()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/payments/request', [
            'months' => 1,
            'amount' => 5000,
            'receipt_image' => UploadedFile::fake()->create('receipt.png', 50, 'image/png')
        ]);
        
        $response->dump();
        $response->assertStatus(201);
    }
}
