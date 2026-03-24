<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'manage_users', 'display_name' => 'إدارة المستخدمين'],
            ['name' => 'manage_ads', 'display_name' => 'إدارة الإعلانات'],
            ['name' => 'manage_payments', 'display_name' => 'إدارة الدفعات'],
            ['name' => 'manage_settings', 'display_name' => 'إدارة الإعدادات'],
            ['name' => 'manage_categories', 'display_name' => 'إدارة الأقسام'],
            ['name' => 'full_access', 'display_name' => 'صلاحيات كاملة - Super Admin'],
        ];

        foreach ($permissions as $perm) {
            \App\Models\Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // Assign full_access to the main admin
        $mainAdmin = \App\Models\User::where('phone', '777777777')->first();
        if ($mainAdmin) {
            $fullAccess = \App\Models\Permission::where('name', 'full_access')->first();
            if (!$mainAdmin->permissions()->where('permission_id', $fullAccess->id)->exists()) {
                $mainAdmin->permissions()->attach($fullAccess->id);
            }
        }
    }
}
