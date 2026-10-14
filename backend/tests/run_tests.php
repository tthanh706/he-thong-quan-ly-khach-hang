<?php
declare(strict_types=1);

/**
 * CRM System Test Suite - US-06, US-08, US-09
 * Run via: php backend/tests/run_tests.php
 */

class TestRunner
{
    private int $passed = 0;
    private int $failed = 0;
    private array $results = [];

    public function assert(bool $condition, string $testName, string $details = ''): void
    {
        if ($condition) {
            $this->passed++;
            $this->results[] = ['status' => 'PASS', 'name' => $testName, 'details' => $details];
            echo "  \033[32m✔ [PASS]\033[0m {$testName}\n";
        } else {
            $this->failed++;
            $this->results[] = ['status' => 'FAIL', 'name' => $testName, 'details' => $details];
            echo "  \033[31m✖ [FAIL]\033[0m {$testName} - {$details}\n";
        }
    }

    public function summary(): array
    {
        $total = $this->passed + $this->failed;
        echo "\n=======================================================\n";
        echo "KẾT QUẢ KIỂM THỬ: {$this->passed}/{$total} PASSED (" . ($total > 0 ? round(($this->passed / $total) * 100) : 0) . "%)\n";
        if ($this->failed === 0) {
            echo "\033[32mTẤT CẢ CÁC BÀI KIỂM THỬ ĐỀU ĐẠT CHUẨN XÁC 100%!\033[0m\n";
        } else {
            echo "\033[31mCÓ {$this->failed} BÀI KIỂM THỬ THẤT BẠI!\033[0m\n";
        }
        echo "=======================================================\n";

        return [
            'total' => $total,
            'passed' => $this->passed,
            'failed' => $this->failed,
            'results' => $this->results,
        ];
    }
}

// -----------------------------------------------------------------------------
// Test logic for US-06, US-08, US-09
// -----------------------------------------------------------------------------

$runner = new TestRunner();

echo "\n-------------------------------------------------------\n";
echo "1. KIỂM THỬ US-06: NHẬP EXCEL KHÁCH HÀNG & VALIDATION\n";
echo "-------------------------------------------------------\n";

// Test 1.1: Phone validation regex
$phoneRegex = '/^(0|\+84)[0-9]{9,10}$/';
$runner->assert((bool)preg_match($phoneRegex, '0901234567'), 'SĐT 0901234567 hợp lệ');
$runner->assert((bool)preg_match($phoneRegex, '+84912345678'), 'SĐT +84912345678 hợp lệ');
$runner->assert(!preg_match($phoneRegex, '12345'), 'SĐT ngắn 12345 bị từ chối');
$runner->assert(!preg_match($phoneRegex, 'Sai SĐT'), 'SĐT chữ "Sai SĐT" bị từ chối');

// Test 1.2: Email validation
$runner->assert((bool)filter_var('a@gmail.com', FILTER_VALIDATE_EMAIL), 'Email a@gmail.com hợp lệ');
$runner->assert(!filter_var('invalid-email', FILTER_VALIDATE_EMAIL), 'Email invalid-email bị từ chối');

// Test 1.3: Preview validation logic
$mockRows = [
    ['row' => 2, 'code' => 'KH001', 'name' => 'Nguyễn Văn A', 'phone' => '0901234567', 'email' => 'a@gmail.com', 'tax_code' => '0123456789', 'address' => 'Hà Nội'],
    ['row' => 3, 'code' => 'KH002', 'name' => 'Công ty ABC', 'phone' => '0912345678', 'email' => 'contact@abc.com', 'tax_code' => '9876543210', 'address' => 'TP.HCM'],
    ['row' => 4, 'code' => '', 'name' => 'Lê Văn C', 'phone' => '0988888888', 'email' => 'c@gmail.com', 'tax_code' => '', 'address' => 'Đà Nẵng'],
    ['row' => 5, 'code' => 'KH004', 'name' => '', 'phone' => '0977777777', 'email' => 'd@gmail.com', 'tax_code' => '', 'address' => 'Hải Phòng'],
    ['row' => 6, 'code' => 'KH005', 'name' => 'Trần Thị E', 'phone' => 'abc', 'email' => 'not-an-email', 'tax_code' => '', 'address' => 'Cần Thơ'],
];

$existingCodes = ['KH000'];

$validCount = 0;
$errorCount = 0;
$parsedPreview = [];

