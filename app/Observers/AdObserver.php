<?php

namespace App\Observers;

use App\Models\Ad;
use App\Models\ActivityLog;
use App\Jobs\SendFcmNotification;
use App\Notifications\SystemNotification;

class AdObserver
{
    /**
     * Handle the Ad "created" event.
     */
    public function created(Ad $ad): void
    {
        ActivityLog::create([
            'user_id' => $ad->user_id,
            'action' => 'ad_created',
            'subject_type' => Ad::class,
            'subject_id' => $ad->id,
            'description' => "Ad '{$ad->title}' created with status {$ad->status}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Handle the Ad "updated" event.
     */
    public function updated(Ad $ad): void
    {
        if ($ad->wasChanged('status') && in_array($ad->status, ['active', 'rejected'])) {
            $action = $ad->status === 'active' ? 'approved' : 'rejected';

            // Log the admin action
            ActivityLog::create([
                'user_id' => auth()->id(), // Admin who performed the action
                'action' => 'ad_' . $action,
                'subject_type' => Ad::class,
                'subject_id' => $ad->id,
                'description' => "Ad '{$ad->title}' has been {$action}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            $title = $action === 'approved' ? 'تم قبول إعلانك' : 'تم رفض إعلانك';
            $body = $action === 'approved' 
                ? "تمت الموافقة على إعلانك: {$ad->title} وهو الآن متاح للزوار."
                : "تم رفض إعلانك: {$ad->title} لمخالفته الشروط.";

            // 1. Database notification (visible in website bell)
            $ad->user->notify(new SystemNotification($title, $body, ['ad_id' => $ad->id, 'status' => $ad->status]));

            // 2. Dispatch FCM notification to queue (non-blocking)
            if ($ad->user->device_token) {
                SendFcmNotification::dispatch(
                    $ad->user,
                    $title,
                    $body,
                    ['ad_id' => $ad->id, 'status' => $ad->status]
                );
            }
        }
    }

    /**
     * Handle the Ad "deleted" event.
     */
    public function deleted(Ad $ad): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'ad_deleted',
            'subject_type' => Ad::class,
            'subject_id' => $ad->id,
            'description' => "Ad '{$ad->title}' deleted (soft)",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Handle the Ad "restored" event.
     */
    public function restored(Ad $ad): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'ad_restored',
            'subject_type' => Ad::class,
            'subject_id' => $ad->id,
            'description' => "Ad '{$ad->title}' restored",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Handle the Ad "force deleted" event.
     */
    public function forceDeleted(Ad $ad): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'ad_force_deleted',
            'subject_type' => Ad::class,
            'subject_id' => $ad->id,
            'description' => "Ad '{$ad->title}' permanently deleted",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
