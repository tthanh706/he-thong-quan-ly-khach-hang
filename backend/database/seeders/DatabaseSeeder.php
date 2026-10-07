<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@company.com'],
            ['name' => 'Admin', 'password' => Hash::make('Admin1234'), 'role' => 'admin', 'locked_at' => null]
        );

        $salesA = User::updateOrCreate(
            ['email' => 'a@company.com'],
            ['name' => 'Nguyễn Văn A', 'password' => Hash::make('Staff1234'), 'role' => 'staff', 'locked_at' => null]
        );

        $salesB = User::updateOrCreate(
            ['email' => 'b@company.com'],
            ['name' => 'Trần Thị B', 'password' => Hash::make('Staff1234'), 'role' => 'staff', 'locked_at' => null]
        );

        if (Customer::count() === 0) {
            Customer::insert([
                ['name' => 'Khách hàng Alpha', 'email' => 'alpha@example.com', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Khách hàng Beta', 'email' => 'beta@example.com', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Khách hàng Gamma', 'email' => 'gamma@example.com', 'owner_id' => $salesB->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (Opportunity::count() === 0) {
            Opportunity::insert([
                ['title' => 'Cơ hội Alpha', 'amount' => 120000000, 'status' => 'open', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Cơ hội Beta', 'amount' => 85000000, 'status' => 'qualified', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Cơ hội Gamma', 'amount' => 42000000, 'status' => 'open', 'owner_id' => $salesB->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }
}
