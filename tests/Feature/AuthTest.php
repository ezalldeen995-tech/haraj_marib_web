<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user registration.
     */
    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'Test QA User',
            'phone' => '772222222',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/v1/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'token'
                     ]
                 ]);

        $this->assertDatabaseHas('users', [
            'phone' => '772222222',
            'name' => 'Test QA User',
        ]);
    }

    /**
     * Test user login.
     */
    public function test_user_can_login(): void
    {
        // Create a user
        $user = User::factory()->create([
            'phone' => '773333333',
            'password' => bcrypt('password123'),
        ]);

        $payload = [
            'phone' => '773333333',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/v1/login', $payload);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'token'
                     ]
                 ]);
    }
}
