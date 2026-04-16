<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class OtpNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    protected $code;

    public function __construct(string $code)
    {
        $this->code = $code;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Use Sidobe Service to send real WhatsApp message
        $message = "كود التحقق الخاص بك في حراج مارب هو: " . $this->code;
        \App\Services\SidobeService::sendMessage($notifiable->phone, $message);

        // Keep logging for debugging purposes
        \Illuminate\Support\Facades\Log::info("OTP code for {$notifiable->phone}: {$this->code}");
        
        return [];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'code' => $this->code,
        ];
    }
}
