<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Ad;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Message;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    protected $buyer;
    protected $seller;
    protected $ad;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Seller and Ad
        $this->seller = User::factory()->create();
        $category = Category::factory()->create();
        $this->ad = Ad::factory()->create([
            'user_id' => $this->seller->id,
            'category_id' => $category->id,
        ]);

        // Create Buyer
        $this->buyer = User::factory()->create();
    }

    public function test_user_can_start_conversation()
    {
        $response = $this->actingAs($this->buyer, 'api')
            ->postJson('/api/v1/chat/start', [
                'ad_id' => $this->ad->id
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'id',
                         'ad_id',
                         'buyer_id',
                         'seller_id',
                     ]
                 ]);

        $this->assertDatabaseHas('conversations', [
            'ad_id' => $this->ad->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
        ]);
    }

    public function test_user_cannot_message_self()
    {
        $response = $this->actingAs($this->seller, 'api')
            ->postJson('/api/v1/chat/start', [
                'ad_id' => $this->ad->id
            ]);

        $response->assertStatus(400)
                 ->assertJsonFragment([
                     'message' => 'لا يمكنك بدء محادثة مع نفسك'
                 ]);
    }

    public function test_user_can_send_message()
    {
        // First start the chat
        $conversation = Conversation::create([
            'ad_id' => $this->ad->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
        ]);

        $content = 'Hello, is this available?';

        $response = $this->actingAs($this->buyer, 'api')
            ->postJson('/api/v1/chat/send', [
                'conversation_id' => $conversation->id,
                'content' => $content
            ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'id',
                         'conversation_id',
                         'sender_id',
                         'content',
                     ]
                 ]);

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->buyer->id,
            'content' => $content,
        ]);
    }

    public function test_user_can_get_my_conversations()
    {
        // Create conversation and message
        $conversation = Conversation::create([
            'ad_id' => $this->ad->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->seller->id,
            'content' => 'Yes it is',
        ]);

        // Get as buyer
        $response = $this->actingAs($this->buyer, 'api')
            ->getJson('/api/v1/chats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         '*' => [
                             'id',
                             'ad_id',
                             'buyer_id',
                             'seller_id',
                             'ad',
                             'buyer',
                             'seller',
                             'messages'
                         ]
                     ]
                 ]);
                 
        $this->assertEquals(1, count($response->json('data')));
    }

    public function test_user_can_get_messages_in_conversation()
    {
        // Create conversation and message
        $conversation = Conversation::create([
            'ad_id' => $this->ad->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->seller->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->seller->id,
            'content' => 'First message',
            'is_read' => false
        ]);

        $response = $this->actingAs($this->buyer, 'api')
            ->getJson("/api/v1/chats/{$conversation->id}/messages");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         '*' => [
                             'id',
                             'content',
                             'sender_id'
                         ]
                     ]
                 ]);

        // Automatically marking as read test
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'content' => 'First message',
            'is_read' => true
        ]);
    }
}
