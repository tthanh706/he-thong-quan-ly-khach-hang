<?php

declare(strict_types=1);

$dbFile = __DIR__ . '/database.sqlite';

$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Products table
$pdo->exec("
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('PRODUCT', 'SERVICE')),
    unit TEXT NOT NULL DEFAULT 'unit',
    description TEXT,
    list_price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'VND',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
");

// 2. Price lists table
$pdo->exec("
CREATE TABLE IF NOT EXISTS price_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    is_standard INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    effective_from DATE,
    effective_to DATE,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_lists_code ON price_lists(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_price_lists_is_standard ON price_lists(is_standard);
");

// 3. Price list items
$pdo->exec("
CREATE TABLE IF NOT EXISTS price_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    unit_price REAL NOT NULL DEFAULT 0,
    min_qty REAL NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    UNIQUE(price_list_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON price_list_items(product_id);
");

// 4. Common categories
$pdo->exec("
CREATE TABLE IF NOT EXISTS common_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_type TEXT NOT NULL CHECK(category_type IN ('LEAD_SOURCE', 'INDUSTRY', 'BUSINESS_TYPE')),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    UNIQUE(category_type, code)
);
CREATE INDEX IF NOT EXISTS idx_common_categories_type ON common_categories(category_type);
");

// 5. Users
$pdo->exec("
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'SALES_REP',
    data_scope TEXT NOT NULL DEFAULT 'MY',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
");

// Seed initial data if empty
$productCount = (int) $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
if ($productCount === 0) {
    $now = date('Y-m-d H:i:s');
    $pdo->exec("
        INSERT INTO products (sku, name, type, unit, description, list_price, currency, is_active, created_at, updated_at) VALUES
        ('CRM-PRO-01', 'Gói phần mềm CRM Enterprise', 'SERVICE', 'license/năm', 'Hệ thống CRM quản lý khách hàng 360 độ cho doanh nghiệp vừa và lớn', 12000000, 'VND', 1, '$now', '$now'),
        ('CRM-SMART-02', 'CRM Cloud Standard', 'SERVICE', 'user/tháng', 'Bản Cloud cho nhóm kinh doanh dưới 20 nhân sự', 150000, 'VND', 1, '$now', '$now'),
        ('HW-SCAN-01', 'Máy quét mã vạch không dây QR-Pro', 'PRODUCT', 'chiếc', 'Máy quét mã vạch 2D bluetooth cho kho và điểm bán', 2850000, 'VND', 1, '$now', '$now'),
        ('HW-POS-02', 'Máy POS cảm ứng POS-i3', 'PRODUCT', 'bộ', 'Thiết bị POS tích hợp máy in hóa đơn nhiệt 80mm', 8900000, 'VND', 1, '$now', '$now');

        INSERT INTO price_lists (code, name, currency, is_standard, is_active, effective_from, effective_to, note, created_at, updated_at) VALUES
        ('PL-STD-2026', 'Bảng giá niêm yết toàn quốc 2026', 'VND', 1, 1, '2026-01-01', '2026-12-31', 'Bảng giá chuẩn áp dụng cho khối kinh doanh trực tiếp', '$now', '$now'),
        ('PL-ENT-VIP', 'Bảng giá đối tác chiến lược Enterprise', 'VND', 0, 1, '2026-01-01', '2026-12-31', 'Ưu đãi chiết khấu 10-15% cho hợp đồng từ 3 năm', '$now', '$now');

        INSERT INTO price_list_items (price_list_id, product_id, unit_price, min_qty, created_at, updated_at) VALUES
        (1, 1, 12000000, 1, '$now', '$now'),
        (1, 2, 150000, 5, '$now', '$now'),
        (1, 3, 2850000, 1, '$now', '$now'),
        (2, 1, 10500000, 2, '$now', '$now'),
        (2, 2, 130000, 10, '$now', '$now');

        INSERT INTO common_categories (category_type, code, name, description, sort_order, is_active, created_at, updated_at) VALUES
        ('LEAD_SOURCE', 'WEBSITE', 'Website công ty', 'Khách hàng điền form liên hệ trên website', 1, 1, '$now', '$now'),
        ('LEAD_SOURCE', 'FACEBOOK_ADS', 'Facebook Ads', 'Quảng cáo lead form Meta', 2, 1, '$now', '$now'),
        ('LEAD_SOURCE', 'REFERRAL', 'Đối tác giới thiệu', 'Giới thiệu qua mạng lưới đối tác', 3, 1, '$now', '$now'),
        ('INDUSTRY', 'IT_SOFTWARE', 'Công nghệ thông tin & Phần mềm', 'Doanh nghiệp SaaS, IT Outsourcing', 1, 1, '$now', '$now'),
        ('INDUSTRY', 'MANUFACTURING', 'Sản xuất & Chế biến', 'Nhà máy, xưởng gia công', 2, 1, '$now', '$now'),
        ('INDUSTRY', 'RETAIL', 'Bán lẻ & Thương mại điện tử', 'Chuỗi cửa hàng, shop online', 3, 1, '$now', '$now'),
        ('BUSINESS_TYPE', 'B2B', 'Khách hàng doanh nghiệp (B2B)', 'Bán hàng cho tổ chức, công ty', 1, 1, '$now', '$now'),
        ('BUSINESS_TYPE', 'B2C', 'Khách hàng cá nhân (B2C)', 'Bán trực tiếp cho người tiêu dùng', 2, 1, '$now', '$now');

        INSERT INTO users (name, email, role, data_scope, is_active) VALUES
        ('Nguyễn Văn Giám Đốc', 'director@crm.vn', 'SALES_DIRECTOR', 'ALL', 1),
        ('Trần Thị Trưởng Nhóm', 'lead@crm.vn', 'SALES_LEAD', 'TEAM', 1),
        ('Lê Hoàng Nhân Viên', 'staff@crm.vn', 'SALES_REP', 'MY', 1);
    ");
}

echo "Database initialized successfully at: " . $dbFile . "\n";
