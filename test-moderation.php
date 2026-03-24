<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $service = app(\App\Services\ImageModerationService::class);
    $imagePath = storage_path('app/public/ads/1773350757_69b32f65afb2b.jpg');
    
    if (!file_exists($imagePath)) {
        echo "Test image not found.\n";
        exit(1);
    }
    
    echo "Testing image: $imagePath\n";
    
    // Call analyze directly
    $result = $service->analyze($imagePath);
    echo "Result: Safe ($result)\n";
    
} catch (\Exception $e) {
    echo "Exception Caught: " . $e->getMessage() . "\n";
}
