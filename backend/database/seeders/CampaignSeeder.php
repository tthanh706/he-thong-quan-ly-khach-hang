<?php

namespace Database\Seeders;

use App\Models\Campaign;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Campaign::create([
            'title' => 'Chiến dịch Khuyến mãi Mùa Thu 2026',
            'description' => 'Chương trình tri ân khách hàng giảm giá 20% toàn bộ dịch vụ.',
            'status' => 'active',
            'start_date' => '2026-09-01',
            'end_date' => '2026-10-31',
            'budget' => 50000000.00,
        ]);

        Campaign::create([
            'title' => 'Chiến dịch Tiếp thị Sản phẩm Mới',
            'description' => 'Giới thiệu dòng sản phẩm phần mềm quản lý doanh nghiệp.',
            'status' => 'draft',
            'start_date' => '2026-11-01',
            'end_date' => '2026-12-31',
            'budget' => 100000000.00,
        ]);
    }
}
