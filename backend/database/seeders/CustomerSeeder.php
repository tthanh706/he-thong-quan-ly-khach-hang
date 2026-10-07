<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Customer::create([
            'name' => 'Nguyễn Văn A',
            'email' => 'nguyenvana@example.com',
            'phone' => '0901234567',
            'company' => 'Công ty ABC',
            'address' => 'Hà Nội, Việt Nam',
            'status' => 'active',
        ]);

        Customer::create([
            'name' => 'Trần Thị B',
            'email' => 'tranthib@example.com',
            'phone' => '0987654321',
            'company' => 'Tập đoàn XYZ',
            'address' => 'TP Hồ Chí Minh, Việt Nam',
            'status' => 'active',
        ]);
    }
}
