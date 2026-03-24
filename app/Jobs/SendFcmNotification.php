<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendFcmNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of retry attempts before failure.
     */
    public int $tries = 3;

    /**
     * Seconds to wait before retrying.
     */
    public int $backoff = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public User $user,
        public string $title,
        public string $body,
        public array $data = [],
    ) {}

    /**
     * Execute the job.
     *
     * NOTE: To process queued jobs, run:
     *   Local:      php artisan queue:work
     *   Production: Configure Supervisor (see Laravel docs)
     */
    public function handle(): void
    {
        if (!$this->user->device_token) {
            Log::info("SendFcmNotification skipped: user #{$this->user->id} has no device_token");
            return;
        }

        $sent = FirebaseService::sendNotification(
            $this->user,
            $this->title,
            $this->body,
            $this->data,
        );

        if (!$sent) {
            Log::warning("SendFcmNotification failed for user #{$this->user->id}", [
                'title' => $this->title,
                'device_token' => substr($this->user->device_token, 0, 10) . '...',
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error("SendFcmNotification permanently failed for user #{$this->user->id}", [
            'title' => $this->title,
            'error' => $exception?->getMessage(),
        ]);
    }
}
