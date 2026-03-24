<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Ad;
use App\Models\Conversation;
use App\Models\Message;
use App\Jobs\SendFcmNotification;
use App\Notifications\NewMessageNotification;
use App\Services\BlockService;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;

class ChatController extends Controller
{

    /**
     * Start or get an existing conversation for an ad.
     */
    public function startOrGetConversation(Request $request)
    {
        $request->validate([
            'ad_id' => ['required', 'exists:ads,id'],
        ]);

        $ad = Ad::findOrFail($request->ad_id);
        $sellerId = $ad->user_id;
        $buyerId = Auth::guard('api')->id();

        if ($buyerId === $sellerId) {
            return $this->errorResponse('cannot_message_self', 400);
        }

        // block check: if either side has blocked the other
        if (BlockService::areUsersBlocked($buyerId, $sellerId)) {
            return $this->errorResponse('blocked_interaction', 403);
        }

        $conversation = Conversation::where('ad_id', $request->ad_id)
            ->where('buyer_id', $buyerId)
            ->where('seller_id', $sellerId)
            ->with('messages')
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'ad_id' => $request->ad_id,
                'buyer_id' => $buyerId,
                'seller_id' => $sellerId,
            ]);
        }

        return $this->successResponse($conversation->load('messages'), 'data_retrieved');
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(SendMessageRequest $request)
    {
        $data = $request->validated();

        $conversation = Conversation::findOrFail($data['conversation_id']);
        $userId = Auth::guard('api')->id();

        // block check
        $otherId = ($userId === $conversation->buyer_id) ? $conversation->seller_id : $conversation->buyer_id;
        if (BlockService::areUsersBlocked($userId, $otherId)) {
            return $this->errorResponse('blocked_interaction', 403);
        }

        // build temporary message for policy
        $msg = new Message(['conversation_id' => $conversation->id]);
        $msg->setRelation('conversation', $conversation);
        $this->authorize('view', $msg);

        $message = Message::create([
            'conversation_id' => $data['conversation_id'],
            'sender_id' => $userId,
            'content' => $data['content'],
        ]);

        // Dispatch FCM push notification (non-blocking)
        $recipient = ($userId === $conversation->buyer_id) ? $conversation->seller : $conversation->buyer;
        $senderName = Auth::guard('api')->user()->name;

        SendFcmNotification::dispatch(
            $recipient,
            $senderName,
            $data['content'],
            [
                'conversation_id' => $data['conversation_id'],
                'ad_id' => $conversation->ad_id,
            ]
        );

        // Store database notification (powers the website bell icon)
        $recipient->notify(new NewMessageNotification(
            senderName: $senderName,
            messagePreview: $data['content'],
            conversationId: (int) $data['conversation_id'],
            adId: (int) $conversation->ad_id,
        ));

        return $this->successResponse(new MessageResource($message), 'message_sent', 201);
    }

    /**
     * Get all conversations for the authenticated user.
     */
    public function myConversations()
    {
        $userId = Auth::guard('api')->id();

        $conversations = Conversation::where('buyer_id', $userId)
            ->orWhere('seller_id', $userId)
            ->with([
                'ad.category',
                'ad.images',
                'ad.user' => function ($q) {
                    $q->select('id', 'name', 'phone', 'avatar', 'subscription_ends_at')
                      ->withAvg('ratingsReceived', 'rating');
                },
                'buyer' => function ($q) {
                    $q->select('id', 'name', 'phone', 'avatar', 'subscription_ends_at')
                      ->withAvg('ratingsReceived', 'rating');
                },
                'seller' => function ($q) {
                    $q->select('id', 'name', 'phone', 'avatar', 'subscription_ends_at')
                      ->withAvg('ratingsReceived', 'rating');
                },
                'messages' => function ($q) {
                    $q->latest()->limit(1);
                },
            ])
            // Pre-compute unread count (eliminates N+1)
            ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                $q->where('sender_id', '!=', $userId)
                  ->where('is_read', false);
            }])
            ->orderBy('updated_at', 'desc')
            ->paginate(15);

        return $this->paginatedResponse($conversations, 'data_retrieved');
    }

    /**
     * Get messages for a conversation and mark incoming as read.
     *
     * Returns messages in reverse chronological order (newest first) for
     * infinite scroll. The frontend (Flutter) should reverse the list to
     * display oldest at top, newest at bottom, and load older pages when
     * the user scrolls up (?page=2, ?page=3, etc.).
     */
    public function getMessages($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        $userId = Auth::guard('api')->id();

        // block check
        $otherId = ($userId === $conversation->buyer_id) ? $conversation->seller_id : $conversation->buyer_id;
        if (BlockService::areUsersBlocked($userId, $otherId)) {
            return $this->errorResponse('blocked_interaction', 403);
        }

        $msg = new Message(['conversation_id' => $conversation->id]);
        $msg->setRelation('conversation', $conversation);
        $this->authorize('view', $msg);

        // Mark incoming messages as read
        Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->update(['is_read' => true]);

        // Paginate: newest first for infinite scroll
        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender:id,name,avatar')
            ->latest()
            ->paginate(20);

        return $this->paginatedResponse($messages, 'data_retrieved');
    }
}