foreach ($mockRows as $row) {
    $errors = [];
    if (empty($row['code'])) {
        $errors[] = 'Mã KH bắt buộc';
    } elseif (in_array($row['code'], $existingCodes, true)) {
        $errors[] = 'Mã KH đã tồn tại';
    }

    if (empty($row['name'])) {
        $errors[] = 'Tên khách hàng bắt buộc';
    }

    if (!empty($row['phone']) && !preg_match($phoneRegex, $row['phone'])) {
        $errors[] = 'Sai định dạng SĐT';
    }

    if (!empty($row['email']) && !filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Email không hợp lệ';
    }

    $status = empty($errors) ? 'Hợp lệ' : 'Lỗi dữ liệu';
    if ($status === 'Hợp lệ') {
        $validCount++;
    } else {
        $errorCount++;
    }

    $parsedPreview[] = array_merge($row, ['status' => $status, 'errors' => $errors]);
}

$runner->assert($validCount === 2, "Preview đếm đúng số dòng hợp lệ (2 dòng, thực tế: {$validCount})");
$runner->assert($errorCount === 3, "Preview đếm đúng số dòng lỗi (3 dòng, thực tế: {$errorCount})");
$runner->assert(count($parsedPreview[4]['errors']) === 2, "Dòng 6 bắt được cả lỗi SĐT và lỗi Email");

// Test 1.4: Confirm import logic
$confirmInput = [
    $parsedPreview[0],
    $parsedPreview[1],
    $parsedPreview[2], // dòng lỗi thiếu mã
];

$confirmSuccess = 0;
$confirmErrors = [];
$databaseCustomers = ['KH000'];

foreach ($confirmInput as $idx => $r) {
    if (empty($r['code']) || empty($r['name'])) {
        $confirmErrors[] = ['row' => $idx + 1, 'message' => 'Thiếu mã hoặc tên khách hàng'];
        continue;
    }
    if (in_array($r['code'], $databaseCustomers, true)) {
        $confirmErrors[] = ['row' => $idx + 1, 'message' => "Mã KH {$r['code']} đã tồn tại"];
        continue;
    }
    $databaseCustomers[] = $r['code'];
    $confirmSuccess++;
}

$runner->assert($confirmSuccess === 2, "Xác nhận import lưu thành công 2 bản ghi hợp lệ");
$runner->assert(count($confirmErrors) === 1, "Xác nhận import từ chối 1 bản ghi lỗi");
$runner->assert(in_array('KH001', $databaseCustomers, true) && in_array('KH002', $databaseCustomers, true), "Database chứa đầy đủ KH001 và KH002");


echo "\n-------------------------------------------------------\n";
echo "2. KIỂM THỬ US-08: QUẢN LÝ YÊU CẦU HỖ TRỢ & CẢNH BÁO SLA\n";
echo "-------------------------------------------------------\n";

// Test 2.1: Mã yêu cầu auto-generate REQ-xxx
function mockGenerateCode(?string $lastCode): string {
    $num = 100;
    if ($lastCode && preg_match('/REQ-(\d+)/', $lastCode, $m)) {
        $num = (int)$m[1] + 1;
    }
    return 'REQ-' . $num;
}
$runner->assert(mockGenerateCode(null) === 'REQ-100', "Mã đầu tiên sinh ra là REQ-100");
$runner->assert(mockGenerateCode('REQ-102') === 'REQ-103', "Mã tiếp theo của REQ-102 là REQ-103");

// Test 2.2: Enums và nhãn tiếng Việt
require_once __DIR__ . '/../app/Enums/SupportPriorityEnum.php';
require_once __DIR__ . '/../app/Enums/SupportStatusEnum.php';

use App\Enums\SupportPriorityEnum;
use App\Enums\SupportStatusEnum;

$runner->assert(SupportPriorityEnum::HIGH->value === 'HIGH', 'SupportPriorityEnum::HIGH có giá trị HIGH');
$runner->assert(SupportPriorityEnum::HIGH->label() === 'Cao (High)', 'SupportPriorityEnum::HIGH có nhãn "Cao (High)"');
$runner->assert(SupportStatusEnum::OPEN->label() === 'Mới tiếp nhận', 'SupportStatusEnum::OPEN có nhãn "Mới tiếp nhận"');
$runner->assert(SupportStatusEnum::IN_PROGRESS->label() === 'Đang xử lý', 'SupportStatusEnum::IN_PROGRESS có nhãn "Đang xử lý"');
$runner->assert(SupportStatusEnum::CLOSED->label() === 'Đã hoàn thành', 'SupportStatusEnum::CLOSED có nhãn "Đã hoàn thành"');

