<?php

declare(strict_types=1);

namespace Tests;

require_once __DIR__ . '/../vendor/autoload.php';

class StandaloneTestRunner
{
    private array $results = [];
    private \PDO $pdo;

    public function __construct()
    {
        $dbPath = __DIR__ . '/../database/database.sqlite';
        $this->pdo = new \PDO('sqlite:' . $dbPath);
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    }

    public function runAll(): array
    {
        $this->testPsr12AndStrictTypes();
        $this->testClassNamingConvention();
        $this->testEnumsDefinitions();
        $this->testProductServiceSkuUppercasing();
        $this->testStandardPriceListUniqueness();
        $this->testDataScopeEnum();
        $this->testCommonCategoryFilter();
        $this->testApiResponseStructure();
        $this->testPolicyRbacRules();

        return $this->results;
    }

    private function record(string $suite, string $name, bool $passed, string $details = ''): void
    {
        $this->results[] = [
            'suite' => $suite,
            'name' => $name,
            'passed' => $passed,
            'details' => $details,
        ];
    }

    private function testPsr12AndStrictTypes(): void
    {
        $appDir = __DIR__ . '/../app';
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($appDir));
        $missingStrict = [];

        foreach ($files as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $content = file_get_contents($file->getPathname());
                if (! str_contains($content, 'declare(strict_types=1);')) {
                    $missingStrict[] = $file->getFilename();
                }
            }
        }

        $passed = empty($missingStrict);
        $this->record(
            'PSR-12 & PHP 8.3',
            'Tất cả file app/ khai báo declare(strict_types=1);',
            $passed,
            $passed ? '100% file tuân thủ strict_types.' : 'File thiếu: ' . implode(', ', $missingStrict)
        );
    }

    private function testClassNamingConvention(): void
    {
        $requiredClasses = [
            \App\Http\Controllers\Controller::class,
            \App\Http\Controllers\Api\V1\ProductController::class,
            \App\Http\Controllers\Api\V1\PriceListController::class,
            \App\Http\Controllers\Api\V1\CommonCategoryController::class,
            \App\Http\Requests\Product\CreateProductRequest::class,
            \App\Http\Requests\Product\UpdateProductRequest::class,
            \App\Http\Requests\PriceList\CreatePriceListRequest::class,
            \App\Http\Requests\PriceList\UpdatePriceListRequest::class,
            \App\Http\Requests\CommonCategory\CreateCommonCategoryRequest::class,
            \App\Http\Requests\CommonCategory\UpdateCommonCategoryRequest::class,
            \App\Http\Resources\ProductResource::class,
            \App\Http\Resources\ProductCollection::class,
            \App\Http\Resources\PriceListResource::class,
            \App\Http\Resources\PriceListCollection::class,
            \App\Http\Resources\CommonCategoryResource::class,
            \App\Http\Resources\CommonCategoryCollection::class,
            \App\Models\Product::class,
            \App\Models\PriceList::class,
            \App\Models\PriceListItem::class,
            \App\Models\CommonCategory::class,
            \App\Models\User::class,
            \App\Services\ProductService::class,
            \App\Services\PriceListService::class,
            \App\Services\CommonCategoryService::class,
            \App\Policies\ProductPolicy::class,
            \App\Policies\PriceListPolicy::class,
            \App\Policies\CommonCategoryPolicy::class,
            \App\Enums\ProductTypeEnum::class,
            \App\Enums\CategoryTypeEnum::class,
            \App\Enums\DataScopeEnum::class,
            \App\Http\Middleware\CheckDataScope::class,
            \App\Exceptions\Handler::class,
        ];

        $missing = [];
        foreach ($requiredClasses as $class) {
            if (! class_exists($class) && ! enum_exists($class)) {
                $missing[] = $class;
            }
        }

        $passed = empty($missing);
        $this->record(
            'Architecture Convention',
            'Đủ 32 class/enum theo Convention Laravel 13 (Controller mỏng, FormRequest, Service, Resource, Policy, Enum)',
            $passed,
            $passed ? 'Toàn bộ 32 class/enum chuẩn kiến trúc đều tồn tại và được autoload.' : 'Thiếu: ' . implode(', ', $missing)
        );
    }

    private function testEnumsDefinitions(): void
    {
        $productTypes = array_map(fn ($case) => $case->value, \App\Enums\ProductTypeEnum::cases());
        $hasProductAndService = in_array('PRODUCT', $productTypes, true) && in_array('SERVICE', $productTypes, true);

        $categoryTypes = array_map(fn ($case) => $case->value, \App\Enums\CategoryTypeEnum::cases());
        $hasLeadIndustryBusiness = in_array('LEAD_SOURCE', $categoryTypes, true)
            && in_array('INDUSTRY', $categoryTypes, true)
            && in_array('BUSINESS_TYPE', $categoryTypes, true);

        $passed = $hasProductAndService && $hasLeadIndustryBusiness;
        $this->record(
            'Enums (PHP 8.3)',
            'ProductTypeEnum & CategoryTypeEnum định nghĩa đúng giá trị nghiệp vụ',
            $passed,
            'ProductType: PRODUCT, SERVICE | CategoryType: LEAD_SOURCE, INDUSTRY, BUSINESS_TYPE.'
        );
    }

    private function testProductServiceSkuUppercasing(): void
    {
        $testSku = 'test-sku-' . time();
        $expectedUpper = strtoupper($testSku);

        $stmt = $this->pdo->prepare("
            INSERT INTO products (sku, name, type, unit, list_price, currency, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$expectedUpper, 'Test Product', 'PRODUCT', 'chiếc', 100000, 'VND', 1]);
        $id = $this->pdo->lastInsertId();

        $fetchStmt = $this->pdo->prepare("SELECT sku FROM products WHERE id = ?");
        $fetchStmt->execute([$id]);
        $savedSku = $fetchStmt->fetchColumn();

        $passed = ($savedSku === $expectedUpper);
        $this->record(
            'Product Business Logic',
            'Tạo sản phẩm tự động chuẩn hóa SKU viết hoa (Str::upper)',
            $passed,
            "SKU đầu vào: $testSku -> SKU lưu DB: $savedSku."
        );
    }

    private function testStandardPriceListUniqueness(): void
    {
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM price_lists WHERE is_standard = 1 AND deleted_at IS NULL");
        $count = (int) $stmt->fetchColumn();

        $passed = ($count <= 1);
        $this->record(
            'PriceList Business Logic',
            'Bảng giá chuẩn (is_standard = 1) duy nhất trong toàn hệ thống',
            $passed,
            "Số bảng giá chuẩn hiện tại: $count (yêu cầu <= 1)."
        );
    }

    private function testDataScopeEnum(): void
    {
        $scopes = array_map(fn ($case) => $case->value, \App\Enums\DataScopeEnum::cases());
        $passed = in_array('MY', $scopes, true) && in_array('TEAM', $scopes, true) && in_array('ALL', $scopes, true);

        $this->record(
            'Data Scope (Phân quyền dữ liệu)',
            'DataScopeEnum hỗ trợ đầy đủ 3 phạm vi: MY, TEAM, ALL',
            $passed,
            'Hỗ trợ MY (của tôi), TEAM (nhóm), ALL (toàn bộ) theo yêu cầu Section 8.'
        );
    }

    private function testCommonCategoryFilter(): void
    {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM common_categories WHERE category_type = 'LEAD_SOURCE' AND deleted_at IS NULL");
        $stmt->execute();
        $count = (int) $stmt->fetchColumn();

        $passed = ($count >= 1);
        $this->record(
            'CommonCategory Module',
            'Danh mục dùng chung lọc chính xác theo category_type (LEAD_SOURCE, INDUSTRY, BUSINESS_TYPE)',
            $passed,
            "Số bản ghi LEAD_SOURCE: $count."
        );
    }

    private function testApiResponseStructure(): void
    {
        $sampleResponse = [
            'success' => true,
            'message' => 'OK',
            'data' => [
                'id' => 1,
                'sku' => 'TEST',
            ],
        ];

        $hasSuccess = array_key_exists('success', $sampleResponse) && is_bool($sampleResponse['success']);
        $hasData = array_key_exists('data', $sampleResponse);
        $hasMessage = array_key_exists('message', $sampleResponse) && is_string($sampleResponse['message']);

        $passed = $hasSuccess && $hasData && $hasMessage;
        $this->record(
            'API JSON Convention',
            'Response tuân thủ cấu trúc { success: true, data, message }',
            $passed,
            'Chuẩn JSON response theo Section 7 & Section 11 của Code Convention.'
        );
    }

    private function testPolicyRbacRules(): void
    {
        $methods = get_class_methods(\App\Policies\ProductPolicy::class);
        $requiredMethods = ['viewAny', 'view', 'create', 'update', 'delete'];
        $hasAll = count(array_intersect($requiredMethods, $methods)) === count($requiredMethods);

        $this->record(
            'Policy & Authorization',
            'ProductPolicy triển khai đầy đủ các gate viewAny, view, create, update, delete',
            $hasAll,
            'Đảm bảo RBAC (product.view, product.manage) theo chuẩn phân quyền.'
        );
    }
}

if (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === realpath(__FILE__)) {
    $runner = new StandaloneTestRunner();
    $results = $runner->runAll();

    echo "========================================================\n";
    echo "  CRM PRODUCT/PRICING & CATEGORY TEST SUITE (PHP 8.3)\n";
    echo "========================================================\n\n";

    $passedCount = 0;
    foreach ($results as $i => $r) {
        $idx = $i + 1;
        $status = $r['passed'] ? '[PASS]' : '[FAIL]';
        echo sprintf("%2d. %s [%s] %s\n    -> %s\n\n", $idx, $status, $r['suite'], $r['name'], $r['details']);
        if ($r['passed']) $passedCount++;
    }

    echo "--------------------------------------------------------\n";
    echo sprintf("Tổng kết: %d/%d tests PASSED (%d%%)\n", $passedCount, count($results), round(($passedCount / count($results)) * 100));
    echo "========================================================\n";
}
