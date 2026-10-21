<?php

namespace Database\Seeders;

use App\Enums\CareStatusEnum;
use App\Enums\CareTypeEnum;
use App\Enums\CategoryTypeEnum;
use App\Enums\ProductTypeEnum;
use App\Enums\SupportPriorityEnum;
use App\Enums\SupportStatusEnum;
use App\Models\Campaign;
use App\Models\CommonCategory;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\CustomField;
use App\Models\PeriodicCare;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\WebForm;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FullCenturySeeder extends Seeder
{
    public function run(): void
    {
        DB::disableQueryLog();

        $admin = User::first();
        $staffUsers = User::where('role', 'staff')->get();
        if ($staffUsers->isEmpty()) {
            $staffUsers = collect([$admin]);
        }
        $customers = Customer::all();
        if ($customers->isEmpty()) {
            return;
        }

        // ==========================================
        // 1. CAMPAIGNS -> Reach ~105 records
        // ==========================================
        $currentCampaigns = Campaign::count();
        $campaignsNeeded = max(0, 105 - $currentCampaigns);

        $channels = [
            'Hội thảo', 'Google Ads', 'Facebook Ads', 'Email', 'Giới thiệu',
            'Triển lãm', 'LinkedIn B2B', 'Tiktok Ads', 'Zalo OA', 'Cold Outreach',
            'Báo chí & PR', 'Đối tác Công nghệ', 'Webinar Trực tuyến'
        ];

        $campaignTopics = [
            'Chuyển đổi số Quy trình Bán hàng Doanh nghiệp',
            'Xúc tiến Hệ thống CRM & Tích hợp ERP',
            'Ngày hội Khách hàng Doanh nghiệp Thân thiết',
            'Chiến dịch Thu hút Khách hàng B2B Ngành Sản xuất',
            'Hội thảo Tối ưu Hóa Chi phí Vận hành Call Center',
            'Giới thiệu Bộ Giải pháp Quản trị Khách hàng 360',
            'Chương trình Trải nghiệm 30 Ngày Cloud CRM',
            'Chiến dịch Kết nối Đối tác Công nghệ Toàn quốc',
            'Sự kiện Tech Summit Vietnam Doanh nghiệp Vừa & Nhỏ',
            'Chiến dịch Email Nuôi dưỡng Khách hàng Tiềm năng',
            'Quảng cáo Tìm kiếm Từ khóa Phần mềm Quản trị',
            'Tài trợ Hội nghị Thượng đỉnh Doanh nhân Trẻ',
            'Chương trình Ưu đãi Mùa Cao điểm Cuối Năm',
            'Gói Kích cầu Ứng dụng AI trong Chăm sóc Khách hàng',
        ];

        $campaignStatuses = ['active', 'active', 'active', 'paused', 'completed', 'draft'];

        for ($i = 0; $i < $campaignsNeeded; $i++) {
            $topic = $campaignTopics[array_rand($campaignTopics)];
            $codeNum = $currentCampaigns + $i + 1;
            $channel = $channels[array_rand($channels)];
            $status = $campaignStatuses[array_rand($campaignStatuses)];
            $budget = mt_rand(20, 250) * 1000000;
            $targetLeads = mt_rand(40, 300);
            $startDate = Carbon::now()->subMonths(mt_rand(1, 8))->addDays(mt_rand(1, 28));
            $endDate = (clone $startDate)->addMonths(mt_rand(2, 6));

            Campaign::create([
                'name' => "CD-$codeNum: $topic - Đợt " . mt_rand(1, 5),
                'description' => "Chiến dịch tiếp thị giải pháp CRM qua kênh $channel nhằm tiếp cận khách hàng mục tiêu.",
                'channel' => $channel,
                'status' => $status,
                'starts_at' => $startDate,
                'ends_at' => $endDate,
                'budget' => $budget,
                'target_leads' => $targetLeads,
                'target_revenue' => $budget * mt_rand(8, 20),
                'created_by' => $admin->id,
            ]);
        }

        // ==========================================
        // 2. PRODUCTS & SERVICES -> Reach ~105 records
        // ==========================================
        $currentProducts = Product::count();
        $productsNeeded = max(0, 105 - $currentProducts);

        $productCatalog = [
            ['name' => 'Bản quyền CRM Cloud Doanh nghiệp', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Người dùng/Năm', 'price' => 2400000],
            ['name' => 'Bản quyền CRM On-Premise Vĩnh viễn', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Server', 'price' => 180000000],
            ['name' => 'Module Quản lý Pipeline & Stage Gates Nâng cao', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 35000000],
            ['name' => 'Module Chấm điểm & Phân bổ Tự động Lead', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 28000000],
            ['name' => 'Module Báo cáo Dự báo Doanh số Weighted Forecast', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 45000000],
            ['name' => 'Tổng đài Số VoIP Tích hợp CRM 3 Chạm', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Gói', 'price' => 20000000],
            ['name' => 'Gói Lưu trữ Cloud Secure Storage 500GB', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Năm', 'price' => 15000000],
            ['name' => 'Gói Lưu trữ Cloud Secure Storage 2TB', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Năm', 'price' => 45000000],
            ['name' => 'Module Kết nối Cổng Zalo ZNS & SMS Brandname', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 25000000],
            ['name' => 'Module Tích hợp Hóa đơn Điện tử MISA & Viettel', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 30000000],
            ['name' => 'Module Quản lý Hợp đồng & Cảnh báo Hiệu lực', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Module', 'price' => 32000000],
            ['name' => 'Cổng API Gateway Kết nối Hệ thống Phía thứ ba', 'type' => ProductTypeEnum::PRODUCT, 'unit' => 'Cổng', 'price' => 50000000],
            ['name' => 'Dịch vụ Khảo sát & Chuẩn hóa Dữ liệu CRM', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Gói', 'price' => 40000000],
            ['name' => 'Dịch vụ Cài đặt & Triển khai Hệ thống Trọn gói', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Dự án', 'price' => 90000000],
            ['name' => 'Dịch vụ May đo Tính năng Theo Yêu cầu', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Man-month', 'price' => 70000000],
            ['name' => 'Dịch vụ Đào tạo Sử dụng Hệ thống Cho Đội ngũ', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Buổi', 'price' => 12000000],
            ['name' => 'Dịch vụ Giám sát & Tối ưu Hiệu năng Cơ sở Dữ liệu', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Gói/Năm', 'price' => 36000000],
            ['name' => 'Gói Bảo trì Định kỳ & Hỗ trợ Kỹ thuật Tiêu chuẩn', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Năm', 'price' => 48000000],
            ['name' => 'Gói Hỗ trợ Khẩn cấp 24/7 SLA 30 Phút', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Năm', 'price' => 85000000],
            ['name' => 'Dịch vụ Di chuyển Dữ liệu từ Excel/CRM Cũ sang', 'type' => ProductTypeEnum::SERVICE, 'unit' => 'Lần', 'price' => 25000000],
        ];

        for ($i = 0; $i < $productsNeeded; $i++) {
            $base = $productCatalog[$i % count($productCatalog)];
            $num = $currentProducts + $i + 1;
            $sku = ($base['type'] === ProductTypeEnum::PRODUCT ? 'PRD-' : 'SRV-') . str_pad((string)$num, 4, '0', STR_PAD_LEFT);
            $tier = ['Cơ bản', 'Nâng cao', 'Chuyên nghiệp', 'Doanh nghiệp', 'Đặc biệt'][$i % 5];
            $name = "{$base['name']} ($tier - Phiên bản V$num)";
            $price = $base['price'] * (1 + (($i % 4) * 0.15));

            Product::create([
                'sku' => $sku,
                'name' => $name,
                'type' => $base['type'],
                'unit' => $base['unit'],
                'list_price' => $price,
                'currency' => 'VND',
                'description' => "Sản phẩm/dịch vụ $name phục vụ khách hàng doanh nghiệp B2B.",
                'is_active' => true,
            ]);
        }

        // ==========================================
        // 3. PRICE LISTS & PRICE LIST ITEMS
        // ==========================================
        if (PriceList::count() === 0) {
            $priceListsData = [
                ['code' => 'PL-STANDARD-2026', 'name' => 'Bảng giá Tiêu chuẩn 2026', 'is_standard' => true],
                ['code' => 'PL-VIP-PARTNER', 'name' => 'Bảng giá Đối tác Chiến lược & VIP (Giảm 15%)', 'is_standard' => false],
                ['code' => 'PL-GOV-ENTERPRISE', 'name' => 'Bảng giá Khối Cơ quan & Tập đoàn Lớn', 'is_standard' => false],
                ['code' => 'PL-SME-PROMO', 'name' => 'Bảng giá Ưu đãi Doanh nghiệp Vừa và Nhỏ SME', 'is_standard' => false],
                ['code' => 'PL-RENEWAL-2026', 'name' => 'Bảng giá Gia hạn Dịch vụ & Nâng cấp Hệ thống', 'is_standard' => false],
            ];

            $allProducts = Product::all();
            foreach ($priceListsData as $plData) {
                $pl = PriceList::create([
                    'code' => $plData['code'],
                    'name' => $plData['name'],
                    'currency' => 'VND',
                    'is_standard' => $plData['is_standard'],
                    'is_active' => true,
                    'effective_from' => Carbon::now()->startOfYear(),
                    'effective_to' => Carbon::now()->endOfYear(),
                    'note' => 'Bảng giá áp dụng chính thức toàn hệ thống.',
                ]);

                // Seed items for this price list
                foreach ($allProducts->take(25) as $prod) {
                    $discount = $plData['is_standard'] ? 1.0 : ($plData['code'] === 'PL-VIP-PARTNER' ? 0.85 : 0.90);
                    PriceListItem::create([
                        'price_list_id' => $pl->id,
                        'product_id' => $prod->id,
                        'unit_price' => (float)$prod->list_price * $discount,
                        'min_qty' => 1,
                    ]);
                }
            }
        }

        // ==========================================
        // 4. CONTRACTS -> Reach ~105 records
        // ==========================================
        $currentContracts = Contract::count();
        $contractsNeeded = max(0, 105 - $currentContracts);

        for ($i = 0; $i < $contractsNeeded; $i++) {
            $cust = $customers[array_rand($customers->all())];
            $owner = $staffUsers[array_rand($staffUsers->all())];
            $code = 'HD-2025/' . str_pad((string)($currentContracts + $i + 1), 4, '0', STR_PAD_LEFT);
            $val = mt_rand(60, 2800) * 1000000;
            $startDate = Carbon::now()->subMonths(mt_rand(1, 10));
            $duration = [6, 12, 12, 24][array_rand([6, 12, 12, 24])];
            $endDate = (clone $startDate)->addMonths($duration);
            $daysLeft = Carbon::now()->diffInDays($endDate, false);
            $status = $daysLeft < 0 ? 'expired' : ($daysLeft <= 30 ? 'expiring_soon' : 'active');

            Contract::create([
                'customer_id' => $cust->id,
                'contract_code' => $code,
                'contract_name' => "Hợp đồng Dịch vụ Phần mềm & Vận hành - $code",
                'customer_name' => $cust->name,
                'owner_user_id' => $owner->id,
                'accountant_user_id' => $admin->id,
                'status' => $status,
                'contract_value' => $val,
                'signed_date' => (clone $startDate)->subDays(mt_rand(2, 7)),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'description' => 'Hợp đồng thương mại cung cấp giải pháp và đào tạo nghiệp vụ.',
            ]);
        }

        // ==========================================
        // 5. SUPPORT REQUESTS -> Reach ~105 records
        // ==========================================
        $currentSupports = SupportRequest::count();
        $supportsNeeded = max(0, 105 - $currentSupports);

        $ticketSubjects = [
            'Lỗi không tải được dữ liệu xuất Excel cơ hội bán hàng',
            'Cần hướng dẫn thiết lập quy tắc chấm điểm lead tự động',
            'Không nhận được thông báo nhắc việc sắp đến hạn trên màn hình',
            'Cần thêm trường tùy chỉnh Mã dự án cho phân hệ Hợp đồng',
            'Tài khoản nhân viên mới không xem được cơ hội của nhóm',
            'Tổng đài VoIP bị ngắt kết nối khi ghi âm cuộc gọi trên 15 phút',
            'Yêu cầu hỗ trợ tích hợp Web Form lên website landing page',
            'Báo cáo doanh số tháng hiển thị lệch so với số thực thu',
            'Kiểm tra lại cơ chế bảo vệ chống spam theo địa chỉ IP',
            'Hỗ trợ khôi phục cơ hội vô tình bị đánh dấu đóng thất bại',
            'Cập nhật lại chữ ký email và số hotline hiển thị trong hồ sơ',
            'Cần nâng cấp giới hạn dung lượng tệp đính kèm lên 50MB',
            'Dữ liệu khách hàng từ file Excel bị trùng số điện thoại',
            'Yêu cầu mở quyền ghi đè điều kiện chuyển giai đoạn cho Trưởng nhóm',
        ];

        for ($i = 0; $i < $supportsNeeded; $i++) {
            $cust = $customers[array_rand($customers->all())];
            $assignee = $staffUsers[array_rand($staffUsers->all())];
            $code = 'SR-2026-' . str_pad((string)($currentSupports + $i + 1), 4, '0', STR_PAD_LEFT);
            $priorities = [SupportPriorityEnum::LOW, SupportPriorityEnum::MEDIUM, SupportPriorityEnum::HIGH];
            $statuses = [SupportStatusEnum::OPEN, SupportStatusEnum::IN_PROGRESS, SupportStatusEnum::CLOSED];
            $status = $statuses[array_rand($statuses)];
            $createdAt = Carbon::now()->subDays(mt_rand(1, 40));

            SupportRequest::create([
                'code' => $code,
                'customer_id' => $cust->id,
                'subject' => $ticketSubjects[array_rand($ticketSubjects)],
                'description' => 'Khách hàng liên hệ qua tổng đài yêu cầu xử lý kỹ thuật.',
                'priority' => $priorities[array_rand($priorities)],
                'status' => $status,
                'assignee_id' => $assignee->id,
                'created_by' => $admin->id,
                'resolved_at' => $status === SupportStatusEnum::CLOSED ? (clone $createdAt)->addHours(mt_rand(2, 36)) : null,
                'resolution_note' => $status === SupportStatusEnum::CLOSED ? 'Đã khắc phục lỗi và hoàn thành nghiệm thu cùng khách hàng.' : null,
                'created_at' => $createdAt,
            ]);
        }

        // ==========================================
        // 6. PERIODIC CARE -> Reach ~105 records
        // ==========================================
        $currentCares = PeriodicCare::count();
        $caresNeeded = max(0, 105 - $currentCares);

        $careTypes = [
            CareTypeEnum::SYSTEM_MAINTENANCE,
            CareTypeEnum::SATISFACTION_SURVEY,
            CareTypeEnum::CONTRACT_RENEWAL,
        ];
        $careStatuses = [CareStatusEnum::PENDING, CareStatusEnum::DONE];

        for ($i = 0; $i < $caresNeeded; $i++) {
            $cust = $customers[array_rand($customers->all())];
            $assignee = $staffUsers[array_rand($staffUsers->all())];
            $type = $careTypes[array_rand($careTypes)];
            $status = $careStatuses[array_rand($careStatuses)];
            $schedDate = Carbon::now()->addDays(mt_rand(-20, 35));

            PeriodicCare::create([
                'customer_id' => $cust->id,
                'care_type' => $type,
                'scheduled_date' => $schedDate,
                'assignee_id' => $assignee->id,
                'status' => $status,
                'notes' => 'Chương trình chăm sóc định kỳ theo quy chuẩn chất lượng dịch vụ ISO 9001.',
                'completed_at' => $status === CareStatusEnum::DONE ? (clone $schedDate)->addHours(2) : null,
                'created_by' => $admin->id,
            ]);
        }

        // ==========================================
        // 7. WEB FORMS -> Generate ~25 web forms
        // ==========================================
        if (WebForm::count() < 20) {
            $webFormTitles = [
                'Biểu mẫu Đăng ký Dùng thử CRM Miễn phí 30 Ngày',
                'Biểu mẫu Đăng ký Tham gia Hội thảo Chuyển đổi số',
                'Biểu mẫu Liên hệ Tư vấn Giải pháp Doanh nghiệp',
                'Biểu mẫu Đăng ký Nhận Báo giá & Khảo sát Nhu cầu',
                'Biểu mẫu Đăng ký Khóa Đào tạo Kỹ năng Bán hàng B2B',
                'Biểu mẫu Thu thập Ý kiến Đóng góp Khách hàng',
                'Biểu mẫu Đăng ký Dịch vụ Tích hợp ERP & SAP',
                'Biểu mẫu Đăng ký Nhận Tài liệu & Sách trắng CRM 2026',
                'Biểu mẫu Tiếp nhận Yêu cầu Hợp tác Đại lý & Đối tác',
                'Biểu mẫu Đăng ký Hội thảo Trực tuyến Webinar Q4',
            ];

            for ($i = 0; $i < 20; $i++) {
                $title = $webFormTitles[$i % count($webFormTitles)] . " (Mẫu $i)";
                WebForm::create([
                    'name' => "Biểu mẫu Web Form #" . ($i + 1),
                    'code' => 'WF-' . strtoupper(Str::random(6)),
                    'embed_token' => Str::random(40),
                    'source' => ['Website', 'Landing Page', 'Facebook', 'Hội thảo'][array_rand(['Website', 'Landing Page', 'Facebook', 'Hội thảo'])],
                    'title' => $title,
                    'description' => 'Vui lòng điền đầy đủ thông tin để chuyên viên tư vấn liên hệ trong vòng 15 phút.',
                    'submit_button_text' => 'Gửi thông tin ngay',
                    'success_message' => 'Cảm ơn quý khách đã gửi thông tin! Chúng tôi sẽ phản hồi sớm nhất.',
                    'is_active' => true,
                    'submission_count' => mt_rand(10, 250),
                    'rate_limit_per_minute' => 10,
                    'created_by' => $admin->id,
                ]);
            }
        }

        // ==========================================
        // 8. COMMON CATEGORIES -> 30+ items
        // ==========================================
        if (CommonCategory::count() < 25) {
            $categories = [
                // LEAD_SOURCE
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-WEB', 'name' => 'Website Công ty', 'desc' => 'Đến từ website chính thức'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-EVENT', 'name' => 'Hội thảo & Sự kiện', 'desc' => 'Đến từ các sự kiện chuyên ngành'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-ADS', 'name' => 'Quảng cáo Trực tuyến', 'desc' => 'Google Ads, Facebook, LinkedIn'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-REF', 'name' => 'Khách hàng Giới thiệu', 'desc' => 'Đối tác và khách hàng cũ giới thiệu'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-COLD', 'name' => 'Tiếp cận Trực tiếp', 'desc' => 'Telesales và tiếp cận chủ động'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-PARTNER', 'name' => 'Kênh Đối tác Phân phối', 'desc' => 'Đại lý và nhà phân phối chuyển giao'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-EXPO', 'name' => 'Triển lãm Thương mại', 'desc' => 'Hội chợ thương mại quốc tế'],
                ['type' => CategoryTypeEnum::LEAD_SOURCE, 'code' => 'SRC-ZALO', 'name' => 'Zalo Official Account', 'desc' => 'Tương tác qua Zalo OA'],

                // INDUSTRY
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-IT', 'name' => 'Công nghệ Thông tin & Phần mềm', 'desc' => 'Phần mềm, viễn thông, bảo mật'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-MANUF', 'name' => 'Sản xuất & Chế biến Chế tạo', 'desc' => 'Nhà máy cơ khí, may mặc, bao bì'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-RETAIL', 'name' => 'Bán lẻ & Phân phối Chuỗi', 'desc' => 'Siêu thị, thời trang, tiêu dùng nhanh'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-LOGIS', 'name' => 'Vận tải, Logistics & Kho bãi', 'desc' => 'Giao nhận, kho lạnh, cảng biển'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-FIN', 'name' => 'Tài chính, Ngân hàng & Bảo hiểm', 'desc' => 'Tín dụng, bảo hiểm, chứng khoán'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-REAL', 'name' => 'Bất động sản & Xây dựng', 'desc' => 'Chủ đầu tư, tổng thầu, sàn môi giới'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-HEALTH', 'name' => 'Y tế, Dược phẩm & Chăm sóc Sức khỏe', 'desc' => 'Bệnh viện, nhà thuốc, thiết bị y tế'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-EDU', 'name' => 'Giáo dục & Đào tạo', 'desc' => 'Trường học, trung tâm đào tạo'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-HOSP', 'name' => 'Du lịch, Khách sạn & Ẩm thực', 'desc' => 'Resort, nhà hàng, lữ hành'],
                ['type' => CategoryTypeEnum::INDUSTRY, 'code' => 'IND-AGRI', 'name' => 'Nông nghiệp Công nghệ cao', 'desc' => 'Nông trại thông minh, chế biến nông sản'],

                // BUSINESS_TYPE
                ['type' => CategoryTypeEnum::BUSINESS_TYPE, 'code' => 'BT-CORP', 'name' => 'Tập đoàn Kinh tế Đa ngành', 'desc' => 'Quy mô trên 1000 nhân sự'],
                ['type' => CategoryTypeEnum::BUSINESS_TYPE, 'code' => 'BT-FDI', 'name' => 'Doanh nghiệp FDI Vốn Nước ngoài', 'desc' => 'Doanh nghiệp có vốn đầu tư nước ngoài'],
                ['type' => CategoryTypeEnum::BUSINESS_TYPE, 'code' => 'BT-SME', 'name' => 'Doanh nghiệp Vừa và Nhỏ (SME)', 'desc' => 'Quy mô từ 50 đến 200 nhân sự'],
                ['type' => CategoryTypeEnum::BUSINESS_TYPE, 'code' => 'BT-STATE', 'name' => 'Doanh nghiệp Nhà nước / Cơ quan Ban ngành', 'desc' => 'Khối cơ quan và tổng công ty nhà nước'],
                ['type' => CategoryTypeEnum::BUSINESS_TYPE, 'code' => 'BT-STARTUP', 'name' => 'Doanh nghiệp Khởi nghiệp Đổi mới Sáng tạo', 'desc' => 'Startup công nghệ tăng trưởng nhanh'],
            ];

            foreach ($categories as $idx => $cat) {
                CommonCategory::firstOrCreate(
                    ['code' => $cat['code']],
                    [
                        'category_type' => $cat['type'],
                        'name' => $cat['name'],
                        'description' => $cat['desc'],
                        'sort_order' => $idx + 1,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
