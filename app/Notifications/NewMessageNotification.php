<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $senderName,
        public string $messagePreview,
        public int $conversationId,
        public int $adId,
    ) {}

    /**
     * Deliver via the database channel so the bell icon works on-site.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Data stored in the `notifications` table (JSON `data` column).
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type'            => 'new_message',
            'sender_name'     => $this->senderName,
            'message_preview' => mb_substr($this->messagePreview, 0, 80),
            'conversation_id' => $this->conversationId,
            'ad_id'           => $this->adId,
        ];
    }
}
