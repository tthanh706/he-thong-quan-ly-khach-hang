<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@company.com',
            'password' => Hash::make('Admin@123456'),
            'role' => 'admin',
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        User::create([
            'name' => 'Sales',
            'email' => 'sales@company.com',
            'password' => Hash::make('Sales@123456'),
            'role' => 'sales',
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }
}
