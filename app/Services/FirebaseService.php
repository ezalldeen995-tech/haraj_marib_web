<?php

namespace App\Services;

use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    /**
     * Send a push notification to a user.
     *
     * @param mixed $user The user model with device_token
     * @param string $title Notification title
     * @param string $body Notification body
     * @param array $data Custom data payload
     * @return bool True if sent, false otherwise
     */
    public static function sendNotification($user, $title, $body, $data = [])
    {
        if (!$user->device_token) {
            return false;
        }

        try {
            $messaging = Firebase::messaging();

            $notification = Notification::create($title, $body);

            $message = CloudMessage::withTarget('token', $user->device_token)
                ->withNotification($notification)
                ->withData($data);

            $messaging->send($message);

            return true;
        } catch (\Exception $e) {
            // Handle exceptions silently (e.g., invalid token)
            // You can log $e->getMessage() if needed
            return false;
        }
    }
}