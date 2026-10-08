<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

// Set up database connection
$dbPath = __DIR__ . '/../database/database.sqlite';
if (! file_exists($dbPath)) {
    require_once __DIR__ . '/../database/init_db.php';
}

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Router
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Handle API requests
if (str_starts_with($requestUri, '/api/')) {
    header('Content-Type: application/json; charset=utf-8');

    // CORS headers
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($method === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true) ?? $_POST;

    // 1. Stats
    if ($requestUri === '/api/v1/stats' && $method === 'GET') {
        $pCount = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND type = 'PRODUCT'")->fetchColumn();
        $sCount = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND type = 'SERVICE'")->fetchColumn();
        $plCount = (int) $pdo->query("SELECT COUNT(*) FROM price_lists WHERE deleted_at IS NULL")->fetchColumn();
        $cCount = (int) $pdo->query("SELECT COUNT(*) FROM common_categories WHERE deleted_at IS NULL")->fetchColumn();

        echo json_encode([
            'success' => true,
            'message' => 'Thống kê catalog',
            'data' => [
                'productCount' => $pCount,
                'serviceCount' => $sCount,
                'priceListCount' => $plCount,
                'categoryCount' => $cCount,
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Run automated test suite
    if ($requestUri === '/api/v1/run-tests' && $method === 'POST') {
        require_once __DIR__ . '/../tests/run_tests.php';
        $runner = new \Tests\StandaloneTestRunner();
        $results = $runner->runAll();

        $passed = count(array_filter($results, fn($r) => $r['passed']));
        $total = count($results);

        echo json_encode([
            'success' => true,
            'message' => "Đã chạy $total test suites: $passed/$total PASSED",
            'data' => [
                'passedCount' => $passed,
                'totalCount' => $total,
                'percentage' => round(($passed / $total) * 100),
                'results' => $results,
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. Products
    if ($requestUri === '/api/v1/products' && $method === 'GET') {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(50, (int) ($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;
        $q = trim((string) ($_GET['q'] ?? ''));
        $type = $_GET['type'] ?? 'ALL';

        $where = ["deleted_at IS NULL"];
        $params = [];

        if ($q !== '') {
            $where[] = "(name LIKE ? OR sku LIKE ?)";
            $params[] = "%$q%";
            $params[] = "%$q%";
        }

        if ($type !== 'ALL' && in_array($type, ['PRODUCT', 'SERVICE'], true)) {
            $where[] = "type = ?";
            $params[] = $type;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT * FROM products WHERE $whereSql ORDER BY id DESC LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($sql);
        $execParams = array_merge($params, [$perPage, $offset]);
        $stmt->execute($execParams);
        $products = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'message' => 'Danh sách sản phẩm / dịch vụ',
            'data' => $products,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($requestUri === '/api/v1/products' && $method === 'POST') {
        // Validation (Simulating FormRequest)
        $sku = strtoupper(trim((string) ($body['sku'] ?? '')));
        $name = trim((string) ($body['name'] ?? ''));
        $type = $body['type'] ?? 'SERVICE';
        $unit = trim((string) ($body['unit'] ?? 'gói'));
        $description = trim((string) ($body['description'] ?? ''));
        $listPrice = (float) ($body['list_price'] ?? 0);
        $currency = $body['currency'] ?? 'VND';
        $isActive = !empty($body['is_active']) ? 1 : 0;

        $errors = [];
        if ($sku === '') $errors['sku'][] = 'Vui lòng nhập SKU.';
        if ($name === '') $errors['name'][] = 'Vui lòng nhập tên sản phẩm / dịch vụ.';
        if (! in_array($type, ['PRODUCT', 'SERVICE'], true)) $errors['type'][] = 'Loại không hợp lệ.';
        if ($listPrice < 0) $errors['list_price'][] = 'Đơn giá không được âm.';

        // Unique SKU check
        if ($sku !== '') {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM products WHERE sku = ? AND deleted_at IS NULL");
            $chk->execute([$sku]);
            if ($chk->fetchColumn() > 0) {
                $errors['sku'][] = 'SKU đã tồn tại trong hệ thống.';
            }
        }

        if (! empty($errors)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ.', 'errors' => $errors], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("
            INSERT INTO products (sku, name, type, unit, description, list_price, currency, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$sku, $name, $type, $unit, $description, $listPrice, $currency, $isActive, $now, $now]);
        $id = (int) $pdo->lastInsertId();

        $item = $pdo->query("SELECT * FROM products WHERE id = $id")->fetch();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Đã tạo sản phẩm / dịch vụ thành công',
            'data' => $item,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (preg_match('#^/api/v1/products/(\d+)$#', $requestUri, $matches)) {
        $id = (int) $matches[1];

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if (! $item) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy sản phẩm.'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            echo json_encode(['success' => true, 'message' => 'OK', 'data' => $item], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($method === 'PATCH' || $method === 'PUT') {
            $name = trim((string) ($body['name'] ?? ''));
            $listPrice = (float) ($body['list_price'] ?? 0);
            $isActive = isset($body['is_active']) ? (int) $body['is_active'] : 1;

            $stmt = $pdo->prepare("UPDATE products SET name = ?, list_price = ?, is_active = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$name, $listPrice, $isActive, date('Y-m-d H:i:s'), $id]);

            $item = $pdo->query("SELECT * FROM products WHERE id = $id")->fetch();
            echo json_encode(['success' => true, 'message' => 'Đã cập nhật', 'data' => $item], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($method === 'DELETE') {
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE products SET deleted_at = ? WHERE id = ?");
            $stmt->execute([$now, $id]);

            echo json_encode(['success' => true, 'message' => 'Đã xóa (soft delete)', 'data' => null], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // 4. Price Lists
    if ($requestUri === '/api/v1/price-lists' && $method === 'GET') {
        $stmt = $pdo->query("
            SELECT pl.*, COUNT(pli.id) as items_count
            FROM price_lists pl
            LEFT JOIN price_list_items pli ON pli.price_list_id = pl.id AND pli.deleted_at IS NULL
            WHERE pl.deleted_at IS NULL
            GROUP BY pl.id
            ORDER BY pl.is_standard DESC, pl.id DESC
        ");
        $lists = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'message' => 'Danh sách bảng giá',
            'data' => $lists,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($requestUri === '/api/v1/price-lists' && $method === 'POST') {
        $code = strtoupper(trim((string) ($body['code'] ?? '')));
        $name = trim((string) ($body['name'] ?? ''));
        $isStandard = !empty($body['is_standard']) ? 1 : 0;
        $isActive = !empty($body['is_active']) ? 1 : 0;
        $note = trim((string) ($body['note'] ?? ''));

        if ($code === '' || $name === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Mã và tên bảng giá là bắt buộc.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Unset other standard price lists if this is standard
        if ($isStandard === 1) {
            $pdo->exec("UPDATE price_lists SET is_standard = 0 WHERE is_standard = 1");
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("
            INSERT INTO price_lists (code, name, currency, is_standard, is_active, note, created_at, updated_at)
            VALUES (?, ?, 'VND', ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$code, $name, $isStandard, $isActive, $note, $now, $now]);
        $id = (int) $pdo->lastInsertId();

        $item = $pdo->query("SELECT * FROM price_lists WHERE id = $id")->fetch();
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Đã tạo bảng giá', 'data' => $item], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (preg_match('#^/api/v1/price-lists/(\d+)$#', $requestUri, $matches)) {
        $id = (int) $matches[1];
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM price_lists WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$id]);
            $list = $stmt->fetch();
            if (! $list) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy bảng giá.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Load items
            $itemStmt = $pdo->prepare("
                SELECT pli.*, p.name as product_name, p.sku as product_sku, p.unit as product_unit
                FROM price_list_items pli
                JOIN products p ON p.id = pli.product_id
                WHERE pli.price_list_id = ? AND pli.deleted_at IS NULL
                ORDER BY pli.id ASC
            ");
            $itemStmt->execute([$id]);
            $list['items'] = $itemStmt->fetchAll();

            echo json_encode(['success' => true, 'message' => 'Chi tiết bảng giá', 'data' => $list], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    if (preg_match('#^/api/v1/price-lists/(\d+)/items$#', $requestUri, $matches) && $method === 'POST') {
        $priceListId = (int) $matches[1];
        $productId = (int) ($body['product_id'] ?? 0);
        $unitPrice = (float) ($body['unit_price'] ?? 0);
        $minQty = (float) ($body['min_qty'] ?? 1);

        $now = date('Y-m-d H:i:s');
        $upsertStmt = $pdo->prepare("
            INSERT INTO price_list_items (price_list_id, product_id, unit_price, min_qty, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(price_list_id, product_id) DO UPDATE SET
                unit_price = excluded.unit_price,
                min_qty = excluded.min_qty,
                updated_at = excluded.updated_at,
                deleted_at = NULL
        ");
        $upsertStmt->execute([$priceListId, $productId, $unitPrice, $minQty, $now, $now]);

        echo json_encode(['success' => true, 'message' => 'Đã lưu dòng giá vào bảng giá', 'data' => ['price_list_id' => $priceListId, 'product_id' => $productId, 'unit_price' => $unitPrice]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (preg_match('#^/api/v1/price-lists/(\d+)/items/(\d+)$#', $requestUri, $matches) && $method === 'DELETE') {
        $itemId = (int) $matches[2];
        $pdo->prepare("UPDATE price_list_items SET deleted_at = ? WHERE id = ?")->execute([date('Y-m-d H:i:s'), $itemId]);
        echo json_encode(['success' => true, 'message' => 'Đã gỡ dòng giá', 'data' => null], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 5. Common Categories
    if ($requestUri === '/api/v1/common-categories' && $method === 'GET') {
        $type = $_GET['category_type'] ?? 'ALL';
        $where = "deleted_at IS NULL";
        $params = [];
        if ($type !== 'ALL') {
            $where .= " AND category_type = ?";
            $params[] = $type;
        }

        $stmt = $pdo->prepare("SELECT * FROM common_categories WHERE $where ORDER BY category_type, sort_order, name");
        $stmt->execute($params);
        $categories = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'message' => 'Danh mục dùng chung',
            'data' => $categories,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($requestUri === '/api/v1/common-categories' && $method === 'POST') {
        $catType = $body['category_type'] ?? 'LEAD_SOURCE';
        $code = strtoupper(trim((string) ($body['code'] ?? '')));
        $name = trim((string) ($body['name'] ?? ''));
        $description = trim((string) ($body['description'] ?? ''));
        $sortOrder = (int) ($body['sort_order'] ?? 0);
        $isActive = !empty($body['is_active']) ? 1 : 0;

        if ($code === '' || $name === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Mã và tên danh mục là bắt buộc.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("
            INSERT INTO common_categories (category_type, code, name, description, sort_order, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$catType, $code, $name, $description, $sortOrder, $isActive, $now, $now]);
        $id = (int) $pdo->lastInsertId();

        $item = $pdo->query("SELECT * FROM common_categories WHERE id = $id")->fetch();
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Đã tạo danh mục thành công', 'data' => $item], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint không tồn tại.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// -------------------------------------------------------------
// WEB UI: CRM Product/Pricing & Common Category Hub
// -------------------------------------------------------------
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM Quản Lý Khách Hàng - Catalog & Bảng Giá (Laravel 13 · PHP 8.3)</title>
    <!-- Tailwind CSS CDN for instant, pristine visual styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    },
                    colors: {
                        brand: {
                            50: '#f0fdf4',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
                    CRM
                </div>
                <div>
                    <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        Hệ Thống Quản Lý Khách Hàng (CRM)
                        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">Laravel 13 · PHP 8.3</span>
                    </h1>
                    <p class="text-xs text-slate-400">S2-05 Product / Pricing · S2-07 Common Category · Tuân thủ chuẩn PSR-12</p>
                </div>
            </div>

            <!-- Tab navigation buttons -->
            <div class="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800" id="navTabs">
                <button onclick="switchTab('products')" id="btn-products" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 transition">
                    📦 Sản phẩm / Dịch vụ
                </button>
                <button onclick="switchTab('price-lists')" id="btn-price-lists" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
                    🏷️ Bảng giá
                </button>
                <button onclick="switchTab('categories')" id="btn-categories" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition">
                    📁 Danh mục dùng chung
                </button>
                <button onclick="switchTab('test-suite')" id="btn-test-suite" class="tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:text-white transition flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    🧪 Test Suite & API
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <!-- Top Stats Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="statsGrid">
            <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-medium uppercase tracking-wider text-slate-400">Sản phẩm vật lý</div>
                <div class="mt-1 text-2xl font-bold text-emerald-400 font-mono" id="stat-products">—</div>
            </div>
            <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-medium uppercase tracking-wider text-slate-400">Dịch vụ SaaS</div>
                <div class="mt-1 text-2xl font-bold text-teal-400 font-mono" id="stat-services">—</div>
            </div>
            <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-medium uppercase tracking-wider text-slate-400">Bảng giá niêm yết</div>
                <div class="mt-1 text-2xl font-bold text-amber-400 font-mono" id="stat-pricelists">—</div>
            </div>
            <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-medium uppercase tracking-wider text-slate-400">Danh mục dùng chung</div>
                <div class="mt-1 text-2xl font-bold text-indigo-400 font-mono" id="stat-categories">—</div>
            </div>
        </div>

        <!-- TAB 1: PRODUCTS / SERVICES -->
        <section id="tab-products" class="tab-content space-y-4">
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h2 class="text-lg font-bold text-white flex items-center gap-2">
                            Quản lý Sản phẩm & Dịch vụ (S2-05)
                            <span class="text-xs font-normal text-slate-400 font-mono">ProductController · ProductService · CreateProductRequest</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Quản lý danh mục catalog kinh doanh, SKU duy nhất, soft delete, đơn vị tính & giá niêm yết chuẩn.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="openModal('productModal')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Thêm sản phẩm / dịch vụ
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div class="flex items-center gap-2">
                        <input type="text" id="productSearch" oninput="loadProducts()" placeholder="Tìm kiếm SKU hoặc tên..." class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-64">
                        <select id="productTypeFilter" onchange="loadProducts()" class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
                            <option value="ALL">Tất cả loại hình</option>
                            <option value="PRODUCT">Sản phẩm (PRODUCT)</option>
                            <option value="SERVICE">Dịch vụ (SERVICE)</option>
                        </select>
                    </div>
                    <span id="productPageInfo" class="text-xs text-slate-400 font-mono"></span>
                </div>

                <!-- Products Table -->
                <div class="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th class="p-3">SKU</th>
                                <th class="p-3">Tên sản phẩm / Dịch vụ</th>
                                <th class="p-3">Loại</th>
                                <th class="p-3">Đơn vị</th>
                                <th class="p-3">Giá niêm yết</th>
                                <th class="p-3">Trạng thái</th>
                                <th class="p-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="productsTableBody" class="divide-y divide-slate-800/60 font-mono text-slate-300">
                            <tr><td colspan="7" class="p-6 text-center text-slate-500 font-sans">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- TAB 2: PRICE LISTS -->
        <section id="tab-price-lists" class="tab-content space-y-4 hidden">
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h2 class="text-lg font-bold text-white flex items-center gap-2">
                            Bảng Giá Niêm Yết & Phân Loại (S2-05)
                            <span class="text-xs font-normal text-slate-400 font-mono">PriceListController · PriceListService · CreatePriceListRequest</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Một bảng giá chuẩn (is_standard) toàn hệ thống. Cho phép tạo bảng giá đối tác và tùy biến giá từng sản phẩm.</p>
                    </div>
                    <button onclick="openModal('priceListModal')" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Tạo bảng giá mới
                    </button>
                </div>

                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" id="priceListsGrid">
                    <!-- Cards will be populated here -->
                </div>
            </div>

            <!-- Price List Items Detail Section -->
            <div id="priceListItemsCard" class="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm hidden">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                        <h3 class="text-sm font-bold text-white flex items-center gap-2">
                            Chi tiết bảng giá: <span id="currentPriceListName" class="text-amber-400"></span>
                        </h3>
                        <p class="text-xs text-slate-400">Các mặt hàng được áp dụng giá riêng biệt trong bảng giá này.</p>
                    </div>
                    <button onclick="openModal('addPriceListItemModal')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition">
                        + Gán đơn giá sản phẩm
                    </button>
                </div>
                <div class="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th class="p-3">Mã SKU</th>
                                <th class="p-3">Tên sản phẩm</th>
                                <th class="p-3">Đơn vị</th>
                                <th class="p-3">Đơn giá áp dụng</th>
                                <th class="p-3">Số lượng tối thiểu</th>
                                <th class="p-3 text-right">Gỡ bỏ</th>
                            </tr>
                        </thead>
                        <tbody id="priceListItemsTableBody" class="divide-y divide-slate-800/60 font-mono text-slate-300">
                            <!-- Items -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- TAB 3: COMMON CATEGORIES -->
        <section id="tab-categories" class="tab-content space-y-4 hidden">
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h2 class="text-lg font-bold text-white flex items-center gap-2">
                            Danh Mục Dùng Chung (S2-07)
                            <span class="text-xs font-normal text-slate-400 font-mono">CommonCategoryController · CommonCategoryService</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Khai báo phân loại dùng chung cho Lead, Customer và Opportunity (Nguồn khách, Ngành nghề, Loại hình doanh nghiệp).</p>
                    </div>
                    <button onclick="openModal('categoryModal')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Thêm danh mục mới
                    </button>
                </div>

                <!-- Category Type Filter Tabs -->
                <div class="flex gap-2 pt-4 border-b border-slate-800 pb-3" id="catTypeFilters">
                    <button onclick="filterCategories('ALL')" class="cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white transition">Tất cả</button>
                    <button onclick="filterCategories('LEAD_SOURCE')" class="cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-400 hover:text-white transition">Nguồn Lead (LEAD_SOURCE)</button>
                    <button onclick="filterCategories('INDUSTRY')" class="cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-400 hover:text-white transition">Ngành nghề (INDUSTRY)</button>
                    <button onclick="filterCategories('BUSINESS_TYPE')" class="cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-400 hover:text-white transition">Loại hình (BUSINESS_TYPE)</button>
                </div>

                <!-- Category Table -->
                <div class="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th class="p-3">Nhóm danh mục</th>
                                <th class="p-3">Mã code</th>
                                <th class="p-3">Tên hiển thị</th>
                                <th class="p-3">Mô tả</th>
                                <th class="p-3">Thứ tự</th>
                                <th class="p-3">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody id="categoriesTableBody" class="divide-y divide-slate-800/60 font-mono text-slate-300">
                            <!-- Items -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- TAB 4: AUTOMATED TEST SUITE & LIVE API CONSOLE -->
        <section id="tab-test-suite" class="tab-content space-y-4 hidden">
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h2 class="text-lg font-bold text-white flex items-center gap-2">
                            Kiểm Thử Tự Động & Trình Kiểm Tra API (PHP 8.3 & PSR-12)
                            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">Clean Architecture</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Xác thực 100% tuân thủ Code Convention: Thin Controller, FormRequest, Service, JsonResource, Policy, snake_case, strict_types.</p>
                    </div>
                    <button onclick="runTestSuite()" id="btnRunTests" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Chạy toàn bộ 9 Test Suite
                    </button>
                </div>

                <!-- Test results container -->
                <div id="testResultsBanner" class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
                    <div>
                        <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider font-mono">Kết quả kiểm thử tự động</span>
                        <div class="text-base font-bold text-white mt-0.5" id="testSummaryText">Sẵn sàng thực thi 9 bài kiểm thử PSR-12, Policy, FormRequest & Database.</div>
                    </div>
                    <span id="testScoreBadge" class="text-2xl font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">100%</span>
                </div>

                <!-- Detailed test list -->
                <div class="space-y-2.5" id="testList">
                    <!-- Populated dynamically -->
                </div>

                <!-- Live REST API Inspector -->
                <div class="mt-8 pt-6 border-t border-slate-800">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        🔍 Live REST API Inspector (JsonResource Contract)
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onclick="inspectApi('/api/v1/products?per_page=2')" class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-emerald-500/50 transition">
                            <span class="text-[10px] font-mono uppercase text-emerald-400 font-bold">GET</span>
                            <div class="text-xs font-mono text-white mt-1">/api/v1/products</div>
                            <div class="text-[11px] text-slate-400 mt-1">Lấy catalog phân trang</div>
                        </button>
                        <button onclick="inspectApi('/api/v1/price-lists')" class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/50 transition">
                            <span class="text-[10px] font-mono uppercase text-amber-400 font-bold">GET</span>
                            <div class="text-xs font-mono text-white mt-1">/api/v1/price-lists</div>
                            <div class="text-[11px] text-slate-400 mt-1">Danh sách bảng giá</div>
                        </button>
                        <button onclick="inspectApi('/api/v1/common-categories?category_type=LEAD_SOURCE')" class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-indigo-500/50 transition">
                            <span class="text-[10px] font-mono uppercase text-indigo-400 font-bold">GET</span>
                            <div class="text-xs font-mono text-white mt-1">/api/v1/common-categories</div>
                            <div class="text-[11px] text-slate-400 mt-1">Lọc nguồn Lead</div>
                        </button>
                    </div>

                    <!-- JSON Viewer -->
                    <div class="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <div class="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 font-mono">
                            <span id="apiEndpointLabel">Response: JSON Resource</span>
                            <span id="apiStatusCodeLabel" class="text-emerald-400 font-bold">200 OK</span>
                        </div>
                        <pre id="apiJsonViewer" class="mt-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-64">// Nhấn vào một endpoint phía trên để xem Live JSON Response từ Laravel controller</pre>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- MODAL 1: ADD PRODUCT -->
    <div id="productModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="text-base font-bold text-white">Thêm sản phẩm / dịch vụ mới</h3>
                <button onclick="closeModal('productModal')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form id="createProductForm" onsubmit="submitProduct(event)" class="space-y-3 text-xs">
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Mã SKU (Tự động in hoa)</label>
                    <input type="text" id="p_sku" required placeholder="VD: PRD-ERP-01" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono uppercase">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Tên sản phẩm / Dịch vụ</label>
                    <input type="text" id="p_name" required placeholder="VD: Gói CRM Cloud Standard" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-slate-300 font-medium mb-1">Loại hình</label>
                        <select id="p_type" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
                            <option value="SERVICE">Dịch vụ (SERVICE)</option>
                            <option value="PRODUCT">Sản phẩm (PRODUCT)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-slate-300 font-medium mb-1">Đơn vị tính</label>
                        <input type="text" id="p_unit" required value="license/tháng" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500">
                    </div>
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Đơn giá niêm yết (VND)</label>
                    <input type="number" id="p_price" required min="0" value="500000" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Mô tả sản phẩm</label>
                    <textarea id="p_desc" rows="2" placeholder="Tính năng nổi bật..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button type="button" onclick="closeModal('productModal')" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">Hủy</button>
                    <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20">Lưu sản phẩm</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 2: ADD PRICE LIST -->
    <div id="priceListModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="text-base font-bold text-white">Tạo bảng giá mới</h3>
                <button onclick="closeModal('priceListModal')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form id="createPriceListForm" onsubmit="submitPriceList(event)" class="space-y-3 text-xs">
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Mã bảng giá (In hoa)</label>
                    <input type="text" id="pl_code" required placeholder="VD: PL-VIP-2026" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono uppercase">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Tên bảng giá</label>
                    <input type="text" id="pl_name" required placeholder="VD: Bảng giá ưu đãi đại lý cấp 1" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                </div>
                <div class="flex items-center gap-2 py-2">
                    <input type="checkbox" id="pl_is_standard" class="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0">
                    <label for="pl_is_standard" class="text-slate-300">Đặt làm BẢNG GIÁ CHUẨN hệ thống (is_standard)</label>
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Ghi chú điều kiện áp dụng</label>
                    <textarea id="pl_note" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button type="button" onclick="closeModal('priceListModal')" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">Hủy</button>
                    <button type="submit" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md shadow-amber-600/20">Tạo bảng giá</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 3: ADD ITEM TO PRICE LIST -->
    <div id="addPriceListItemModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="text-base font-bold text-white">Gán đơn giá cho sản phẩm</h3>
                <button onclick="closeModal('addPriceListItemModal')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onsubmit="submitPriceListItem(event)" class="space-y-3 text-xs">
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Chọn sản phẩm / dịch vụ</label>
                    <select id="pli_product_id" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"></select>
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Đơn giá riêng (VND)</label>
                    <input type="number" id="pli_unit_price" required min="0" placeholder="VD: 450000" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Số lượng tối thiểu (min_qty)</label>
                    <input type="number" id="pli_min_qty" required min="1" value="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono">
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button type="button" onclick="closeModal('addPriceListItemModal')" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">Hủy</button>
                    <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20">Lưu dòng giá</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 4: ADD COMMON CATEGORY -->
    <div id="categoryModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="text-base font-bold text-white">Thêm danh mục dùng chung</h3>
                <button onclick="closeModal('categoryModal')" class="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onsubmit="submitCategory(event)" class="space-y-3 text-xs">
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Loại danh mục</label>
                    <select id="c_type" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                        <option value="LEAD_SOURCE">Nguồn khách hàng (LEAD_SOURCE)</option>
                        <option value="INDUSTRY">Ngành nghề (INDUSTRY)</option>
                        <option value="BUSINESS_TYPE">Loại hình doanh nghiệp (BUSINESS_TYPE)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Mã code</label>
                    <input type="text" id="c_code" required placeholder="VD: TIKTOK_ADS" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono uppercase">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Tên danh mục</label>
                    <input type="text" id="c_name" required placeholder="VD: Kênh quảng cáo TikTok" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-slate-300 font-medium mb-1">Mô tả</label>
                    <textarea id="c_desc" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button type="button" onclick="closeModal('categoryModal')" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">Hủy</button>
                    <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20">Lưu danh mục</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Frontend Interactive Script -->
    <script>
        let currentPriceListId = null;
        let allProductsCache = [];

        function formatCurrency(val) {
            return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            const target = document.getElementById('tab-' + tabId);
            if (target) target.classList.remove('hidden');

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.className = "tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
            });
            const activeBtn = document.getElementById('btn-' + tabId);
            if (activeBtn) {
                activeBtn.className = "tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 transition";
            }
        }

        function openModal(id) {
            document.getElementById(id).classList.remove('hidden');
        }

        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
        }

        async function loadStats() {
            try {
                const res = await fetch('/api/v1/stats');
                const json = await res.json();
                if (json.success) {
                    document.getElementById('stat-products').innerText = json.data.productCount;
                    document.getElementById('stat-services').innerText = json.data.serviceCount;
                    document.getElementById('stat-pricelists').innerText = json.data.priceListCount;
                    document.getElementById('stat-categories').innerText = json.data.categoryCount;
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function loadProducts() {
            const q = document.getElementById('productSearch').value;
            const type = document.getElementById('productTypeFilter').value;

            try {
                const res = await fetch(`/api/v1/products?q=${encodeURIComponent(q)}&type=${type}`);
                const json = await res.json();
                const tbody = document.getElementById('productsTableBody');
                allProductsCache = json.data || [];

                // populate product select for price list modal
                const select = document.getElementById('pli_product_id');
                select.innerHTML = allProductsCache.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('');

                if (!json.data || json.data.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500 font-sans">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
                    return;
                }

                tbody.innerHTML = json.data.map(p => `
                    <tr class="hover:bg-slate-900/60 transition">
                        <td class="p-3 font-bold text-white">${p.sku}</td>
                        <td class="p-3 text-slate-200 font-sans font-medium">${p.name}</td>
                        <td class="p-3">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${p.type === 'SERVICE' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                                ${p.type}
                            </span>
                        </td>
                        <td class="p-3 text-slate-400">${p.unit}</td>
                        <td class="p-3 text-emerald-400 font-bold">${formatCurrency(p.list_price)}</td>
                        <td class="p-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] ${p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                                ${p.is_active ? 'Đang kinh doanh' : 'Tạm ngưng'}
                            </span>
                        </td>
                        <td class="p-3 text-right">
                            <button onclick="deleteProduct(${p.id})" class="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px] transition">
                                Xóa
                            </button>
                        </td>
                    </tr>
                `).join('');

                document.getElementById('productPageInfo').innerText = `Tổng cộng: ${json.meta.total} mục`;
            } catch (e) {
                console.error(e);
            }
        }

        async function submitProduct(e) {
            e.preventDefault();
            const payload = {
                sku: document.getElementById('p_sku').value,
                name: document.getElementById('p_name').value,
                type: document.getElementById('p_type').value,
                unit: document.getElementById('p_unit').value,
                list_price: parseFloat(document.getElementById('p_price').value),
                description: document.getElementById('p_desc').value,
                is_active: 1
            };

            const res = await fetch('/api/v1/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                closeModal('productModal');
                document.getElementById('createProductForm').reset();
                loadProducts();
                loadStats();
                alert('Đã tạo sản phẩm thành công!');
            } else {
                alert('Lỗi: ' + (json.message || JSON.stringify(json.errors)));
            }
        }

        async function deleteProduct(id) {
            if (!confirm('Xác nhận xóa mềm (soft delete) sản phẩm này?')) return;
            const res = await fetch(`/api/v1/products/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                loadProducts();
                loadStats();
            }
        }

        async function loadPriceLists() {
            const res = await fetch('/api/v1/price-lists');
            const json = await res.json();
            const container = document.getElementById('priceListsGrid');

            if (!json.data || json.data.length === 0) {
                container.innerHTML = `<div class="p-6 text-center text-slate-500">Chưa có bảng giá nào.</div>`;
                return;
            }

            container.innerHTML = json.data.map(pl => `
                <div class="p-4 rounded-xl border ${pl.is_standard ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800 bg-slate-900'} relative">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono font-bold text-white">${pl.code}</span>
                                ${pl.is_standard ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">BẢNG GIÁ CHUẨN</span>' : ''}
                            </div>
                            <h4 class="text-sm font-bold text-slate-200 mt-1">${pl.name}</h4>
                            <p class="text-xs text-slate-400 mt-1">${pl.note || 'Không có ghi chú'}</p>
                        </div>
                        <span class="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                            ${pl.items_count} mặt hàng
                        </span>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span class="text-xs text-slate-400">Tiền tệ: <strong class="text-white">${pl.currency}</strong></span>
                        <button onclick="viewPriceListItems(${pl.id}, '${pl.name}')" class="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 text-xs font-medium transition">
                            Xem & Sửa đơn giá →
                        </button>
                    </div>
                </div>
            `).join('');
        }

        async function submitPriceList(e) {
            e.preventDefault();
            const payload = {
                code: document.getElementById('pl_code').value,
                name: document.getElementById('pl_name').value,
                is_standard: document.getElementById('pl_is_standard').checked ? 1 : 0,
                note: document.getElementById('pl_note').value,
                is_active: 1
            };

            const res = await fetch('/api/v1/price-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                closeModal('priceListModal');
                document.getElementById('createPriceListForm').reset();
                loadPriceLists();
                loadStats();
            } else {
                alert('Lỗi: ' + json.message);
            }
        }

        async function viewPriceListItems(id, name) {
            currentPriceListId = id;
            document.getElementById('currentPriceListName').innerText = name;
            document.getElementById('priceListItemsCard').classList.remove('hidden');

            const res = await fetch(`/api/v1/price-lists/${id}`);
            const json = await res.json();
            const tbody = document.getElementById('priceListItemsTableBody');

            if (!json.data.items || json.data.items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-sans">Bảng giá này chưa có mặt hàng nào. Bấm '+ Gán đơn giá sản phẩm' để thêm.</td></tr>`;
                return;
            }

            tbody.innerHTML = json.data.items.map(item => `
                <tr class="hover:bg-slate-900/60 transition">
                    <td class="p-3 font-bold text-white">${item.product_sku}</td>
                    <td class="p-3 text-slate-200 font-sans">${item.product_name}</td>
                    <td class="p-3 text-slate-400">${item.product_unit}</td>
                    <td class="p-3 text-emerald-400 font-bold">${formatCurrency(item.unit_price)}</td>
                    <td class="p-3 text-slate-300">≥ ${item.min_qty}</td>
                    <td class="p-3 text-right">
                        <button onclick="deletePriceListItem(${item.id})" class="text-rose-400 hover:text-rose-300">Gỡ</button>
                    </td>
                </tr>
            `).join('');
        }

        async function submitPriceListItem(e) {
            e.preventDefault();
            if (!currentPriceListId) return;

            const payload = {
                product_id: parseInt(document.getElementById('pli_product_id').value),
                unit_price: parseFloat(document.getElementById('pli_unit_price').value),
                min_qty: parseFloat(document.getElementById('pli_min_qty').value)
            };

            const res = await fetch(`/api/v1/price-lists/${currentPriceListId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                closeModal('addPriceListItemModal');
                viewPriceListItems(currentPriceListId, document.getElementById('currentPriceListName').innerText);
                loadPriceLists();
            }
        }

        async function deletePriceListItem(itemId) {
            if (!confirm('Gỡ mặt hàng khỏi bảng giá này?')) return;
            const res = await fetch(`/api/v1/price-lists/${currentPriceListId}/items/${itemId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                viewPriceListItems(currentPriceListId, document.getElementById('currentPriceListName').innerText);
                loadPriceLists();
            }
        }

        let currentCatFilter = 'ALL';
        async function filterCategories(type) {
            currentCatFilter = type;
            document.querySelectorAll('.cat-pill').forEach(btn => {
                btn.className = "cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-400 hover:text-white transition";
            });
            event.target.className = "cat-pill px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white transition";
            loadCategories();
        }

        async function loadCategories() {
            const res = await fetch(`/api/v1/common-categories?category_type=${currentCatFilter}`);
            const json = await res.json();
            const tbody = document.getElementById('categoriesTableBody');

            if (!json.data || json.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500 font-sans">Không có danh mục nào.</td></tr>`;
                return;
            }

            tbody.innerHTML = json.data.map(c => `
                <tr class="hover:bg-slate-900/60 transition">
                    <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            ${c.category_type}
                        </span>
                    </td>
                    <td class="p-3 font-bold text-white">${c.code}</td>
                    <td class="p-3 text-slate-200 font-sans font-medium">${c.name}</td>
                    <td class="p-3 text-slate-400 font-sans">${c.description || '—'}</td>
                    <td class="p-3 text-slate-400">${c.sort_order}</td>
                    <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                            ${c.is_active ? 'Kích hoạt' : 'Ẩn'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        async function submitCategory(e) {
            e.preventDefault();
            const payload = {
                category_type: document.getElementById('c_type').value,
                code: document.getElementById('c_code').value,
                name: document.getElementById('c_name').value,
                description: document.getElementById('c_desc').value,
                sort_order: 1,
                is_active: 1
            };

            const res = await fetch('/api/v1/common-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                closeModal('categoryModal');
                loadCategories();
                loadStats();
            } else {
                alert('Lỗi: ' + json.message);
            }
        }

        async function runTestSuite() {
            const btn = document.getElementById('btnRunTests');
            btn.innerHTML = 'Đang chạy test suite...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/v1/run-tests', { method: 'POST' });
                const json = await res.json();

                document.getElementById('testSummaryText').innerText = json.message;
                document.getElementById('testScoreBadge').innerText = json.data.percentage + '%';

                const list = document.getElementById('testList');
                list.innerHTML = json.data.results.map((r, i) => `
                    <div class="p-3 rounded-xl border ${r.passed ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'} flex items-start gap-3">
                        <div class="mt-0.5 w-5 h-5 rounded-full ${r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center font-bold text-xs">
                            ${r.passed ? '✓' : '✗'}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono font-bold text-slate-400">[${r.suite}]</span>
                                <h4 class="text-xs font-bold text-white">${r.name}</h4>
                            </div>
                            <p class="text-[11px] text-slate-400 mt-1 font-mono">${r.details}</p>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${r.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                            ${r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                    </div>
                `).join('');
            } catch (e) {
                console.error(e);
            } finally {
                btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Chạy lại 9 Test Suite`;
                btn.disabled = false;
            }
        }

        async function inspectApi(endpoint) {
            document.getElementById('apiEndpointLabel').innerText = 'Request: ' + endpoint;
            document.getElementById('apiJsonViewer').innerText = 'Đang gọi API...';

            const res = await fetch(endpoint);
            const statusText = res.status + ' ' + res.statusText;
            document.getElementById('apiStatusCodeLabel').innerText = statusText;

            const json = await res.json();
            document.getElementById('apiJsonViewer').innerText = JSON.stringify(json, null, 2);
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadProducts();
            loadPriceLists();
            loadCategories();
            runTestSuite(); // Auto-run on load for immediate test feedback
        });
    </script>
</body>
</html>
