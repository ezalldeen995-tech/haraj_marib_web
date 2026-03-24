<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Setting::set('subscription_price_monthly', '9.99');
        \App\Models\Setting::set('app_name', 'Haraj Maareb');
        \App\Models\Setting::set('contact_email', 'support@example.com');
        \App\Models\Setting::set('terms_conditions_text', 'Default terms and conditions...');
    }
}
