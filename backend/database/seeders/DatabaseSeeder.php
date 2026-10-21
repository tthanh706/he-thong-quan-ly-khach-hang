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

        $adminRole = \App\Models\Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Quản trị hệ thống']);
        $managerRole = \App\Models\Role::firstOrCreate(['name' => 'manager'], ['display_name' => 'Quản lý / Giám đốc']);
        $leaderRole = \App\Models\Role::firstOrCreate(['name' => 'team_leader'], ['display_name' => 'Trưởng nhóm kinh doanh']);
        $staffRole = \App\Models\Role::firstOrCreate(['name' => 'staff'], ['display_name' => 'Nhân viên kinh doanh']);

        $groupA = \App\Models\BusinessGroup::firstOrCreate(['name' => 'Nhóm Doanh nghiệp Miền Bắc']);
        $groupB = \App\Models\BusinessGroup::firstOrCreate(['name' => 'Nhóm Khách hàng Cá nhân']);
        $groupC = \App\Models\BusinessGroup::firstOrCreate(['name' => 'Chi nhánh Miền Nam']);

        if (!$admin->roles()->where('roles.id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id);
        }
        if (!$salesA->roles()->where('roles.id', $staffRole->id)->exists()) {
            $salesA->roles()->attach($staffRole->id);
            $salesA->businessGroups()->syncWithoutDetaching([$groupA->id]);
        }
        if (!$salesB->roles()->where('roles.id', $staffRole->id)->exists()) {
            $salesB->roles()->attach($staffRole->id);
            $salesB->businessGroups()->syncWithoutDetaching([$groupB->id]);
        }

        if (Customer::count() === 0) {
            $fpt = Customer::create([
                'name' => 'Tập đoàn Công nghệ FPT',
                'code' => 'FPT-CORP',
                'tax_code' => '0101778163',
                'notes' => 'Công nghệ thông tin',
                'address' => 'Tòa nhà FPT, Duy Tân, Cầu Giấy, Hà Nội',
                'phone' => '02473007300',
                'email' => 'contact@fpt.com.vn',
                'status' => 'Enterprise',
                'owner_id' => $salesA->id,
                'is_active' => true,
            ]);

            $fsoft = Customer::create([
                'name' => 'Công ty TNHH Phần mềm FPT (FPT Software)',
                'code' => 'FSOFT',
                'tax_code' => '0101778163-001',
                'notes' => 'Xuất khẩu phần mềm',
                'address' => 'Nam Từ Liêm, Hà Nội',
                'phone' => '02437687700',
                'email' => 'support@fsoft.com.vn',
                'status' => 'Enterprise',
                'parent_id' => $fpt->id,
                'owner_id' => $salesA->id,
                'is_active' => true,
            ]);

            $fox = Customer::create([
                'name' => 'Công ty Cổ phần Viễn thông FPT (FPT Telecom)',
                'code' => 'FOX',
                'tax_code' => '0101778163-002',
                'notes' => 'Viễn thông & Internet',
                'address' => 'Tòa nhà PVI, Cầu Giấy, Hà Nội',
                'phone' => '19006600',
                'email' => 'hotrokhachhang@fpt.com.vn',
                'status' => 'Enterprise',
                'parent_id' => $fpt->id,
                'owner_id' => $salesA->id,
                'is_active' => true,
            ]);

            $vingroup = Customer::create([
                'name' => 'Công ty Cổ phần VinGroup',
                'code' => 'VIC',
                'tax_code' => '0101234567',
                'notes' => 'Đa ngành',
                'address' => 'Số 7 Bằng Lăng 1, Vinhomes Riverside, Long Biên, Hà Nội',
                'phone' => '02439749999',
                'email' => 'info@vingroup.net',
                'status' => 'Enterprise',
                'owner_id' => $salesB->id,
                'is_active' => true,
            ]);

            Customer::create([
                'name' => 'Công ty Cổ phần Vinhomes',
                'code' => 'VHM',
                'tax_code' => '0101234567-001',
                'notes' => 'Bất động sản',
                'address' => 'Symphony Tower, Long Biên, Hà Nội',
                'phone' => '1900232389',
                'email' => 'info@vinhomes.vn',
                'status' => 'Enterprise',
                'parent_id' => $vingroup->id,
                'owner_id' => $salesB->id,
                'is_active' => true,
            ]);

            // Seed Contacts (S3-02)
            \App\Models\Contact::create([
                'name' => 'Nguyễn Văn Tuấn',
                'title' => 'Giám đốc Công nghệ (CTO)',
                'department' => 'Ban Công nghệ Tập đoàn',
                'phone' => '0901234567',
                'email' => 'tuan.nv@fpt.com.vn',
                'customer_id' => $fpt->id,
                'is_primary' => true,
                'role_in_decision' => 'Người quyết định kỹ thuật',
                'notes' => 'Phụ trách chiến lược chuyển đổi số',
                'created_by' => $admin->id,
            ]);

            \App\Models\Contact::create([
                'name' => 'Trần Thị Thu Hương',
                'title' => 'Trưởng phòng Mua sắm (Procurement)',
                'department' => 'Phòng Cung ứng & Mua hàng',
                'phone' => '0988776655',
                'email' => 'huong.ttt@fsoft.com.vn',
                'customer_id' => $fsoft->id,
                'is_primary' => true,
                'role_in_decision' => 'Người đàm phán hợp đồng & thanh toán',
                'notes' => 'Đầu mối xúc tiến hợp đồng phần mềm',
                'created_by' => $salesA->id,
            ]);

            // Seed Support Request (S3-08)
            \App\Models\SupportRequest::create([
                'ticket_code' => 'SR-2026-001',
                'title' => 'Lỗi kết nối cổng API Gateway thanh toán',
                'customer_id' => $fsoft->id,
                'user_id' => $salesA->id,
                'priority' => 'critical',
                'status' => 'in_progress',
                'sla_hours' => 4,
                'first_response_at' => now()->subHours(2),
                'resolved_at' => null,
            ]);

            // Seed Periodic Care (S3-09)
            \App\Models\PeriodicCare::create([
                'customer_id' => $fpt->id,
                'user_id' => $salesA->id,
                'care_type' => 'call',
                'scheduled_date' => now()->addDays(3),
                'status' => 'pending',
                'notes' => 'Gọi điện hỏi thăm chất lượng dịch vụ định kỳ quý 4',
            ]);
        }

        if (Opportunity::count() === 0) {
            Opportunity::insert([
                ['title' => 'Triển khai CRM cho FPT Software', 'amount' => 1200000000, 'status' => 'open', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Nâng cấp hạ tầng Cloud cho FPT Telecom', 'amount' => 850000000, 'status' => 'open', 'owner_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Giải pháp Quản trị Khách hàng Vinhomes', 'amount' => 2400000000, 'status' => 'open', 'owner_id' => $salesB->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }
}