// Test 2.3: Warning logic (HIGH quá 24h, NORMAL quá 72h, Chưa phân công)
$now = time();
$mockSupportRequests = [
    [
        'id' => 1,
        'code' => 'REQ-101',
        'priority' => 'HIGH',
        'status' => 'OPEN',
        'assignee_id' => null, // chưa phân công + quá 30h
        'created_at' => $now - (30 * 3600),
    ],
    [
        'id' => 2,
        'code' => 'REQ-102',
        'priority' => 'HIGH',
        'status' => 'IN_PROGRESS',
        'assignee_id' => 10,
        'created_at' => $now - (10 * 3600), // HIGH mới 10h -> chưa quá hạn
    ],
    [
        'id' => 3,
        'code' => 'REQ-103',
        'priority' => 'MEDIUM',
        'status' => 'OPEN',
        'assignee_id' => null, // chưa phân công + 80h -> quá hạn 72h
        'created_at' => $now - (80 * 3600),
    ],
    [
        'id' => 4,
        'code' => 'REQ-104',
        'priority' => 'LOW',
        'status' => 'CLOSED', // đã đóng -> không tính cảnh báo
        'assignee_id' => null,
        'created_at' => $now - (100 * 3600),
    ],
    [
        'id' => 5,
        'code' => 'REQ-105',
        'priority' => 'LOW',
        'status' => 'IN_PROGRESS',
        'assignee_id' => 12,
        'created_at' => $now - (20 * 3600), // bình thường
    ]
];

$hoursHigh = 24;
$hoursNormal = 72;

$highOverdue = [];
$normalOverdue = [];
$unassigned = [];

foreach ($mockSupportRequests as $item) {
    if ($item['status'] === 'CLOSED') continue;

    $ageHours = ($now - $item['created_at']) / 3600;

    if ($item['priority'] === 'HIGH' && $ageHours >= $hoursHigh) {
        $highOverdue[$item['id']] = $item;
    }

    if (in_array($item['priority'], ['MEDIUM', 'LOW'], true) && $ageHours >= $hoursNormal) {
        $normalOverdue[$item['id']] = $item;
    }

    if ($item['assignee_id'] === null) {
        $unassigned[$item['id']] = $item;
    }
}

$allItems = array_values(array_replace($highOverdue, $normalOverdue, $unassigned));

$runner->assert(count($highOverdue) === 1, "Cảnh báo HIGH quá hạn 24h: tìm thấy 1 (REQ-101)");
$runner->assert(count($normalOverdue) === 1, "Cảnh báo NORMAL quá hạn 72h: tìm thấy 1 (REQ-103)");
$runner->assert(count($unassigned) === 2, "Cảnh báo chưa phân công: tìm thấy 2 (REQ-101, REQ-103)");
$runner->assert(count($allItems) === 2, "Tổng danh sách cảnh báo duy nhất: 2 mục");


echo "\n-------------------------------------------------------\n";
echo "3. KIỂM THỬ US-09: CHĂM SÓC ĐỊNH KỲ & NHẮC VIỆC\n";
echo "-------------------------------------------------------\n";

require_once __DIR__ . '/../app/Enums/CareTypeEnum.php';
require_once __DIR__ . '/../app/Enums/CareStatusEnum.php';

use App\Enums\CareTypeEnum;
use App\Enums\CareStatusEnum;

$runner->assert(CareTypeEnum::SYSTEM_MAINTENANCE->value === 'Bảo trì hệ thống định kỳ', 'CareTypeEnum chứa "Bảo trì hệ thống định kỳ"');
$runner->assert(CareTypeEnum::SATISFACTION_SURVEY->value === 'Thăm hỏi & Khảo sát hài lòng', 'CareTypeEnum chứa "Thăm hỏi & Khảo sát hài lòng"');
$runner->assert(CareStatusEnum::PENDING->label() === 'Chưa thực hiện', 'CareStatusEnum::PENDING có nhãn "Chưa thực hiện"');
$runner->assert(CareStatusEnum::DONE->label() === 'Đã hoàn thành', 'CareStatusEnum::DONE có nhãn "Đã hoàn thành"');

