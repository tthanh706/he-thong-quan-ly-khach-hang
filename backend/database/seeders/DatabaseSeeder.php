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
                ['title' => 'Triển khai CRM cho FPT Software', 'name' => 'Triển khai CRM cho FPT Software', 'amount' => 1200000000, 'value' => 1200000000, 'stage' => 'bao_gia', 'win_probability' => 40, 'expected_close_date' => now()->addDays(20)->toDateString(), 'status' => 'open', 'owner_id' => $salesA->id, 'owner_user_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Nâng cấp hạ tầng Cloud cho FPT Telecom', 'name' => 'Nâng cấp hạ tầng Cloud cho FPT Telecom', 'amount' => 850000000, 'value' => 850000000, 'stage' => 'thuong_thao', 'win_probability' => 70, 'expected_close_date' => now()->addDays(15)->toDateString(), 'status' => 'open', 'owner_id' => $salesA->id, 'owner_user_id' => $salesA->id, 'created_at' => now(), 'updated_at' => now()],
                ['title' => 'Giải pháp Quản trị Khách hàng Vinhomes', 'name' => 'Giải pháp Quản trị Khách hàng Vinhomes', 'amount' => 2400000000, 'value' => 2400000000, 'stage' => 'khao_sat', 'win_probability' => 10, 'expected_close_date' => now()->addDays(45)->toDateString(), 'status' => 'open', 'owner_id' => $salesB->id, 'owner_user_id' => $salesB->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Seed Campaigns (S4-03)
        $campaign1 = \App\Models\Campaign::firstOrCreate(
            ['name' => 'Chiến dịch Chuyển đổi số Doanh nghiệp 2026'],
            [
                'description' => 'Hội thảo và sự kiện xúc tiến giải pháp công nghệ số',
                'channel' => 'Hội thảo & Sự kiện',
                'status' => 'active',
                'starts_at' => now()->startOfMonth(),
                'ends_at' => now()->addMonths(2)->endOfMonth(),
                'budget' => 120000000,
                'target_leads' => 80,
                'target_revenue' => 3000000000,
                'created_by' => $admin->id,
            ]
        );

        $campaign2 = \App\Models\Campaign::firstOrCreate(
            ['name' => 'Quảng cáo Google Search Q4'],
            [
                'description' => 'Chiến dịch từ khóa tìm kiếm CRM và phần mềm quản trị',
                'channel' => 'Google Ads',
                'status' => 'active',
                'starts_at' => now()->startOfMonth(),
                'ends_at' => now()->endOfMonth(),
                'budget' => 60000000,
                'target_leads' => 150,
                'target_revenue' => 1500000000,
                'created_by' => $admin->id,
            ]
        );

        // Seed Lead Scoring Rules (S4-05)
        if (\App\Models\LeadScoringRule::count() === 0) {
            \App\Models\LeadScoringRule::insert([
                ['name' => 'Ngành Công nghệ thông tin', 'criteria_type' => 'industry', 'criteria_value' => 'Công nghệ thông tin', 'points' => 25, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Ngành Sản xuất & Chế biến', 'criteria_type' => 'industry', 'criteria_value' => 'Sản xuất', 'points' => 20, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Quy mô Trên 500 nhân sự', 'criteria_type' => 'company_size', 'criteria_value' => 'Trên 500 nhân sự', 'points' => 30, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Quy mô 100 - 500 nhân sự', 'criteria_type' => 'company_size', 'criteria_value' => '100 - 500 nhân sự', 'points' => 20, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Nguồn Hội thảo sự kiện', 'criteria_type' => 'source', 'criteria_value' => 'Hội thảo', 'points' => 20, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Nguồn Khách hàng giới thiệu', 'criteria_type' => 'source', 'criteria_value' => 'Giới thiệu', 'points' => 25, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Nhu cầu Triển khai CRM', 'criteria_type' => 'interest_demand', 'criteria_value' => 'CRM Enterprise', 'points' => 20, 'is_active' => true, 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Seed Lead Assignment Rules (S4-06)
        if (\App\Models\LeadAssignmentRule::count() === 0) {
            \App\Models\LeadAssignmentRule::insert([
                ['name' => 'Phân bổ theo khu vực Miền Bắc', 'priority' => 1, 'condition_type' => 'region', 'condition_value' => 'Hà Nội', 'assign_to_user_id' => $salesA->id, 'assign_to_group_id' => $groupA->id, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Phân bổ theo khu vực Miền Nam', 'priority' => 2, 'condition_type' => 'region', 'condition_value' => 'TP. Hồ Chí Minh', 'assign_to_user_id' => $salesB->id, 'assign_to_group_id' => $groupC->id, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Phân bổ xoay vòng Round-Robin cho nhóm', 'priority' => 3, 'condition_type' => 'round_robin', 'condition_value' => null, 'assign_to_user_id' => null, 'assign_to_group_id' => $groupA->id, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Seed Opportunity Stage Gates (S5-04)
        if (\App\Models\OpportunityStageGate::count() === 0) {
            \App\Models\OpportunityStageGate::insert([
                ['stage_key' => 'khao_sat', 'stage_name' => 'Khảo sát nhu cầu', 'require_activity_count' => 1, 'require_product' => false, 'require_contact' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['stage_key' => 'bao_gia', 'stage_name' => 'Báo giá & Đề xuất', 'require_activity_count' => 0, 'require_product' => true, 'require_contact' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['stage_key' => 'thuong_thao', 'stage_name' => 'Đàm phán & Thương thảo', 'require_activity_count' => 1, 'require_product' => true, 'require_contact' => true, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Seed Sample Leads if none exist
        if (\App\Models\Lead::count() === 0) {
            \App\Models\Lead::create([
                'name' => 'Ngô Bảo Châu',
                'email' => 'chau.nb@mathcorp.vn',
                'phone' => '0912345678',
                'company' => 'Viện Nghiên cứu Toán Tin Ứng dụng',
                'industry' => 'Công nghệ thông tin',
                'company_size' => '100 - 500 nhân sự',
                'interest_demand' => 'CRM Enterprise & Tích hợp ERP',
                'source' => 'Hội thảo',
                'campaign_id' => $campaign1->id,
                'status' => 'assigned',
                'score' => 85,
                'rating' => 'hot',
                'assigned_to' => $salesA->id,
                'team_leader_id' => $admin->id,
                'assigned_at' => now()->subHours(2),
                'sla_deadline' => now()->addHours(22),
            ]);

            \App\Models\Lead::create([
                'name' => 'Vũ Thị Minh',
                'email' => 'minh.vu@logisticstt.com',
                'phone' => '0987654321',
                'company' => 'Công ty Vận tải Toàn Cầu',
                'industry' => 'Sản xuất',
                'company_size' => '20 - 100 nhân sự',
                'interest_demand' => 'Quản lý báo giá và hợp đồng',
                'source' => 'Website',
                'campaign_id' => $campaign2->id,
                'status' => 'caring',
                'score' => 55,
                'rating' => 'warm',
                'assigned_to' => $salesB->id,
                'team_leader_id' => $admin->id,
                'assigned_at' => now()->subDays(1),
                'accepted_at' => now()->subHours(20),
                'sla_deadline' => now()->subHours(1),
                'sla_flagged_at' => now()->subHours(1),
            ]);
        }
    }
}
