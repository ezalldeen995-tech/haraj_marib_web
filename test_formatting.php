<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\SidobeService;

// Test Case 1: 9-digit Yemeni number
$testPhone1 = '778384995'; 
echo "Testing with 9-digit number: {$testPhone1}\n";
// We can't easily capture the private variable, but we can check the logs
SidobeService::sendMessage($testPhone1, "Formatting test 1");

// Test Case 2: Number already having + prefix
$testPhone2 = '+967778384995';
echo "Testing with already prefixed number: {$testPhone2}\n";
SidobeService::sendMessage($testPhone2, "Formatting test 2");

echo "Check storage/logs/laravel.log to see the formatted output.\n";
