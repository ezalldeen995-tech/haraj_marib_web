<?php

namespace App\Console\Commands;

use App\Jobs\SendFcmNotification;
use App\Models\Ad;
use Illuminate\Console\Command;

class ExpireAds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ads:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire ads whose expiration date has passed and notify owners';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = 0;

        // Use chunk to avoid memory issues with large datasets
        Ad::where('status', 'active')
            ->where('expires_at', '<=', now())
            ->with('user') // eager load user for notifications
            ->chunk(100, function ($ads) use (&$count) {
                foreach ($ads as $ad) {
                    $ad->status = 'expired';
                    $ad->save();

                    // Dispatch notification to queue (non-blocking)
                    if ($ad->user) {
                        SendFcmNotification::dispatch(
                            $ad->user,
                            __('messages.ad_expired_title'),
                            __('messages.ad_expired_body', ['title' => $ad->title]),
                            ['ad_id' => $ad->id]
                        );
                    }

                    $count++;
                }
            });

        $this->info("Expired {$count} ad(s).");

        return self::SUCCESS;
    }
}
