<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\SidobeService;

// IMPORTANT: Replace this with the phone number that failed or your own for testing
$testPhone = '778384995'; 
echo "Triggering Debug Message to {$testPhone}...\n";

// This will now log the FULL response to laravel.log
SidobeService::sendMessage($testPhone, "Debug check: " . date('Y-m-d H:i:s'));

echo "Done. Please check the bottom of storage/logs/laravel.log for the 'Sidobe Response' entry.\n";
