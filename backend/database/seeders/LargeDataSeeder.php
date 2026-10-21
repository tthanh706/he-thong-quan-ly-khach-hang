<?php

namespace Database\Seeders;

use App\Enums\CalendarItemStatusEnum;
use App\Enums\CalendarItemTypeEnum;
use App\Enums\CareStatusEnum;
use App\Enums\CareTypeEnum;
use App\Enums\LeadStatusEnum;
use App\Enums\OpportunityStatusEnum;
use App\Enums\ProductTypeEnum;
use App\Enums\SalesActivityTypeEnum;
use App\Enums\SupportPriorityEnum;
use App\Enums\SupportStatusEnum;
use App\Models\BusinessGroup;
use App\Models\CalendarItem;
use App\Models\Campaign;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\PeriodicCare;
use App\Models\Product;
use App\Models\Role;
use App\Models\SalesActivity;
use App\Models\SupportRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LargeDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::disableQueryLog();

        // 1. Users & Roles
        $admin = User::firstOrCreate(
            ['email' => 'admin@company.com'],
            ['name' => 'Admin Quản Trị', 'password' => Hash::make('Admin1234'), 'role' => 'admin']
        );

        $staffUsers = [];
        $staffNames = [
            ['name' => 'Nguyễn Văn An', 'email' => 'an.nv@company.com'],
            ['name' => 'Trần Thị Bích', 'email' => 'bich.tt@company.com'],
            ['name' => 'Lê Hoàng Cường', 'email' => 'cuong.lh@company.com'],
            ['name' => 'Phạm Thu Dung', 'email' => 'dung.pt@company.com'],
            ['name' => 'Vũ Tuấn Đạt', 'email' => 'dat.vt@company.com'],
            ['name' => 'Hoàng Minh Hải', 'email' => 'hai.hm@company.com'],
            ['name' => 'Đỗ Phương Linh', 'email' => 'linh.dp@company.com'],
            ['name' => 'Ngô Quốc Nam', 'email' => 'nam.nq@company.com'],
        ];

        $staffRole = Role::firstOrCreate(['name' => 'staff'], ['display_name' => 'Nhân viên kinh doanh']);
        $groupA = BusinessGroup::firstOrCreate(['name' => 'Nhóm Doanh nghiệp Miền Bắc']);
        $groupB = BusinessGroup::firstOrCreate(['name' => 'Nhóm Khách hàng Cá nhân']);
        $groupC = BusinessGroup::firstOrCreate(['name' => 'Chi nhánh Miền Nam']);
        $groups = [$groupA, $groupB, $groupC];

        foreach ($staffNames as $idx => $s) {
            $user = User::firstOrCreate(
                ['email' => $s['email']],
                ['name' => $s['name'], 'password' => Hash::make('Staff1234'), 'role' => 'staff']
            );
            if (!$user->roles()->where('roles.id', $staffRole->id)->exists()) {
                $user->roles()->attach($staffRole->id);
            }
            $targetGroup = $groups[$idx % count($groups)];
            $user->businessGroups()->syncWithoutDetaching([$targetGroup->id]);
            $staffUsers[] = $user;
        }

        // 2. Products
        $productsData = [
            ['sku' => 'CRM-ENT-01', 'name' => 'Gói CRM Enterprise Vĩnh Viễn', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Bản quyền', 'list_price' => 350000000, 'description' => 'Hệ thống CRM toàn diện không giới hạn người dùng'],
            ['sku' => 'CRM-PRO-01', 'name' => 'Gói CRM Professional Hàng Năm', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Năm', 'list_price' => 75000000, 'description' => 'Gói thuê bao CRM chuyên nghiệp 50 người dùng'],
            ['sku' => 'CLOUD-INFRA-01', 'name' => 'Hạ tầng Cloud Server Hi-End', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Tháng', 'list_price' => 25000000, 'description' => 'Dedicated Cloud Server SLA 99.99%'],
            ['sku' => 'ERP-CONN-01', 'name' => 'Module Tích Hợp ERP & SAP', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'list_price' => 180000000, 'description' => 'Kết nối đồng bộ 2 chiều dữ liệu hóa đơn và tồn kho'],
            ['sku' => 'CALL-VOIP-01', 'name' => 'Tổng đài Cloud PBX Tích Hợp', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Gói', 'list_price' => 45000000, 'description' => 'Ghi âm cuộc gọi tự động tích hợp pop-up màn hình CRM'],
            ['sku' => 'SRV-IMPL-01', 'name' => 'Dịch vụ Tư vấn Triển khai Hệ thống', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Dự án', 'list_price' => 120000000, 'description' => 'Đội ngũ chuyên gia cài đặt, chuẩn hóa quy trình và đào tạo'],
            ['sku' => 'SRV-CUSTOM-01', 'name' => 'Dịch vụ May đo & Phát triển Tính năng', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Man-month', 'list_price' => 80000000, 'description' => 'Lập trình tính năng riêng biệt theo yêu cầu đặc thù'],
            ['sku' => 'SRV-MIGR-01', 'name' => 'Dịch vụ Di chuyển & Làm sạch Dữ liệu', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Gói', 'list_price' => 50000000, 'description' => 'Chuyển đổi dữ liệu từ hệ thống cũ sang nền tảng mới an toàn'],
            ['sku' => 'SRV-SUPP-PREM', 'name' => 'Hợp đồng Bảo trì & Hỗ trợ Cao cấp 24/7', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Năm', 'list_price' => 60000000, 'description' => 'Hỗ trợ kỹ thuật khẩn cấp cam kết SLA phản hồi dưới 30 phút'],
            ['sku' => 'SRV-TRAIN-01', 'name' => 'Khóa Đào tạo Quản trị & Vận hành CRM', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Khóa', 'list_price' => 30000000, 'description' => 'Chương trình đào tạo chuyển giao công nghệ cho đội ngũ nội bộ'],
        ];

        $productModels = [];
        foreach ($productsData as $p) {
            $productModels[] = Product::firstOrCreate(
                ['sku' => $p['sku']],
                array_merge($p, ['currency' => 'VND', 'is_active' => true])
            );
        }

        // 3. Campaigns
        $campaignsData = [
            ['name' => 'Chiến dịch Hội thảo Chuyển đổi số 2026', 'channel' => 'Hội thảo', 'budget' => 150000000, 'target_leads' => 120],
            ['name' => 'Quảng cáo Google Search Doanh nghiệp', 'channel' => 'Google Ads', 'budget' => 90000000, 'target_leads' => 200],
            ['name' => 'Email Marketing Khách hàng B2B Tiềm năng', 'channel' => 'Email', 'budget' => 30000000, 'target_leads' => 80],
            ['name' => 'Chương trình Khách hàng Giới thiệu Đối tác', 'channel' => 'Giới thiệu', 'budget' => 50000000, 'target_leads' => 60],
            ['name' => 'Triển lãm Công nghệ Quốc tế Vietnam ICT Comm', 'channel' => 'Triển lãm', 'budget' => 220000000, 'target_leads' => 180],
        ];

        $campaignModels = [];
        foreach ($campaignsData as $c) {
            $campaignModels[] = Campaign::firstOrCreate(
                ['name' => $c['name']],
                [
                    'description' => 'Chiến dịch xúc tiến kinh doanh giải pháp CRM',
                    'channel' => $c['channel'],
                    'status' => 'active',
                    'starts_at' => Carbon::now()->subMonths(2),
                    'ends_at' => Carbon::now()->addMonths(4),
                    'budget' => $c['budget'],
                    'target_leads' => $c['target_leads'],
                    'target_revenue' => $c['budget'] * 15,
                    'created_by' => $admin->id,
                ]
            );
        }

        // 4. Generate ~120 Customers
        $companyPrefixes = ['Công ty Cổ phần', 'Công ty TNHH', 'Tập đoàn', 'Tổng Công ty', 'Công ty TNHH MTV'];
        $companyNames = [
            'Công nghệ Thông tin Đông Á', 'Viễn thông Toàn Cầu Techcom', 'Giải pháp Phần mềm Ánh Dương',
            'Sản xuất Bao bì Đại Lục', 'Cơ khí Chính xác Thăng Long', 'Thực phẩm Sạch Hưng Thịnh',
            'Dược phẩm & Y tế Bảo An', 'Logistics & Vận tải Bắc Nam', 'Thương mại Dịch vụ Nam Hải',
            'Tài chính & Đầu tư Thịnh Vượng', 'Xây dựng Hạ tầng Đô thị Landmark', 'Bất động sản Phúc Lộc Thọ',
            'May mặc Xuất khẩu Song Hành', 'Năng lượng Tái tạo Xanh', 'Thương mại Điện tử Alpha',
            'Nội thất & Kiến trúc Tân Á', 'Hóa chất & Vật liệu Mới Hà An', 'Nông nghiệp Công nghệ cao Việt',
            'Chuỗi Cung ứng Toàn Cầu Link', 'Vận tải Hàng hải Biển Đông', 'Bảo hiểm & Quản lý Rủi ro Tâm An',
            'Công nghệ Trí tuệ Nhân tạo NextGen', 'Bán lẻ & Tiêu dùng Thông minh SmartShop', 'Chế tạo Cơ điện Vĩnh Phát',
        ];

        $cities = [
            'Hà Nội' => ['Duy Tân, Cầu Giấy', 'Hoàng Đạo Thúy, Thanh Xuân', 'Phạm Hùng, Nam Từ Liêm', 'Trần Hưng Đạo, Hoàn Kiếm', 'Kim Mã, Ba Đình'],
            'Hồ Chí Minh' => ['Nguyễn Huệ, Quận 1', 'Điện Biên Phủ, Bình Thạnh', 'Khu công nghệ cao, TP. Thủ Đức', 'Võ Văn Kiệt, Quận 5', 'Cộng Hòa, Tân Bình'],
            'Đà Nẵng' => ['Nguyễn Văn Linh, Hải Châu', 'Khu công nghiệp Hòa Khánh, Liên Chiểu', 'Võ Nguyên Giáp, Sơn Trà'],
            'Bình Dương' => ['Đại lộ Bình Dương, Thuận An', 'KCN VSIP 1, TP. Dĩ An', 'TP. Mới Bình Dương'],
            'Hải Phòng' => ['Lê Hồng Phong, Ngô Quyền', 'KCN Đình Vũ, Hải An', 'Trần Phú, Hồng Bàng'],
        ];

        $industries = [
            'Công nghệ thông tin', 'Sản xuất & Chế biến', 'Bán lẻ & Phân phối',
            'Logistics & Kho bãi', 'Tài chính - Ngân hàng', 'Bất động sản & Xây dựng',
            'Dược phẩm & Y tế', 'Dịch vụ Doanh nghiệp',
        ];

        $sizes = [
            Customer::SIZE_MICRO,
            Customer::SIZE_SMALL,
            Customer::SIZE_MEDIUM,
            Customer::SIZE_LARGE,
        ];

        $statuses = [
            Customer::STATUS_LEAD,
            Customer::STATUS_IN_PROGRESS,
            Customer::STATUS_CUSTOMER,
            Customer::STATUS_CUSTOMER,
            Customer::STATUS_CUSTOMER,
            Customer::STATUS_STOPPED,
        ];

        $existingCustomerCount = Customer::count();
        $targetCustomers = 120;
        $customersToCreate = max(0, $targetCustomers - $existingCustomerCount);

        $customerModels = Customer::all()->all();

        for ($i = 0; $i < $customersToCreate; $i++) {
            $prefix = $companyPrefixes[array_rand($companyPrefixes)];
            $baseName = $companyNames[array_rand($companyNames)];
            $codeSuffix = strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 4));
            $name = "$prefix $baseName - CN $codeSuffix";
            $code = 'KH-' . str_pad((string)($existingCustomerCount + $i + 1), 4, '0', STR_PAD_LEFT);
            $tax = '0' . mt_rand(100000000, 999999999);

            $cityKeys = array_keys($cities);
            $chosenCity = $cityKeys[array_rand($cityKeys)];
            $street = $cities[$chosenCity][array_rand($cities[$chosenCity])];
            $address = "$street, $chosenCity";

            $owner = $staffUsers[array_rand($staffUsers)];
            $industry = $industries[array_rand($industries)];
            $size = $sizes[array_rand($sizes)];
            $status = $statuses[array_rand($statuses)];

            $cust = Customer::create([
                'code' => $code,
                'name' => $name,
                'tax_code' => $tax,
                'industry' => $industry,
                'company_size' => $size,
                'address' => $address,
                'area' => $chosenCity,
                'owner_id' => $owner->id,
                'status' => $status,
                'email' => strtolower("contact.$codeSuffix@corp.vn"),
                'phone' => '024' . mt_rand(3000000, 9999999),
                'value' => mt_rand(50, 2500) * 1000000,
                'is_active' => true,
                'source' => ['Website', 'Hội thảo', 'Giới thiệu', 'Google Ads', 'Triển lãm'][array_rand(['Website', 'Hội thảo', 'Giới thiệu', 'Google Ads', 'Triển lãm'])],
                'notes' => 'Khách hàng doanh nghiệp được tạo tự động để thử nghiệm hệ thống.',
            ]);

            $customerModels[] = $cust;
        }

        // 5. Generate Contacts (~200 records)
        $firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Đặng', 'Bùi', 'Hồ', 'Ngô', 'Dương'];
        $middleNames = ['Văn', 'Thị', 'Đức', 'Thanh', 'Hữu', 'Ngọc', 'Quốc', 'Hồng', 'Minh', 'Gia'];
        $lastNames = ['Anh', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hải', 'Khánh', 'Linh', 'Long', 'Mai', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Tuấn', 'Trang', 'Vinh'];

        $jobTitles = [
            'Tổng Giám đốc (CEO)' => 'Ban Giám đốc',
            'Giám đốc Công nghệ (CTO)' => 'Ban Công nghệ Thông tin',
            'Giám đốc Vận hành (COO)' => 'Khối Vận hành',
            'Trưởng phòng Mua sắm & Đấu thầu' => 'Phòng Mua hàng',
            'Kế toán trưởng (CFO)' => 'Phòng Tài chính Kế toán',
            'Trưởng phòng Kinh doanh' => 'Phòng Phát triển Kinh doanh',
            'Trưởng phòng Marketing' => 'Phòng Tiếp thị',
            'Chuyên viên Mua sắm Cấp cao' => 'Phòng Mua hàng',
            'Quản lý Dự án CNTT' => 'Ban Chuyển đổi Số',
        ];

        $decisionRoles = [
            'Người quyết định cuối cùng',
            'Người đánh giá kỹ thuật',
            'Người đàm phán hợp đồng',
            'Người sử dụng trực tiếp',
            'Người đề xuất giải pháp',
        ];

        $existingContactCount = Contact::count();
        $targetContacts = 200;
        $contactsToCreate = max(0, $targetContacts - $existingContactCount);

        $contactModels = Contact::all()->all();

        for ($i = 0; $i < $contactsToCreate; $i++) {
            $fullName = $firstNames[array_rand($firstNames)] . ' ' . $middleNames[array_rand($middleNames)] . ' ' . $lastNames[array_rand($lastNames)];
            $titleKey = array_rand($jobTitles);
            $dept = $jobTitles[$titleKey];
            $parentCustomer = $customerModels[array_rand($customerModels)];
            $creator = $staffUsers[array_rand($staffUsers)];

            $contact = Contact::create([
                'customer_id' => $parentCustomer->id,
                'name' => $fullName,
                'title' => $titleKey,
                'department' => $dept,
                'phone' => '09' . mt_rand(10000000, 99999999),
                'email' => strtolower(substr(md5(uniqid()), 0, 8)) . '@' . (explode(' ', strtolower($parentCustomer->code))[0] ?? 'corp') . '.vn',
                'is_primary' => mt_rand(1, 10) <= 3,
                'role_in_decision' => $decisionRoles[array_rand($decisionRoles)],
                'notes' => 'Đầu mối liên hệ quan trọng cho các hợp đồng của khách hàng.',
                'created_by' => $creator->id,
            ]);

            $contactModels[] = $contact;
        }

        // 6. Generate Leads (~250 records)
        $leadSources = ['Website', 'Hội thảo', 'Google Ads', 'Facebook Ads', 'Giới thiệu', 'Triển lãm', 'Cold Call'];
        $leadDemands = [
            'Triển khai CRM quản lý khách hàng doanh nghiệp',
            'Giải pháp chấm điểm và phân bổ tự động lead',
            'Tích hợp tổng đài Cloud PBX ghi âm cuộc gọi',
            'Báo cáo doanh số và dự báo doanh thu Weighted Forecast',
            'Nâng cấp hệ thống quản lý hợp đồng và cảnh báo gia hạn',
            'Đào tạo và tư vấn chuyển đổi số quy trình bán hàng B2B',
        ];

        $leadStatuses = [
            LeadStatusEnum::NEW,
            LeadStatusEnum::ASSIGNED,
            LeadStatusEnum::CARING,
            LeadStatusEnum::CARING,
            LeadStatusEnum::CONVERTED,
            LeadStatusEnum::WAITING_ASSIGNMENT,
        ];

        $existingLeadCount = Lead::count();
        $targetLeads = 250;
        $leadsToCreate = max(0, $targetLeads - $existingLeadCount);

        for ($i = 0; $i < $leadsToCreate; $i++) {
            $name = $firstNames[array_rand($firstNames)] . ' ' . $middleNames[array_rand($middleNames)] . ' ' . $lastNames[array_rand($lastNames)];
            $company = $companyPrefixes[array_rand($companyPrefixes)] . ' ' . $companyNames[array_rand($companyNames)];
            $score = mt_rand(15, 95);
            $rating = $score >= 70 ? 'hot' : ($score >= 40 ? 'warm' : 'cold');
            $status = $leadStatuses[array_rand($leadStatuses)];
            $assignee = in_array($status, [LeadStatusEnum::ASSIGNED, LeadStatusEnum::CARING, LeadStatusEnum::CONVERTED]) ? $staffUsers[array_rand($staffUsers)] : null;
            $campaign = $campaignModels[array_rand($campaignModels)];

            $assignedAt = $assignee ? Carbon::now()->subDays(mt_rand(1, 20)) : null;
            $slaDeadline = $assignedAt ? (clone $assignedAt)->addHours(24) : null;
            $acceptedAt = ($assignee && mt_rand(1, 10) > 3) ? (clone $assignedAt)->addHours(mt_rand(1, 10)) : null;

            Lead::create([
                'name' => $name,
                'email' => 'lead.' . mt_rand(1000, 999999) . '@' . ['gmail.com', 'outlook.com', 'yahoo.com', 'company.vn'][array_rand(['gmail.com', 'outlook.com', 'yahoo.com', 'company.vn'])],
                'phone' => '09' . mt_rand(10000000, 99999999),
                'company' => $company,
                'industry' => $industries[array_rand($industries)],
                'company_size' => $sizes[array_rand($sizes)],
                'interest_demand' => $leadDemands[array_rand($leadDemands)],
                'source' => $leadSources[array_rand($leadSources)],
                'campaign_id' => $campaign->id,
                'ip_address' => '113.190.' . mt_rand(1, 254) . '.' . mt_rand(1, 254),
                'assigned_to' => $assignee?->id,
                'team_leader_id' => $admin->id,
                'status' => $status,
                'score' => $score,
                'rating' => $rating,
                'assigned_at' => $assignedAt,
                'accepted_at' => $acceptedAt,
                'sla_deadline' => $slaDeadline,
                'sla_flagged_at' => ($slaDeadline && $slaDeadline->isPast() && !$acceptedAt) ? $slaDeadline : null,
            ]);
        }

        // 7. Generate Opportunities (~150 records)
        $stages = [
            'khao_sat' => ['prob' => 10, 'status' => OpportunityStatusEnum::OPEN],
            'demo' => ['prob' => 25, 'status' => OpportunityStatusEnum::OPEN],
            'bao_gia' => ['prob' => 50, 'status' => OpportunityStatusEnum::OPEN],
            'thuong_thao' => ['prob' => 75, 'status' => OpportunityStatusEnum::OPEN],
            'chot_thanh_cong' => ['prob' => 100, 'status' => OpportunityStatusEnum::WON],
            'that_bai' => ['prob' => 0, 'status' => OpportunityStatusEnum::LOST],
        ];

        $oppTitles = [
            'Triển khai nền tảng CRM Enterprise toàn diện',
            'Gói tích hợp ERP SAP & Quản lý đơn hàng tự động',
            'Thuê bao Cloud Server & Cổng API thanh toán',
            'Hệ thống Quản lý Báo giá và Điều chuyển Quyền sở hữu',
            'Chuyển đổi số dữ liệu khách hàng & Chuẩn hóa quy trình bán hàng',
            'Bộ giải pháp Tổng đài Call Center tích hợp CRM 360',
            'Nâng cấp hệ thống giám sát và cảnh báo hợp đồng',
            'Bản quyền CRM Professional & Đào tạo nghiệp vụ kinh doanh',
            'Bảo trì định kỳ và hỗ trợ kỹ thuật chuyên sâu 24/7',
        ];

        $existingOppCount = Opportunity::count();
        $targetOpps = 150;
        $oppsToCreate = max(0, $targetOpps - $existingOppCount);

        $oppModels = Opportunity::all()->all();

        for ($i = 0; $i < $oppsToCreate; $i++) {
            $stageKey = array_keys($stages)[array_rand(array_keys($stages))];
            $stageInfo = $stages[$stageKey];
            $parentCust = $customerModels[array_rand($customerModels)];
            $owner = $staffUsers[array_rand($staffUsers)];
            $amount = mt_rand(40, 2800) * 1000000;
            $titleBase = $oppTitles[array_rand($oppTitles)];
            $title = "$titleBase - " . ($parentCust->code ?? 'KH');

            $expectedClose = $stageKey === 'chot_thanh_cong' || $stageKey === 'that_bai'
                ? Carbon::now()->subDays(mt_rand(5, 60))
                : Carbon::now()->addDays(mt_rand(10, 90));

            $opp = Opportunity::create([
                'title' => $title,
                'name' => $title,
                'amount' => $amount,
                'value' => $amount,
                'stage' => $stageKey,
                'status' => $stageInfo['status'],
                'win_probability' => $stageInfo['prob'],
                'expected_close_date' => $expectedClose->toDateString(),
                'owner_id' => $owner->id,
                'owner_user_id' => $owner->id,
                'team_leader_id' => $admin->id,
                'customer_id' => $parentCust->id,
                'is_closed' => in_array($stageKey, ['chot_thanh_cong', 'that_bai']),
                'closed_outcome' => $stageKey === 'chot_thanh_cong' ? 'won' : ($stageKey === 'that_bai' ? 'lost' : null),
                'actual_won_value' => $stageKey === 'chot_thanh_cong' ? $amount : null,
                'contract_signed_at' => $stageKey === 'chot_thanh_cong' ? $expectedClose : null,
                'loss_reason' => $stageKey === 'that_bai' ? ['Giá thành cao hơn ngân sách dự kiến', 'Đối thủ cạnh tranh giảm giá sâu', 'Thay đổi kế hoạch nội bộ'][array_rand(['Giá thành cao hơn ngân sách dự kiến', 'Đối thủ cạnh tranh giảm giá sâu', 'Thay đổi kế hoạch nội bộ'])] : null,
                'last_activity_at' => Carbon::now()->subDays(mt_rand(1, 25)),
                'probability_note' => 'Cơ hội kinh doanh trọng điểm quý này.',
            ]);

            $oppModels[] = $opp;
        }

        // 8. Generate CalendarItems (~120 records)
        $calendarTitles = [
            'meeting' => [
                'Gặp mặt trực tiếp giới thiệu giải pháp CRM',
                'Họp demo tính năng phân bổ lead tự động',
                'Thương thảo điều khoản hợp đồng & phương thức thanh toán',
                'Báo cáo tiến độ triển khai dự án định kỳ',
                'Khảo sát thực địa hạ tầng công nghệ thông tin',
                'Trao đổi yêu cầu may đo tính năng riêng',
            ],
            'task' => [
                'Gửi báo giá chi tiết và phương án kỹ thuật',
                'Chuẩn bị tài liệu thuyết trình năng lực công ty',
                'Gọi điện xác nhận lịch hẹn demo với khách hàng',
                'Kiểm tra lại hợp đồng mẫu và xin ý kiến pháp lý',
                'Gửi biên bản nghiệm thu giai đoạn 1',
                'Hỏi thăm phản hồi sau buổi đào tạo người dùng',
            ],
        ];

        $calendarStatuses = [
            CalendarItemStatusEnum::SCHEDULED,
            CalendarItemStatusEnum::COMPLETED,
            CalendarItemStatusEnum::POSTPONED,
        ];

        $priorities = ['low', 'normal', 'high', 'urgent'];

        $existingCalendarCount = CalendarItem::count();
        $targetCalendars = 120;
        $calendarsToCreate = max(0, $targetCalendars - $existingCalendarCount);

        for ($i = 0; $i < $calendarsToCreate; $i++) {
            $type = mt_rand(1, 10) <= 4 ? CalendarItemTypeEnum::MEETING : CalendarItemTypeEnum::TASK;
            $typeKey = $type->value;
            $title = $calendarTitles[$typeKey][array_rand($calendarTitles[$typeKey])];
            $cust = $customerModels[array_rand($customerModels)];
            $assigned = $staffUsers[array_rand($staffUsers)];
            $status = $calendarStatuses[array_rand($calendarStatuses)];

            $dayOffset = mt_rand(-15, 30);
            $startAt = Carbon::now()->addDays($dayOffset)->setHour(mt_rand(8, 16))->setMinute([0, 15, 30, 45][array_rand([0, 15, 30, 45])]);
            $endAt = (clone $startAt)->addMinutes([30, 45, 60, 90][array_rand([30, 45, 60, 90])]);
            $dueAt = (clone $startAt)->setHour(17)->setMinute(30);

            CalendarItem::create([
                'title' => "$title - " . ($cust->name ?? 'Khách hàng'),
                'item_type' => $type,
                'priority' => $priorities[array_rand($priorities)],
                'assigned_user_id' => $assigned->id,
                'team_leader_id' => $admin->id,
                'customer_id' => $cust->id,
                'start_at' => $type === CalendarItemTypeEnum::MEETING ? $startAt : null,
                'end_at' => $type === CalendarItemTypeEnum::MEETING ? $endAt : null,
                'due_at' => $type === CalendarItemTypeEnum::TASK ? $dueAt : null,
                'status' => $status,
                'completed_at' => $status === CalendarItemStatusEnum::COMPLETED ? Carbon::now()->subDays(mt_rand(1, 10)) : null,
                'postpone_reason' => $status === CalendarItemStatusEnum::POSTPONED ? 'Khách hàng bận công tác đột xuất, dời lịch tuần tới.' : null,
                'reminder_minutes' => 15,
                'location' => $type === CalendarItemTypeEnum::MEETING ? ['Văn phòng khách hàng', 'Google Meet / Zoom', 'Trụ sở công ty'][array_rand(['Văn phòng khách hàng', 'Google Meet / Zoom', 'Trụ sở công ty'])] : null,
                'description' => 'Mục tiêu rõ ràng, chuẩn bị đầy đủ hồ sơ trước giờ làm việc.',
            ]);
        }

        // 9. Generate SalesActivities (~150 records)
        $activityTypes = [
            SalesActivityTypeEnum::CALL,
            SalesActivityTypeEnum::CALL,
            SalesActivityTypeEnum::MEETING,
            SalesActivityTypeEnum::EMAIL,
            SalesActivityTypeEnum::NOTE,
        ];

        $activityNotes = [
            'call' => [
                'Gọi điện trao đổi nhanh về tiến độ phê duyệt đề xuất giá.',
                'Khách hàng đồng ý cuộc hẹn demo vào thứ Năm tới.',
                'Hỏi thăm tình hình vận hành sau 1 tháng sử dụng phần mềm.',
                'Số máy bận, đã để lại tin nhắn hẹn gọi lại.',
            ],
            'meeting' => [
                'Họp bàn chi tiết cấu trúc hệ thống và tích hợp dữ liệu cũ.',
                'Gặp gỡ Giám đốc Công nghệ để chốt các tiêu chí nghiệm thu.',
                'Buổi làm việc tại văn phòng khách hàng đạt kết quả tích cực.',
            ],
            'email' => [
                'Đã gửi báo giá bản cập nhật kèm các điều khoản chiết khấu.',
                'Gửi hướng dẫn sử dụng và tài liệu đặc tả API kỹ thuật.',
                'Xác nhận lại các mốc thời gian triển khai giai đoạn 1.',
            ],
            'note' => [
                'Khách hàng có thiện chí cao, ưu tiên chốt trước cuối tháng.',
                'Cần lưu ý yêu cầu bảo mật thông tin tài chính nghiêm ngặt.',
                'Đối thủ chào giá thấp hơn 10% nhưng không cam kết hỗ trợ 24/7.',
            ],
        ];

        $existingActivityCount = SalesActivity::count();
        $targetActivities = 150;
        $activitiesToCreate = max(0, $targetActivities - $existingActivityCount);

        for ($i = 0; $i < $activitiesToCreate; $i++) {
            $actType = $activityTypes[array_rand($activityTypes)];
            $actKey = $actType->value;
            $user = $staffUsers[array_rand($staffUsers)];
            $cust = $customerModels[array_rand($customerModels)];
            $notesPool = $activityNotes[$actKey] ?? $activityNotes['note'];
            $desc = $notesPool[array_rand($notesPool)];

            SalesActivity::create([
                'user_id' => $user->id,
                'team_leader_id' => $admin->id,
                'customer_id' => $cust->id,
                'activity_type' => $actType,
                'title' => strtoupper($actKey) . ' - ' . ($cust->code ?? 'KH'),
                'description' => $desc,
                'duration_minutes' => $actKey === 'call' ? mt_rand(3, 20) : ($actKey === 'meeting' ? mt_rand(30, 90) : null),
                'result' => 'Thành công',
                'call_result' => $actKey === 'call' ? ['connected', 'connected', 'busy', 'no_answer'][array_rand(['connected', 'connected', 'busy', 'no_answer'])] : null,
                'occurred_at' => Carbon::now()->subDays(mt_rand(1, 45))->setHour(mt_rand(9, 17)),
            ]);
        }

        // 10. Generate Contracts (~60 records)
        $existingContractCount = Contract::count();
        $targetContracts = 60;
        $contractsToCreate = max(0, $targetContracts - $existingContractCount);

        for ($i = 0; $i < $contractsToCreate; $i++) {
            $cust = $customerModels[array_rand($customerModels)];
            $owner = $staffUsers[array_rand($staffUsers)];
            $val = mt_rand(80, 2500) * 1000000;
            $code = 'HD-2025/' . str_pad((string)($existingContractCount + $i + 1), 4, '0', STR_PAD_LEFT);
            $startDate = Carbon::now()->subMonths(mt_rand(2, 11));
            // Mix of active, expiring soon (within 30 days), and renewed
            $durationMonths = [6, 12, 12, 12, 24][array_rand([6, 12, 12, 12, 24])];
            $endDate = (clone $startDate)->addMonths($durationMonths);

            $daysUntilEnd = Carbon::now()->diffInDays($endDate, false);
            $status = $daysUntilEnd < 0 ? 'expired' : ($daysUntilEnd <= 30 ? 'expiring_soon' : 'active');

            Contract::create([
                'customer_id' => $cust->id,
                'contract_code' => $code,
                'contract_name' => "Hợp đồng Cung cấp Giải pháp CRM - $code",
                'customer_name' => $cust->name,
                'owner_user_id' => $owner->id,
                'accountant_user_id' => $admin->id,
                'status' => $status,
                'contract_value' => $val,
                'signed_date' => (clone $startDate)->subDays(mt_rand(3, 10)),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'description' => 'Hợp đồng kinh tế cung cấp bản quyền phần mềm và dịch vụ kỹ thuật.',
            ]);
        }

        // 11. Generate SupportRequests (~40 records)
        $supportSubjects = [
            'Lỗi xuất báo cáo cơ hội kinh doanh sang định dạng Excel',
            'Không đồng bộ được danh sách liên hệ từ ứng dụng Outlook',
            'Yêu cầu cấp lại mật khẩu cho tài khoản nhân viên kinh doanh mới',
            'Tổng đài VoIP bị gián đoạn ghi âm cuộc gọi sáng nay',
            'Hướng dẫn cấu hình trường tùy chỉnh cho biểu mẫu khảo sát',
            'Hệ thống phản hồi chậm khi tải danh sách khách hàng lớn',
            'Yêu cầu tích hợp thêm cổng gửi tin nhắn SMS Brandname',
            'Cần hỗ trợ kiểm tra dữ liệu phân bổ lead vòng tròn Round-Robin',
        ];

        $existingSupportCount = SupportRequest::count();
        $targetSupports = 40;
        $supportsToCreate = max(0, $targetSupports - $existingSupportCount);

        for ($i = 0; $i < $supportsToCreate; $i++) {
            $cust = $customerModels[array_rand($customerModels)];
            $assignee = $staffUsers[array_rand($staffUsers)];
            $code = 'SR-2026-' . str_pad((string)($existingSupportCount + $i + 1), 3, '0', STR_PAD_LEFT);
            $priorities = [SupportPriorityEnum::LOW, SupportPriorityEnum::MEDIUM, SupportPriorityEnum::HIGH];
            $statuses = [SupportStatusEnum::OPEN, SupportStatusEnum::IN_PROGRESS, SupportStatusEnum::CLOSED];

            $status = $statuses[array_rand($statuses)];
            $createdAt = Carbon::now()->subDays(mt_rand(1, 30));

            SupportRequest::create([
                'code' => $code,
                'customer_id' => $cust->id,
                'subject' => $supportSubjects[array_rand($supportSubjects)],
                'description' => 'Yêu cầu được ghi nhận từ cổng hỗ trợ kỹ thuật khách hàng.',
                'priority' => $priorities[array_rand($priorities)],
                'status' => $status,
                'assignee_id' => $assignee->id,
                'created_by' => $admin->id,
                'resolved_at' => $status === SupportStatusEnum::CLOSED ? (clone $createdAt)->addHours(mt_rand(2, 24)) : null,
                'resolution_note' => $status === SupportStatusEnum::CLOSED ? 'Đã khắc phục hoàn tất và xác nhận cùng khách hàng.' : null,
                'created_at' => $createdAt,
            ]);
        }

        // 12. Generate PeriodicCares (~40 records)
        $careTypes = [
            CareTypeEnum::SYSTEM_MAINTENANCE,
            CareTypeEnum::SATISFACTION_SURVEY,
            CareTypeEnum::CONTRACT_RENEWAL,
        ];

        $careStatuses = [CareStatusEnum::PENDING, CareStatusEnum::DONE];

        $existingCareCount = PeriodicCare::count();
        $targetCares = 40;
        $caresToCreate = max(0, $targetCares - $existingCareCount);

        for ($i = 0; $i < $caresToCreate; $i++) {
            $cust = $customerModels[array_rand($customerModels)];
            $assignee = $staffUsers[array_rand($staffUsers)];
            $type = $careTypes[array_rand($careTypes)];
            $status = $careStatuses[array_rand($careStatuses)];
            $schedDate = Carbon::now()->addDays(mt_rand(-10, 30));

            PeriodicCare::create([
                'customer_id' => $cust->id,
                'care_type' => $type,
                'scheduled_date' => $schedDate,
                'assignee_id' => $assignee->id,
                'status' => $status,
                'notes' => 'Chương trình chăm sóc định kỳ nâng cao chất lượng dịch vụ khách hàng.',
                'completed_at' => $status === CareStatusEnum::DONE ? (clone $schedDate)->addHours(2) : null,
                'created_by' => $admin->id,
            ]);
        }
    }
}
