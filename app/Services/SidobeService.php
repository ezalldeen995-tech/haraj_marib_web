<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SidobeService
{
    /**
     * Send a WhatsApp message using Sidobe API.
     *
     * @param string $phone Recipient phone number in E.164 format.
     * @param string $message The message content.
     * @return bool
     */
    public static function sendMessage(string $phone, string $message): bool
    {
        $apiKey = env('SIDOBE_SECRET_KEY');
        $apiUrl = env('SIDOBE_API_URL') . '/send-message';
        $senderPhone = env('SIDOBE_SENDER_PHONE');

        // Handle Yemeni phone numbers (9 digits starting with 71, 73, 77, 78)
        if (preg_match('/^(71|73|77|78)[0-9]{7}$/', $phone)) {
            $phone = '+967' . $phone;
        }

        // Ensure phone has + prefix if missing (for other formats)
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        try {
            $response = Http::withHeaders([
                'X-Secret-Key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, [
                'phone' => $phone,
                'message' => $message,
                'sender_phone' => $senderPhone,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['is_success'] ?? false) {
                    Log::info("Sidobe WhatsApp sent to {$phone}: ID " . ($data['data']['whatsapp_message_id'] ?? 'N/A'));
                    return true;
                }
            }

            Log::error("Sidobe API error for {$phone}: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Sidobe Service Exception: " . $e->getMessage());
            return false;
        }
    }
}
