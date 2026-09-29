<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    \App\Models\User::create([
        'name' => 'Admin',
        'email' => 'admin@company.com',
        'password' => \Illuminate\Support\Facades\Hash::make('Admin@123456'),
        'role' => 'admin',
        'business_group' => 'Ban điều hành',
        'failed_login_attempts' => 0,
        'locked_until' => null,
    ]);

    \App\Models\User::create([
        'name' => 'Sales',
        'email' => 'sales@company.com',
        'password' => \Illuminate\Support\Facades\Hash::make('Sales@123456'),
        'role' => 'sales',
        'business_group' => 'Kinh doanh miền Bắc',
        'failed_login_attempts' => 0,
        'locked_until' => null,
    ]);
}
}
