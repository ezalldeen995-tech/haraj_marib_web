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
        \App\Models\Setting::set('app_name', 'حراج مأرب');
        \App\Models\Setting::set('contact_email', 'support@haraj-maareb.com');
        \App\Models\Setting::set('contact_phone', '+967 77 123 4567');
        \App\Models\Setting::set('contact_location', 'مأرب، اليمن');
        \App\Models\Setting::set('working_hours', 'السبت - الخميس: 8 صباحاً - 10 مساءً');
        \App\Models\Setting::set('whatsapp_url', 'https://wa.me/967771234567');
        \App\Models\Setting::set('telegram_url', '#');
        \App\Models\Setting::set('facebook_url', '#');
        \App\Models\Setting::set('twitter_url', '#');
        \App\Models\Setting::set('terms_conditions_text', 'Default terms and conditions...');
    }
}