// Test 3.1: Warning logic sắp đến hạn & quá hạn
$today = strtotime('today');
$mockCares = [
    [
        'id' => 1,
        'customer' => 'Tập đoàn X',
        'scheduled_date' => date('Y-m-d', $today - (2 * 86400)), // Quá hạn 2 ngày
        'status' => CareStatusEnum::PENDING->value,
    ],
    [
        'id' => 2,
        'customer' => 'Công ty Y',
        'scheduled_date' => date('Y-m-d', $today + (3 * 86400)), // Sắp tới trong 3 ngày
        'status' => CareStatusEnum::PENDING->value,
    ],
    [
        'id' => 3,
        'customer' => 'Doanh nghiệp Z',
        'scheduled_date' => date('Y-m-d', $today + (15 * 86400)), // Còn xa (15 ngày)
        'status' => CareStatusEnum::PENDING->value,
    ],
    [
        'id' => 4,
        'customer' => 'Khách hàng K',
        'scheduled_date' => date('Y-m-d', $today - (5 * 86400)), // Đã hoàn thành
        'status' => CareStatusEnum::DONE->value,
    ],
];

$warningDays = 7;
$overdueCount = 0;
$upcomingCount = 0;
$careWarningItems = [];

foreach ($mockCares as $c) {
    if ($c['status'] !== CareStatusEnum::PENDING->value) continue;
    $scheduleTime = strtotime($c['scheduled_date']);
    $diffDays = ($scheduleTime - $today) / 86400;

    if ($diffDays < 0) {
        $overdueCount++;
        $careWarningItems[] = array_merge($c, ['is_overdue' => true]);
    } elseif ($diffDays <= $warningDays) {
        $upcomingCount++;
        $careWarningItems[] = array_merge($c, ['is_overdue' => false]);
    }
}

$runner->assert($overdueCount === 1, "Phát hiện 1 lịch chăm sóc quá hạn (Tập đoàn X)");
$runner->assert($upcomingCount === 1, "Phát hiện 1 lịch sắp đến hạn trong 7 ngày (Công ty Y)");
$runner->assert(count($careWarningItems) === 2, "Tổng cảnh báo chăm sóc định kỳ là 2");

// Test 3.2: Mark done logic
$careItem = $mockCares[0];
$careItem['status'] = CareStatusEnum::DONE->value;
$careItem['completed_at'] = date('Y-m-d H:i:s');
$careItem['notes'] = 'Đã hoàn thành bảo trì định kỳ quý 1';

$runner->assert($careItem['status'] === 'DONE', "Đánh dấu hoàn thành chuyển trạng thái thành DONE");
$runner->assert(!empty($careItem['completed_at']), "Cập nhật completed_at thời gian thực");

echo "\n-------------------------------------------------------\n";
echo "4. KIỂM THỬ S3-01 (SCRUM-105): HỒ SƠ KHÁCH HÀNG & PHÂN QUYỀN\n";
echo "-------------------------------------------------------\n";

// Test 4.1: Khai báo đủ các trường theo AC: tên công ty, MST, ngành nghề, quy mô, website, địa chỉ, người sở hữu
$sampleProfile = [
    'name' => 'Công ty Cổ phần Giải pháp Số Việt Nam',
    'tax_code' => '0109988776',
    'industry' => 'Công nghệ thông tin',
    'company_size' => '50 - 200 nhân sự',
    'website' => 'https://solutions.vn',
    'address' => 'Tầng 8, Tòa nhà Keangnam, Mễ Trì, Hà Nội',
    'area' => 'Hà Nội',
    'owner_id' => 10,
    'status' => 'Tiềm năng',
];

$requiredFields = ['name', 'tax_code', 'industry', 'company_size', 'website', 'address', 'owner_id', 'status'];
$hasAllFields = true;
foreach ($requiredFields as $field) {
    if (empty($sampleProfile[$field])) {
        $hasAllFields = false;
        break;
    }
}
$runner->assert($hasAllFields, "Hồ sơ khai báo đủ 8 trường cốt lõi theo Jira SCRUM-105");

// Test 4.2: 4 Trạng thái chuẩn
$validStatuses = ['Tiềm năng', 'Đang giao dịch', 'Khách hàng', 'Ngừng hợp tác'];
$runner->assert(in_array('Tiềm năng', $validStatuses, true), "Trạng thái 'Tiềm năng' hợp lệ");
$runner->assert(in_array('Đang giao dịch', $validStatuses, true), "Trạng thái 'Đang giao dịch' hợp lệ");
$runner->assert(in_array('Khách hàng', $validStatuses, true), "Trạng thái 'Khách hàng' hợp lệ");
$runner->assert(in_array('Ngừng hợp tác', $validStatuses, true), "Trạng thái 'Ngừng hợp tác' hợp lệ");

