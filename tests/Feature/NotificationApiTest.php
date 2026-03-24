<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Ad;
use App\Models\Category;
use App\Models\Conversation;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    private User $seller;
    private User $buyer;
    private Ad $ad;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create([
            'name_ar' => 'سيارات',
            'name_en' => 'Cars',
        ]);

        $this->seller = User::create([
            'name' => 'Seller',
            'phone' => '770000001',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        $this->buyer = User::create([
            'name' => 'Buyer',
            'phone' => '770000002',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        $this->ad = Ad::create([
            'user_id' => $this->seller->id,
            'category_id' => $category->id,
            'title' => 'إعلان تجريبي للإشعارات',
            'description' => 'وصف تجريبي للإعلان يجب أن يكون طويلاً بما فيه الكفاية.',
            'price' => 50000,
            'currency' => 'YER',
            'status' => 'active',
            'address_text' => 'مأرب',
            'lat' => 15.47,
            'lng' => 45.32,
            'expires_at' => now()->addDays(30),
        ]);
    }

    /** @test */
    public function test_unread_count_returns_zero_initially()
    {
        $token = auth('api')->login($this->seller);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/notifications/unread-count');

        $response->assertStatus(200)
            ->assertJsonPath('data.count', 0);
    }

    /** @test */
    public function test_sending_message_creates_notification_for_recipient()
    {
        // Step 1: Buyer starts a conversation
        $buyerToken = auth('api')->login($this->buyer);

        $startRes = $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/start', ['ad_id' => $this->ad->id]);

        $startRes->assertStatus(200);
        $conversationId = $startRes->json('data.id');

        // Step 2: Buyer sends a message
        $sendRes = $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/send', [
                'conversation_id' => $conversationId,
                'content' => 'مرحباً أخوي، السيارة لا زالت متوفرة؟',
            ]);

        $sendRes->assertStatus(201);

        // Step 3: Verify seller has 1 unread notification
        $sellerToken = auth('api')->login($this->seller);

        $countRes = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->getJson('/api/v1/notifications/unread-count');

        $countRes->assertStatus(200)
            ->assertJsonPath('data.count', 1);
    }

    /** @test */
    public function test_notification_list_returns_data()
    {
        // Buyer starts a conversation and sends a message
        $buyerToken = auth('api')->login($this->buyer);

        $startRes = $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/start', ['ad_id' => $this->ad->id]);

        $conversationId = $startRes->json('data.id');

        $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/send', [
                'conversation_id' => $conversationId,
                'content' => 'رسالة تجريبية',
            ]);

        // Seller checks notifications list
        $sellerToken = auth('api')->login($this->seller);

        $response = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200);

        $notifications = $response->json('data');
        $this->assertCount(1, $notifications);
        $this->assertEquals('new_message', $notifications[0]['data']['type']);
        $this->assertEquals('Buyer', $notifications[0]['data']['sender_name']);
    }

    /** @test */
    public function test_mark_notification_as_read()
    {
        // Create a notification
        $buyerToken = auth('api')->login($this->buyer);

        $startRes = $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/start', ['ad_id' => $this->ad->id]);

        $conversationId = $startRes->json('data.id');

        $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/send', [
                'conversation_id' => $conversationId,
                'content' => 'رسالة للقراءة',
            ]);

        // Seller reads the notification
        $sellerToken = auth('api')->login($this->seller);

        $listRes = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->getJson('/api/v1/notifications');

        $notificationId = $listRes->json('data.0.id');

        $markRes = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->postJson("/api/v1/notifications/{$notificationId}/read");

        $markRes->assertStatus(200);

        // Verify count is 0 now
        $countRes = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->getJson('/api/v1/notifications/unread-count');

        $countRes->assertJsonPath('data.count', 0);
    }

    /** @test */
    public function test_mark_all_notifications_as_read()
    {
        $buyerToken = auth('api')->login($this->buyer);

        $startRes = $this->withHeader('Authorization', "Bearer $buyerToken")
            ->postJson('/api/v1/chat/start', ['ad_id' => $this->ad->id]);

        $conversationId = $startRes->json('data.id');

        // Send 3 messages
        for ($i = 0; $i < 3; $i++) {
            $this->withHeader('Authorization', "Bearer $buyerToken")
                ->postJson('/api/v1/chat/send', [
                    'conversation_id' => $conversationId,
                    'content' => "رسالة رقم $i",
                ]);
        }

        // Seller marks all read
        $sellerToken = auth('api')->login($this->seller);

        $this->withHeader('Authorization', "Bearer $sellerToken")
            ->postJson('/api/v1/notifications/read-all')
            ->assertStatus(200);

        // Verify count
        $countRes = $this->withHeader('Authorization', "Bearer $sellerToken")
            ->getJson('/api/v1/notifications/unread-count');

        $countRes->assertJsonPath('data.count', 0);
    }
}
