<?php

namespace Database\Seeders;

use App\Enums\CustomerStatus;
use App\Enums\OpportunityStage;
use App\Enums\QuoteStatus;
use App\Enums\Role;
use App\Models\Activity;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\Quote;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Du lieu mau giong bo voi front-end (src/data/seed.ts).
 *
 * Luu y quan trong: U1 va U2 cung thuoc nhom T1 nhung KHONG duoc thay du lieu
 * cua nhau - day la ca kiem thuer cot loi cua SCRUM-5.
 */
class DatabaseSeeder extends Seeder
{
    public const PASSWORD = '12345678';

    public function run(): void
    {
        $teams = [
            1 => 'Nhóm Bán hàng Miền Bắc',
            2 => 'Nhóm Bán hàng Miền Nam',
            3 => 'Nhóm Khách hàng Doanh nghiệp',
        ];

        foreach ($teams as $id => $name) {
            Team::updateOrCreate(['id' => $id], ['name' => $name]);
        }

        $users = [
            ['id' => 1, 'name' => 'Nguyễn Minh Anh', 'email' => 'minhanh@crm.vn', 'title' => 'Nhân viên kinh doanh', 'role' => Role::EMPLOYEE, 'team_id' => 1, 'avatar_color' => '#2563eb'],
            ['id' => 2, 'name' => 'Trần Thu Hà', 'email' => 'thuha@crm.vn', 'title' => 'Nhân viên kinh doanh', 'role' => Role::EMPLOYEE, 'team_id' => 1, 'avatar_color' => '#0d9488'],
            ['id' => 3, 'name' => 'Lê Quốc Bảo', 'email' => 'quocbao@crm.vn', 'title' => 'Trưởng nhóm', 'role' => Role::TEAM_LEAD, 'team_id' => 1, 'avatar_color' => '#7c3aed'],
            ['id' => 4, 'name' => 'Phạm Thị Dung', 'email' => 'thidung@crm.vn', 'title' => 'Nhân viên kinh doanh', 'role' => Role::EMPLOYEE, 'team_id' => 2, 'avatar_color' => '#db2777'],
            ['id' => 5, 'name' => 'Võ Đức Thắng', 'email' => 'ducthang@crm.vn', 'title' => 'Giám đốc kinh doanh', 'role' => Role::DIRECTOR, 'team_id' => 3, 'avatar_color' => '#ea580c'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['id' => $user['id']],
                array_merge($user, ['password' => Hash::make(self::PASSWORD)]),
            );
        }

        $customers = [
            ['id' => 1, 'code' => 'KH-001', 'name' => 'Công ty Cổ phần Minh Khai', 'industry' => 'Sản xuất', 'city' => 'Hà Nội', 'phone' => '024 3822 1100', 'email' => 'lienhe@minhkhai.vn', 'status' => CustomerStatus::ACTIVE, 'owner_id' => 1, 'team_id' => 1],
            ['id' => 2, 'code' => 'KH-002', 'name' => 'Công ty TNHH Đại Việt Thương Mại', 'industry' => 'Bán lẻ', 'city' => 'Hải Phòng', 'phone' => '0313 3811 200', 'email' => 'info@daivietthuongmai.vn', 'status' => CustomerStatus::LEAD, 'owner_id' => 1, 'team_id' => 1],
            ['id' => 3, 'code' => 'KH-003', 'name' => 'Tập đoàn Hoàng Gia', 'industry' => 'Bất động sản', 'city' => 'Hà Nội', 'phone' => '024 3939 0000', 'email' => 'contact@hoanggia.vn', 'status' => CustomerStatus::ACTIVE, 'owner_id' => 2, 'team_id' => 1],
            ['id' => 4, 'code' => 'KH-004', 'name' => 'Nhà phân phối Sài Gòn', 'industry' => 'Phân phối', 'city' => 'TP. Ho Chi Minh', 'phone' => '028 3822 7788', 'email' => 'sales@sgdistribution.vn', 'status' => CustomerStatus::ACTIVE, 'owner_id' => 4, 'team_id' => 2],
            ['id' => 5, 'code' => 'KH-005', 'name' => 'Ngân hàng Đầu tư Việt Thịnh', 'industry' => 'Tài chính', 'city' => 'TP. Ho Chi Minh', 'phone' => '028 3900 1234', 'email' => 'hotroi@vietthinhbank.vn', 'status' => CustomerStatus::ACTIVE, 'owner_id' => 5, 'team_id' => 3],
            ['id' => 6, 'code' => 'KH-006', 'name' => 'Chuỗi siêu thị An Phú', 'industry' => 'Bán lẻ', 'city' => 'Cần Thơ', 'phone' => '0292 3821 000', 'email' => 'cs@anphu.vn', 'status' => CustomerStatus::INACTIVE, 'owner_id' => 3, 'team_id' => 1],
            ['id' => 7, 'code' => 'KH-007', 'name' => 'Tổng công ty Xây dựng Đại Lộc', 'industry' => 'Xây dựng', 'city' => 'Đà Nẵng', 'phone' => '0236 3822 999', 'email' => 'info@dailoc-cty.vn', 'status' => CustomerStatus::LEAD, 'owner_id' => 4, 'team_id' => 2],
        ];

        foreach ($customers as $customer) {
            Customer::updateOrCreate(['id' => $customer['id']], $customer);
        }

        $opportunities = [
            ['id' => 1, 'code' => 'CO-001', 'title' => 'Triển khai phần mềm CRM 50 user', 'customer_id' => 1, 'amount' => 480000000, 'stage' => OpportunityStage::NEGOTIATION, 'close_date' => '2026-03-31', 'owner_id' => 1, 'team_id' => 1],
            ['id' => 2, 'code' => 'CO-002', 'title' => 'Gia hạn hợp đồng bảo trì', 'customer_id' => 1, 'amount' => 96000000, 'stage' => OpportunityStage::PROPOSAL, 'close_date' => '2026-04-15', 'owner_id' => 1, 'team_id' => 1],
            ['id' => 3, 'code' => 'CO-003', 'title' => 'Mở rộng 200 license cho Tập đoàn Hoàng Gia', 'customer_id' => 3, 'amount' => 1200000000, 'stage' => OpportunityStage::QUALIFIED, 'close_date' => '2026-05-20', 'owner_id' => 2, 'team_id' => 1],
            ['id' => 4, 'code' => 'CO-004', 'title' => 'Hệ thống kho & giao nhận khu vực Nam', 'customer_id' => 4, 'amount' => 320000000, 'stage' => OpportunityStage::WON, 'close_date' => '2026-02-28', 'owner_id' => 4, 'team_id' => 2],
            ['id' => 5, 'code' => 'CO-005', 'title' => 'Nền tảng số hóa hồ sơ tín dụng', 'customer_id' => 5, 'amount' => 2400000000, 'stage' => OpportunityStage::NEGOTIATION, 'close_date' => '2026-06-30', 'owner_id' => 5, 'team_id' => 3],
            ['id' => 6, 'code' => 'CO-006', 'title' => 'Tư vấn vận hành chuỗi cửa hàng', 'customer_id' => 6, 'amount' => 75000000, 'stage' => OpportunityStage::PROSPECTING, 'close_date' => '2026-07-01', 'owner_id' => 3, 'team_id' => 1],
        ];

        foreach ($opportunities as $opportunity) {
            Opportunity::updateOrCreate(['id' => $opportunity['id']], $opportunity);
        }

        $activities = [
            ['id' => 1, 'title' => 'Gọi tư vấn gói phần mềm nâng cao', 'type' => 'call', 'customer_id' => 1, 'assignee_id' => 1, 'due_at' => '2026-03-02 01:00:00', 'status' => 'done', 'owner_id' => 1, 'team_id' => 1],
            ['id' => 2, 'title' => 'Họp trình bày hợp đồng với Minh Khai', 'type' => 'meeting', 'customer_id' => 1, 'assignee_id' => 1, 'due_at' => '2026-03-20 02:00:00', 'status' => 'todo', 'owner_id' => 1, 'team_id' => 1],
            ['id' => 3, 'title' => 'Thăm khách Tập đoàn Hoàng Gia', 'type' => 'visit', 'customer_id' => 3, 'assignee_id' => 2, 'due_at' => '2026-03-05 02:00:00', 'status' => 'overdue', 'owner_id' => 2, 'team_id' => 1],
            ['id' => 4, 'title' => 'Gửi báo giá gia hạn bảo trì', 'type' => 'email', 'customer_id' => 1, 'assignee_id' => 1, 'due_at' => '2026-02-28 03:00:00', 'status' => 'done', 'owner_id' => 1, 'team_id' => 1],
            ['id' => 5, 'title' => 'Họp khởi động dự án ngân hàng', 'type' => 'meeting', 'customer_id' => 5, 'assignee_id' => 5, 'due_at' => '2026-03-11 01:00:00', 'status' => 'todo', 'owner_id' => 5, 'team_id' => 3],
            ['id' => 6, 'title' => 'Gọi xác nhận lịch bảo trì Đại Lộc', 'type' => 'call', 'customer_id' => 7, 'assignee_id' => 4, 'due_at' => '2026-03-08 02:00:00', 'status' => 'todo', 'owner_id' => 4, 'team_id' => 2],
        ];

        foreach ($activities as $activity) {
            Activity::updateOrCreate(['id' => $activity['id']], $activity);
        }

        $quotes = [
            ['id' => 1, 'code' => 'BG-2026-001', 'customer_id' => 1, 'opportunity_id' => 1, 'amount' => 480000000, 'valid_until' => '2026-04-15', 'status' => QuoteStatus::SENT, 'owner_id' => 1, 'team_id' => 1],
            ['id' => 2, 'code' => 'BG-2026-002', 'customer_id' => 1, 'opportunity_id' => 2, 'amount' => 96000000, 'valid_until' => '2026-05-01', 'status' => QuoteStatus::DRAFT, 'owner_id' => 1, 'team_id' => 1],
            ['id' => 3, 'code' => 'BG-2026-003', 'customer_id' => 3, 'opportunity_id' => 3, 'amount' => 1200000000, 'valid_until' => '2026-06-01', 'status' => QuoteStatus::SENT, 'owner_id' => 2, 'team_id' => 1],
            ['id' => 4, 'code' => 'BG-2026-004', 'customer_id' => 4, 'opportunity_id' => 4, 'amount' => 320000000, 'valid_until' => '2026-03-31', 'status' => QuoteStatus::ACCEPTED, 'owner_id' => 4, 'team_id' => 2],
            ['id' => 5, 'code' => 'BG-2026-005', 'customer_id' => 5, 'opportunity_id' => 5, 'amount' => 2400000000, 'valid_until' => '2026-07-15', 'status' => QuoteStatus::ACCEPTED, 'owner_id' => 5, 'team_id' => 3],
            ['id' => 6, 'code' => 'BG-2026-006', 'customer_id' => 6, 'opportunity_id' => 6, 'amount' => 75000000, 'valid_until' => '2026-08-01', 'status' => QuoteStatus::REJECTED, 'owner_id' => 3, 'team_id' => 1],
        ];

        foreach ($quotes as $quote) {
            Quote::updateOrCreate(['id' => $quote['id']], $quote);
        }
    }
}
