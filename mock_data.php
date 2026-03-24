<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Category;
use App\Models\Ad;
use App\Models\Payment;

// Ensure this script can run for a while if adding many records
set_time_limit(0);

echo "Starting Mock Data Generation...\n";

// 1. Create Default Categories
$categories = [
    ['name_en' => 'Cars', 'name_ar' => 'سيارات'],
    ['name_en' => 'Real Estate', 'name_ar' => 'عقارات'],
    ['name_en' => 'Electronics', 'name_ar' => 'إلكترونيات'],
    ['name_en' => 'Furniture', 'name_ar' => 'أثاث'],
    ['name_en' => 'Services', 'name_ar' => 'خدمات']
];

foreach ($categories as $cat) {
    Category::firstOrCreate(
    ['name_en' => $cat['name_en']],
    ['name_ar' => $cat['name_ar']]
    );
}
echo "Categories OK.\n";

// 2. Create Admin User (Using the default credentials you need)
$admin = User::firstOrCreate(
['phone' => '777777777'],
[
    'name' => 'Super Admin',
    'email' => 'admin@haraj-maareb.test',
    'password' => Hash::make('password'),
    'role' => 'admin',
    'is_blocked' => false
]
);
echo "Admin OK.\n";

// 3. Create Regular Users
$users = [];
for ($i = 1; $i <= 10; $i++) {
    $users[] = User::firstOrCreate(
    ['phone' => '050' . str_pad($i, 6, "0", STR_PAD_LEFT)],
    [
        'name' => 'Demo User ' . $i,
        'email' => "user{$i}@example.com",
        'password' => Hash::make('password'),
        'role' => 'user',
        'is_blocked' => ($i % 5 == 0) // block every 5th user
    ]
    );
}
echo "Users OK.\n";

// 4. Create Ads
$statuses = ['active', 'pending', 'rejected', 'sold'];
$allCategories = Category::all();

for ($i = 1; $i <= 30; $i++) {
    $randomUser = $users[array_rand($users)];
    $randomCategory = $allCategories->random();
    $randomStatus = $statuses[array_rand($statuses)];

    Ad::create([
        'user_id' => $randomUser->id,
        'category_id' => $randomCategory->id,
        'title' => "Mock Ad " . $i,
        'description' => "This is a dummy description for the mock ad number {$i}. It contains fake details for testing the admin panel.",
        'price' => rand(100, 100000),
        'status' => $randomStatus,
        'city' => 'Maareb',
    ]);
}
echo "Ads OK.\n";

// 5. Create Payments
for ($i = 1; $i <= 15; $i++) {
    $randomUser = $users[array_rand($users)];

    // Mix of pending, approved, and rejected
    $paymentStatuses = ['pending', 'approved', 'rejected'];
    $status = $paymentStatuses[array_rand($paymentStatuses)];

    Payment::create([
        'user_id' => $randomUser->id,
        'amount' => rand(50, 500),
        'months' => rand(1, 12),
        'receipt' => 'dummy_receipt.jpg', // Assumption that actual logic handles file paths safely
        'status' => $status,
        'admin_notes' => ($status === 'rejected') ? 'Receipt unclear' : null
    ]);
}
echo "Payments OK.\n";

echo "Mock data generation finished successfully!\n";
