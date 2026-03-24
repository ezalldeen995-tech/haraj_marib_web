<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use App\Notifications\GlobalNotification;

class SendGlobalNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $title;
    public $body;

    /**
     * Create a new job instance.
     */
    public function __construct($title, $body)
    {
        $this->title = $title;
        $this->body = $body;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        User::chunk(100, function ($users) {
            foreach ($users as $user) {
                // 1. Database notification (visible in website bell)
                $user->notify(new GlobalNotification($this->title, $this->body));

                // 2. Push notification (mobile app / web push)
                if ($user->device_token) {
                    SendFcmNotification::dispatch($user, $this->title, $this->body);
                }
            }
        });
    }
}
