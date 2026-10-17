# Backend API – CRM System  
**US-06 · US-08 · US-09**  
PHP 8.3 · Laravel 11 · MySQL · Sanctum

---

## 1. Cài đặt phụ thuộc cần thiết

```bash
composer require maatwebsite/excel          # hoặc phpoffice/phpspreadsheet
composer require laravel/sanctum
```

Đăng ký Policy trong `AuthServiceProvider` (hoặc `AppServiceProvider` Laravel 11):

```php
use App\Models\SupportRequest;
use App\Models\PeriodicCare;
use App\Policies\SupportRequestPolicy;
use App\Policies\PeriodicCarePolicy;

protected $policies = [
    SupportRequest::class => SupportRequestPolicy::class,
    PeriodicCare::class   => PeriodicCarePolicy::class,
];
```

Chạy migration:

```bash
php artisan migrate
```

---

## 2. API Endpoints

### US-06: API Nhập Excel khách hàng

| Method | Endpoint                              | Mô tả                          |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/v1/customers/import/template`   | Tải file mẫu .xlsx             |
| POST   | `/api/v1/customers/import/preview`    | Upload file → validate & preview |
| POST   | `/api/v1/customers/import/confirm`    | Xác nhận lưu các dòng hợp lệ   |

**Preview request:** `multipart/form-data`  
- `file`: file .xlsx / .xls (max 10MB)

**Confirm request (JSON):**
```json
{
  "rows": [
    {
      "code": "KH001",
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "email": "a@gmail.com",
      "tax_code": "0123456789",
      "address": "Hà Nội"
    }
  ]
}
```

---

### US-08: API Yêu cầu hỗ trợ + Cảnh báo

| Method | Endpoint                                | Mô tả                              |
|--------|-----------------------------------------|------------------------------------|
| GET    | `/api/v1/support-requests`              | Danh sách (filter + phân trang)    |
| GET    | `/api/v1/support-requests/warnings`     | **Cảnh báo** quá hạn / chưa phân công |
| POST   | `/api/v1/support-requests`              | Tạo yêu cầu hỗ trợ mới             |
| GET    | `/api/v1/support-requests/{id}`         | Chi tiết                           |
| PATCH  | `/api/v1/support-requests/{id}`         | Cập nhật (status, priority, note…) |
| POST   | `/api/v1/support-requests/{id}/assign`  | Phân công nhân viên                |
| DELETE | `/api/v1/support-requests/{id}`         | Soft delete                        |

**Warnings query params:**  
`hours_high` (mặc định 24), `hours_normal` (mặc định 72)

**Response warnings:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "high_priority_overdue": 2,
    "normal_overdue": 1,
    "unassigned": 3,
    "items": [ ... ]
  },
  "message": "Lấy danh sách cảnh báo yêu cầu hỗ trợ thành công."
}
```

**Query params list:**  
`status`, `priority`, `customer_id`, `search`, `sort_by`, `sort_order`, `per_page`, `page`

**Create body:**
```json
{
  "customer_id": 1,
  "subject": "Lỗi không đăng nhập được phần mềm",
  "description": "Chi tiết…",
  "priority": "HIGH",
  "assignee_id": null
}
```

**Priority:** `LOW` | `MEDIUM` | `HIGH`  
**Status:** `OPEN` | `IN_PROGRESS` | `CLOSED`

---

### US-09: API Chăm sóc định kỳ + Cảnh báo

| Method | Endpoint                                   | Mô tả                                      |
|--------|--------------------------------------------|--------------------------------------------|
| GET    | `/api/v1/periodic-cares`                   | Danh sách lịch chăm sóc                    |
| GET    | `/api/v1/periodic-cares/warnings`          | **Cảnh báo** sắp đến hạn / quá hạn         |
| POST   | `/api/v1/periodic-cares`                   | Tạo lịch chăm sóc mới                      |
| GET    | `/api/v1/periodic-cares/{id}`              | Chi tiết                                   |
| PATCH  | `/api/v1/periodic-cares/{id}`              | Cập nhật lịch                              |
| POST   | `/api/v1/periodic-cares/{id}/mark-done`    | Đánh dấu hoàn thành                        |
| DELETE | `/api/v1/periodic-cares/{id}`              | Soft delete                                |

**Create body:**
```json
{
  "customer_id": 1,
  "care_type": "Bảo trì hệ thống định kỳ",
  "scheduled_date": "2026-04-15",
  "assignee_id": 2,
  "notes": "Ghi chú thêm"
}
```

**Care Type (enum):**
- `Bảo trì hệ thống định kỳ`
- `Thăm hỏi & Khảo sát hài lòng`
- `Gia hạn hợp đồng / dịch vụ`

**Status:** `PENDING` | `DONE` | `CANCELLED`

**Warnings query:** `?days=7` (mặc định 7 ngày)

---

## 3. Response chuẩn

```json
{
  "success": true,
  "data": { ... },
  "meta": {                  // chỉ có ở list
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  },
  "message": "Thông báo tiếng Việt"
}
```

HTTP Status:
- `200` / `201` thành công
- `400` request sai
- `401` chưa xác thực
- `403` không có quyền / vượt data scope
- `404` không tồn tại
- `422` validation FormRequest
- `500` lỗi server

---

## 4. Data Scope

Mọi list / detail / update đều áp dụng **Data Scope** (`MY` / `TEAM` / `ALL`) thông qua:

- Eloquent Local Scope `scopeDataScope()`
- Laravel Policy tương ứng

Backend **không** tin tưởng `owner_id` từ client.

---

## 5. Cấu trúc thư mục đã tạo

```
app/
├── Enums/
│   ├── SupportPriorityEnum.php
│   ├── SupportStatusEnum.php
│   ├── CareStatusEnum.php
│   └── CareTypeEnum.php
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── CustomerImportController.php
│   │   ├── SupportRequestController.php
│   │   └── PeriodicCareController.php
│   ├── Requests/
│   │   ├── Customer/
│   │   ├── SupportRequest/
│   │   └── PeriodicCare/
│   └── Resources/
├── Models/
│   ├── Customer.php
│   ├── SupportRequest.php
│   ├── PeriodicCare.php
│   └── User.php
├── Policies/
│   ├── SupportRequestPolicy.php
│   └── PeriodicCarePolicy.php
└── Services/
    ├── CustomerImportService.php
    ├── SupportRequestService.php
    └── PeriodicCareService.php

database/migrations/
├── 2026_03_01_000001_create_support_requests_table.php
├── 2026_03_01_000002_create_periodic_cares_table.php
└── 2026_03_01_000003_create_import_logs_table.php

routes/api.php
```

---

## 6. Mapping Frontend ↔ Backend

| Frontend Page              | Backend Controller              | Main Endpoints                          |
|----------------------------|---------------------------------|-----------------------------------------|
| ExcelImportPage.tsx        | CustomerImportController        | template / preview / confirm            |
| SupportRequestPage.tsx     | SupportRequestController        | CRUD + assign                           |
| PeriodicCarePage.tsx       | PeriodicCareController          | CRUD + mark-done + warnings             |

Tất cả tuân thủ:
- Thin Controller – Thick Service
- FormRequest validation
- JsonResource response
- Soft delete
- Data Scope + Policy
- Conventional Commits & GitFlow (feature/import-excel, feature/support-request, feature/periodic-care)
