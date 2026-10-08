# S2-05 Product/Pricing · S2-07 Common Category

Backend module cho **Laravel 13 + PHP 8.3**, chuẩn hóa 100% theo tài liệu **CODE CONVENTION HỆ THỐNG QUẢN LÝ KHÁCH HÀNG (CRM)** (PSR-12, Clean API Architecture, Thin Controller, FormRequest riêng biệt, Service Layer, JsonResource & Collection, Policy & RBAC, DataScopeEnum, snake_case DB).

---

## 1. Cấu Trúc Thư Mục Chuẩn (Clean Architecture)

```text
laravel/
├── app/
│   ├── Enums/
│   │   ├── CategoryTypeEnum.php       # LEAD_SOURCE | INDUSTRY | BUSINESS_TYPE
│   │   ├── DataScopeEnum.php          # MY | TEAM | ALL (Section 6 & 8)
│   │   └── ProductTypeEnum.php        # PRODUCT | SERVICE
│   ├── Exceptions/
│   │   └── Handler.php                # Unified JSON error response (400, 401, 403, 404, 422, 500)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php         # Base Controller (AuthorizesRequests)
│   │   │   └── Api/V1/
│   │   │       ├── CommonCategoryController.php
│   │   │       ├── PriceListController.php
│   │   │       └── ProductController.php
│   │   ├── Middleware/
│   │   │   └── CheckDataScope.php     # Phân quyền Data Scope (MY, TEAM, ALL)
│   │   ├── Requests/
│   │   │   ├── CommonCategory/
│   │   │   │   ├── CreateCommonCategoryRequest.php
│   │   │   │   ├── UpdateCommonCategoryRequest.php
│   │   │   │   └── UpsertCommonCategoryRequest.php
│   │   │   ├── PriceList/
│   │   │   │   ├── CreatePriceListItemRequest.php
│   │   │   │   ├── CreatePriceListRequest.php
│   │   │   │   ├── UpdatePriceListRequest.php
│   │   │   │   └── UpsertPriceListItemRequest.php
│   │   │   └── Product/
│   │   │       ├── CreateProductRequest.php
│   │   │       └── UpdateProductRequest.php
│   │   └── Resources/
│   │       ├── CommonCategoryCollection.php
│   │       ├── CommonCategoryResource.php
│   │       ├── PriceListCollection.php
│   │       ├── PriceListItemResource.php
│   │       ├── PriceListResource.php
│   │       ├── ProductCollection.php
│   │       └── ProductResource.php
│   ├── Models/
│   │   ├── CommonCategory.php
│   │   ├── PriceList.php
│   │   ├── PriceListItem.php
│   │   ├── Product.php
│   │   └── User.php                   # Authenticatable, Role, DataScope, Token
│   ├── Policies/
│   │   ├── CommonCategoryPolicy.php
│   │   ├── PriceListPolicy.php
│   │   └── ProductPolicy.php
│   ├── Providers/
│   │   └── AppServiceProvider.php     # Policy mappings
│   └── Services/
│       ├── CommonCategoryService.php
│       ├── PriceListService.php
│       └── ProductService.php
├── database/
│   ├── init_db.php                    # Script khởi tạo SQLite demo
│   ├── database.sqlite
│   └── migrations/
│       ├── 2026_10_05_000001_create_products_table.php
│       ├── 2026_10_05_000002_create_price_lists_table.php
│       └── 2026_10_05_000003_create_common_categories_table.php
├── public/
│   └── index.php                      # Giao diện Web CRM & API Runner trực tiếp
├── routes/
│   └── api.php                        # Route prefix v1, Sanctum middleware
├── tests/
│   ├── run_tests.php                  # Runner kiểm thử tự động 9 Test Suites
│   ├── TestCase.php                   # Base TestCase
│   ├── Feature/
│   │   ├── CommonCategoryControllerTest.php
│   │   ├── PriceListControllerTest.php
│   │   ├── ProductControllerTest.php
│   │   └── ProductPermissionTest.php
│   └── Unit/
│       ├── PriceListServiceTest.php
│       └── ProductServiceTest.php
└── composer.json                      # Cấu hình PSR-4 và Laravel framework
```

---

## 2. API Endpoints `/api/v1`

| Method | Endpoint | FormRequest | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/products` | — | Phân trang catalog & tìm kiếm |
| POST | `/api/v1/products` | `CreateProductRequest` | Tạo Product/Service (SKU unique, in hoa) |
| GET | `/api/v1/products/{id}` | — | Chi tiết sản phẩm |
| PATCH | `/api/v1/products/{id}` | `UpdateProductRequest` | Cập nhật thông tin |
| DELETE | `/api/v1/products/{id}` | — | Soft delete sản phẩm |
| GET | `/api/v1/price-lists` | — | Danh sách bảng giá |
| POST | `/api/v1/price-lists` | `CreatePriceListRequest` | Tạo bảng giá (`is_standard` duy nhất) |
| GET | `/api/v1/price-lists/{id}` | — | Chi tiết bảng giá + danh sách items |
| POST | `/api/v1/price-lists/{id}/items` | `CreatePriceListItemRequest` | Upsert dòng giá sản phẩm |
| DELETE | `/api/v1/price-lists/{id}/items/{item}` | — | Gỡ dòng giá khỏi bảng giá |
| GET | `/api/v1/common-categories?category_type=` | — | Lọc LEAD_SOURCE / INDUSTRY / BUSINESS_TYPE |
| POST | `/api/v1/common-categories` | `CreateCommonCategoryRequest` | Tạo danh mục dùng chung |
| PATCH | `/api/v1/common-categories/{id}` | `UpdateCommonCategoryRequest` | Cập nhật danh mục |
| DELETE | `/api/v1/common-categories/{id}` | — | Xóa danh mục dùng chung |
| GET | `/api/v1/stats` | — | Thống kê số lượng catalog |
| POST | `/api/v1/run-tests` | — | Chạy tự động 9 test suites qua HTTP |

Cấu trúc response thống nhất:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

---

## 3. Khởi Chạy Web & Chạy Kiểm Thử (Testing)

### Khởi động Web Server (PHP 8.3):
```bash
php -S 127.0.0.1:8000 -t laravel/public
```
Mở trình duyệt: **`http://127.0.0.1:8000`** để truy cập Web CRM:
- Xem bảng điều khiển Catalog (Sản phẩm, Dịch vụ, Bảng giá, Danh mục dùng chung).
- Tạo, sửa, xóa sản phẩm, bảng giá và danh mục trực quan.
- Chạy live test suite và kiểm tra REST API trực tiếp.

### Chạy Test Suite CLI:
```bash
php laravel/tests/run_tests.php
```
Kết quả: 9/9 test suites PASSED (100%).