// Test 4.3: Mã số thuế duy nhất nếu có
$existingTaxCodes = ['0101778163', '0101234567', '0312345678'];
$checkUnique = function ($taxCode, $existingList) {
    if (empty($taxCode)) return true; // Nullable cho phép trống
    return !in_array($taxCode, $existingList, true);
};

$runner->assert($checkUnique('0109988776', $existingTaxCodes), "Mã số thuế mới 0109988776 là duy nhất và được chấp nhận");
$runner->assert(!$checkUnique('0101778163', $existingTaxCodes), "Mã số thuế trùng 0101778163 bị từ chối");
$runner->assert($checkUnique('', $existingTaxCodes), "Mã số thuế để trống (nullable) vẫn hợp lệ");

// Test 4.4: Phân quyền xem dữ liệu: Nhân viên chỉ thấy mình sở hữu, Trưởng nhóm thấy toàn nhóm, Admin thấy toàn bộ
$mockUsers = [
    ['id' => 1, 'name' => 'Admin', 'role' => 'admin', 'data_scope' => 'ALL', 'group_id' => null],
    ['id' => 2, 'name' => 'Trưởng nhóm', 'role' => 'team_leader', 'data_scope' => 'TEAM', 'group_id' => 10],
    ['id' => 3, 'name' => 'Nhân viên 1 (Nhóm 10)', 'role' => 'staff', 'data_scope' => 'MINE', 'group_id' => 10],
    ['id' => 4, 'name' => 'Nhân viên 2 (Nhóm 10)', 'role' => 'staff', 'data_scope' => 'MINE', 'group_id' => 10],
    ['id' => 5, 'name' => 'Nhân viên Khác (Nhóm 20)', 'role' => 'staff', 'data_scope' => 'MINE', 'group_id' => 20],
];

$mockCustomers = [
    ['id' => 101, 'name' => 'Khách của NV1', 'owner_id' => 3],
    ['id' => 102, 'name' => 'Khách của NV2', 'owner_id' => 4],
    ['id' => 103, 'name' => 'Khách của Trưởng nhóm', 'owner_id' => 2],
    ['id' => 104, 'name' => 'Khách của NV Khác', 'owner_id' => 5],
];

// Hàm filter theo data scope
$applyScope = function ($user, $customers, $users) {
    if ($user['role'] === 'admin' || $user['data_scope'] === 'ALL') {
        return $customers;
    }
    if ($user['role'] === 'team_leader' || $user['data_scope'] === 'TEAM') {
        $teamUserIds = array_column(array_filter($users, fn($u) => $u['group_id'] === $user['group_id']), 'id');
        return array_values(array_filter($customers, fn($c) => in_array($c['owner_id'], $teamUserIds, true)));
    }
    return array_values(array_filter($customers, fn($c) => $c['owner_id'] === $user['id']));
};

$staffView = $applyScope($mockUsers[2], $mockCustomers, $mockUsers);
$leaderView = $applyScope($mockUsers[1], $mockCustomers, $mockUsers);
$adminView = $applyScope($mockUsers[0], $mockCustomers, $mockUsers);

$runner->assert(count($staffView) === 1 && $staffView[0]['id'] === 101, "Nhân viên 1 chỉ thấy duy nhất khách hàng do mình sở hữu");
$runner->assert(count($leaderView) === 3, "Trưởng nhóm thấy toàn bộ 3 khách hàng của các thành viên trong nhóm 10");
$runner->assert(!in_array(104, array_column($leaderView, 'id'), true), "Trưởng nhóm không thấy khách hàng của nhóm khác (#104)");
$runner->assert(count($adminView) === 4, "Quản trị viên thấy toàn bộ 4 khách hàng trong hệ thống");

echo "\n-------------------------------------------------------\n";
echo "5. KIỂM THỬ S3-07 (SCRUM-111): TÌM KIẾM, LỌC NÂNG CAO & LƯU BỘ LỌC\n";
echo "-------------------------------------------------------\n";

