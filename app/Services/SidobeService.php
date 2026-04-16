<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SidobeService
{
    /**
     * Send a WhatsApp message using Sidobe API with detailed debugging.
     *
     * @param string $phone Recipient phone number.
     * @param string $message The message content.
     * @return bool
     */
    public static function sendMessage(string $phone, string $message): bool
    {
        $apiKey = env('SIDOBE_SECRET_KEY');
        $apiUrl = env('SIDOBE_API_URL') . '/send-message';
        $senderPhone = env('SIDOBE_SENDER_PHONE');

        // Handle Yemeni phone numbers (9 digits starting with 71, 73, 77, 78)
        // Transformation: 778384995 -> +967778384995
        if (preg_match('/^(71|73|77|78)[0-9]{7}$/', $phone)) {
            $phone = '+967' . $phone;
        }

        // Ensure phone has + prefix if missing (required by Sidobe E.164)
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        try {
            Log::info("Sidobe Attempt: Sending to {$phone} using sender {$senderPhone}...");

            $response = Http::withHeaders([
                'X-Secret-Key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, [
                'phone' => $phone,
                'message' => $message,
                'sender_phone' => $senderPhone,
                'is_async' => true, // Use async for better performance
            ]);

            $status = $response->status();
            $body = $response->body();
            
            // Log raw response for debugging persistent issues
            Log::info("Sidobe Response [{$status}]: " . $body);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['is_success'] ?? false) {
                    $msgId = $data['data']['id'] ?? $data['data']['whatsapp_message_id'] ?? 'N/A';
                    Log::info("Sidobe SUCCESS: Message accepted by API. ID: {$msgId}");
                    return true;
                }
            }

            Log::error("Sidobe FAILURE: API returned failure or unexpected structure. Body: " . $body);
            return false;
        } catch (\Exception $e) {
            Log::error("Sidobe EXCEPTION: " . $e->getMessage());
            return false;
        }
    }
}
