<?php

namespace App\Observers;

use App\Models\Payment;
use App\Models\ActivityLog;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        ActivityLog::create([
            'user_id' => $payment->user_id,
            'action' => 'payment_created',
            'subject_type' => Payment::class,
            'subject_id' => $payment->id,
            'description' => "Payment of {$payment->amount} requested for {$payment->months} month(s)",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        if ($payment->wasChanged('status')) {
            ActivityLog::create([
                'user_id' => auth()->id(), // Admin who performed the action
                'action' => 'payment_' . $payment->status,
                'subject_type' => Payment::class,
                'subject_id' => $payment->id,
                'description' => "Payment #{$payment->id} status changed to {$payment->status} for user #{$payment->user_id}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        //
    }

    /**
     * Handle the Payment "restored" event.
     */
    public function restored(Payment $payment): void
    {
        //
    }

    /**
     * Handle the Payment "force deleted" event.
     */
    public function forceDeleted(Payment $payment): void
    {
        //
    }
}
