<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $body,
        public array $extraData = []
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
        return array_merge([
            'type'    => 'system',
            'title'   => mb_substr($this->title, 0, 100),
            'message' => mb_substr($this->body, 0, 255),
        ], $this->extraData);
    }
}
