<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;

class OtpService
{
    /**
     * Generate 4-digit code, save to user and set expiry 10 minutes from now.
     */
    public static function generateOtp(User $user): string
    {
        $code = rand(1000, 9999); // 4-digit
        $user->otp_code = (string) $code;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        // send notification (log channel)
        Notification::send($user, new OtpNotification($code));

        return $code;
    }

    /**
     * Verify provided code against user and expiry.
     */
    public static function verifyOtp(User $user, string $code): bool
    {
        if (!$user->otp_code || $user->otp_expires_at->lt(now())) {
            return false;
        }

        if ($user->otp_code !== $code) {
            return false;
        }

        // clear otp fields
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->phone_verified_at = now();
        $user->save();

        return true;
    }
}