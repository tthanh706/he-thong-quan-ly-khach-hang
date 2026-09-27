<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Group;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // 1. Tạo các Nhóm mẫu
        $adminGroup = Group::create(['name' => 'Quản trị viên']);
        $devGroup   = Group::create(['name' => 'Lập trình viên']);
        $hrGroup    = Group::create(['name' => 'Nhân sự']);

        // 2. Tạo Tài khoản mẫu
        User::create([
            'name'     => 'Administrator',
            'email'    => 'admin@gmail.com',
            'password' => bcrypt('123456'),
            'group_id' => $adminGroup->id,
        ]);

        User::create([
            'name'     => 'Nguyễn Văn A',
            'email'    => 'nva@gmail.com',
            'password' => bcrypt('123456'),
            'group_id' => $devGroup->id,
        ]);

        User::create([
            'name'     => 'Trần Thị B',
            'email'    => 'ttb@gmail.com',
            'password' => bcrypt('123456'),
            'group_id' => $hrGroup->id,
        ]);
    }
}