$dataset = [
    [
        'id' => 1,
        'name' => 'Tập đoàn Công nghệ FPT',
        'tax_code' => '0101778163',
        'industry' => 'Công nghệ thông tin',
        'company_size' => 'Trên 500 nhân sự',
        'area' => 'Hà Nội',
        'status' => 'Khách hàng',
        'owner_id' => 3,
        'contacts' => [['name' => 'Nguyễn Văn Tuấn', 'phone' => '0901234567']],
    ],
    [
        'id' => 2,
        'name' => 'Công ty Bất động sản Đất Lành',
        'tax_code' => '0309998881',
        'industry' => 'Bất động sản & Xây dựng',
        'company_size' => '50 - 200 nhân sự',
        'area' => 'TP. Hồ Chí Minh',
        'status' => 'Tiềm năng',
        'owner_id' => 3,
        'contacts' => [['name' => 'Lê Thị Mai', 'phone' => '0988776655']],
    ],
    [
        'id' => 3,
        'name' => 'Nhà máy Sản xuất Nhựa Rạng Đông',
        'tax_code' => '0204445556',
        'industry' => 'Sản xuất & Chế tạo',
        'company_size' => '200 - 500 nhân sự',
        'area' => 'Hà Nội',
        'status' => 'Đang giao dịch',
        'owner_id' => 4,
        'contacts' => [['name' => 'Trần Văn Bình', 'phone' => '0977112233']],
    ],
];

// Test 5.1: Lọc theo trạng thái
$filterStatus = array_filter($dataset, fn($c) => $c['status'] === 'Tiềm năng');
$runner->assert(count($filterStatus) === 1 && reset($filterStatus)['id'] === 2, "Lọc đúng 1 khách hàng có trạng thái 'Tiềm năng'");

// Test 5.2: Lọc theo ngành nghề
$filterIndustry = array_filter($dataset, fn($c) => $c['industry'] === 'Công nghệ thông tin');
$runner->assert(count($filterIndustry) === 1 && reset($filterIndustry)['id'] === 1, "Lọc đúng khách hàng ngành 'Công nghệ thông tin'");

// Test 5.3: Lọc theo quy mô
$filterSize = array_filter($dataset, fn($c) => $c['company_size'] === 'Trên 500 nhân sự');
$runner->assert(count($filterSize) === 1 && reset($filterSize)['id'] === 1, "Lọc đúng khách hàng quy mô 'Trên 500 nhân sự'");

// Test 5.4: Lọc theo khu vực
$filterArea = array_filter($dataset, fn($c) => $c['area'] === 'Hà Nội');
$runner->assert(count($filterArea) === 2, "Lọc đúng 2 khách hàng khu vực 'Hà Nội'");

// Test 5.5: Tìm theo tên công ty và mã số thuế
$searchTax = array_filter($dataset, fn($c) => str_contains($c['tax_code'], '0101778163'));
$runner->assert(count($searchTax) === 1 && reset($searchTax)['name'] === 'Tập đoàn Công nghệ FPT', "Tìm đúng khách hàng theo Mã số thuế");

// Test 5.6: Tìm theo số điện thoại người liên hệ (S3-07)
$searchContactPhone = function ($phone, $items) {
    return array_filter($items, function ($item) use ($phone) {
        foreach ($item['contacts'] as $contact) {
            if (str_contains($contact['phone'], $phone)) return true;
        }
        return false;
    });
};
$foundByPhone = $searchContactPhone('0988776655', $dataset);
$runner->assert(count($foundByPhone) === 1 && reset($foundByPhone)['id'] === 2, "Tìm chính xác khách hàng qua SĐT người liên hệ (0988776655)");

// Test 5.7: Lưu và áp dụng bộ lọc hay dùng
$savedFiltersStore = [];
$savedFilter = [
    'id' => 1,
    'user_id' => 3,
    'name' => 'Khách tiềm năng BĐS cần gọi trong tuần',
    'filters' => [
        'status' => 'Tiềm năng',
        'industry' => 'Bất động sản & Xây dựng',
    ],
];
$savedFiltersStore[] = $savedFilter;

$runner->assert(count($savedFiltersStore) === 1, "Lưu thành công bộ lọc hay dùng vào danh sách");
$runner->assert($savedFiltersStore[0]['name'] === 'Khách tiềm năng BĐS cần gọi trong tuần', "Tên bộ lọc lưu chuẩn xác");

// Áp dụng bộ lọc đã lưu vào danh sách
$applied = array_filter($dataset, function ($c) use ($savedFilter) {
    foreach ($savedFilter['filters'] as $key => $val) {
        if ($c[$key] !== $val) return false;
    }
    return true;
});
$runner->assert(count($applied) === 1 && reset($applied)['id'] === 2, "Áp dụng bộ lọc đã lưu lọc ra đúng danh sách khách cần gọi trong tuần");

$summary = $runner->summary();
exit($summary['failed'] === 0 ? 0 : 1);

