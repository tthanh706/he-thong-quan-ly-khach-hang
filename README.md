# S4-04: Lead Deduplication (Cảnh báo & Gộp Lead trùng lặp)

## Tổng quan
Feature cho phép **nhân viên Marketing** phát hiện, cảnh báo và gộp các bản ghi Lead trùng lặp trong hệ thống CRM. Hỗ trợ gợi ý gắn Lead vào hồ sơ Khách hàng đã tồn tại.

---

## Cấu trúc thư mục

```
S4-04_Lead_Deduplication/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   └── LeadDeduplicationController.php
│   │   │   ├── Requests/
│   │   │   │   ├── StoreLeadRequest.php
│   │   │   │   ├── MergeLeadRequest.php
│   │   │   │   └── LinkLeadToCustomerRequest.php
│   │   │   └── Resources/
│   │   │       ├── LeadResource.php
│   │   │       ├── LeadActivityLogResource.php
│   │   │       └── DuplicateCheckResource.php
│   │   ├── Models/
│   │   │   ├── Lead.php
│   │   │   ├── LeadActivityLog.php
│   │   │   └── LeadMergeLog.php
│   │   └── Services/
│   │       └── LeadDeduplicationService.php
│   ├── database/migrations/
│   │   ├── 2026_10_21_000001_create_leads_table.php
│   │   ├── 2026_10_21_000002_create_lead_merge_logs_table.php
│   │   └── 2026_10_21_000003_create_lead_activity_logs_table.php
│   ├── routes/
│   │   └── lead_deduplication.php
│   └── tests/
│       ├── Unit/Services/
│       │   └── LeadDeduplicationServiceTest.php
│       └── Feature/Api/
│           └── LeadDeduplicationApiTest.php
├── frontend/
│   └── src/
│       ├── types/
│       │   └── lead.types.ts
│       ├── services/
│       │   └── leadApi.ts
│       └── components/
│           ├── LeadDeduplicationPanel.tsx
│           ├── DuplicateWarningBanner.tsx
│           ├── LeadMergeModal.tsx
│           └── LinkCustomerModal.tsx
└── README.md
```

---

## API Specifications

### Base URL: `/api/leads`

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/leads` | Danh sách lead (pagination) |
| `POST` | `/api/leads` | Tạo lead mới (auto-check trùng lặp) |
| `GET` | `/api/leads/{id}` | Chi tiết lead |
| `GET` | `/api/leads/{id}/check-duplicates` | Kiểm tra trùng lặp |
| `POST` | `/api/leads/merge` | Gộp 2 lead |
| `POST` | `/api/leads/{id}/link-customer` | Gắn lead vào khách hàng |

### 1. GET `/api/leads`

**Query Parameters:**
| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | int | 1 | Trang hiện tại |
| `per_page` | int | 20 | Số bản ghi / trang |
| `search` | string | — | Tìm theo tên, email, SĐT, công ty |
| `status` | string | — | Lọc theo trạng thái |
| `sort_by` | string | created_at | Sắp xếp theo trường |
| `sort_dir` | string | desc | Hướng sắp xếp (asc/desc) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "first_name": "Nguyễn",
      "last_name": "Văn A",
      "full_name": "Nguyễn Văn A",
      "email": "a@company.com",
      "phone_number": "+84901234567",
      "company_name": "ABC Corp",
      "status": "new",
      "activity_logs_count": 5,
      "created_at": "2026-10-20T10:00:00.000Z"
    }
  ],
  "meta": { "current_page": 1, "last_page": 5, "total": 100 }
}
```

### 2. POST `/api/leads`

**Body:**
```json
{
  "first_name": "Nguyễn",
  "last_name": "Văn B",
  "email": "b@company.com",
  "phone_number": "+84909876543",
  "company_name": "XYZ Corp"
}
```

**Response (201):**
```json
{
  "data": { "id": 2, "first_name": "Nguyễn", "..." : "..." },
  "warning": {
    "lead_id": 2,
    "has_duplicates": true,
    "duplicate_leads": [...],
    "has_matching_customers": true,
    "matching_customers": [...],
    "suggestion": "Tìm thấy 1 lead trùng lặp và 1 khách hàng phù hợp..."
  }
}
```

### 3. GET `/api/leads/{id}/check-duplicates`

**Response:**
```json
{
  "lead_id": 1,
  "has_duplicates": true,
  "duplicate_leads": [...],
  "has_matching_customers": false,
  "matching_customers": [],
  "suggestion": "Tìm thấy 2 lead trùng lặp. Gợi ý: Xem xét gộp các lead trùng."
}
```

### 4. POST `/api/leads/merge`

**Body:**
```json
{
  "primary_lead_id": 1,
  "secondary_lead_id": 2,
  "merge_reason": "Cùng khách hàng, nhập trùng"
}
```

**Response:**
```json
{
  "message": "Gộp lead thành công.",
  "data": {
    "id": 1,
    "activity_logs": [...]
  }
}
```

### 5. POST `/api/leads/{id}/link-customer`

**Body:**
```json
{
  "customer_id": 10
}
```

**Response:**
```json
{
  "message": "Lead đã được gắn vào hồ sơ khách hàng.",
  "data": { "id": 1, "status": "converted", "linked_customer_id": 10 }
}
```

---

## Logic gộp Lead (Merge)

1. **Snapshot** cả 2 lead trước khi gộp (lưu vào `lead_merge_logs`).
2. **Bổ sung trường trống**: Nếu lead chính thiếu dữ liệu (email, SĐT...), lấy từ lead phụ.
3. **Chuyển toàn bộ activity logs** từ lead phụ → lead chính (giữ nguyên timestamp gốc).
4. **Đánh dấu lead phụ** status = `merged`, soft-delete.
5. **Ghi nhận audit log** đầy đủ: ai thực hiện, thời điểm, snapshot, lý do.
6. Tất cả trong **DB Transaction** — rollback nếu lỗi.

---

## Hướng dẫn tích hợp

### Backend
1. Chạy migration: `php artisan migrate`
2. Đăng ký routes trong `routes/api.php`:
   ```php
   require __DIR__ . '/lead_deduplication.php';
   ```
3. Đăng ký Service: `LeadDeduplicationService` được inject tự động qua constructor.
4. Yêu cầu: Model `Customer` và `User` cần tồn tại trong hệ thống.

### Frontend
1. Import component chính:
   ```tsx
   import LeadDeduplicationPanel from './components/LeadDeduplicationPanel';
   ```
2. Cấu hình Axios base URL trỏ đến backend API.
3. Đảm bảo authentication token được gắn vào Axios interceptor.

### Chạy Tests
```bash
php artisan test --filter=LeadDeduplicationServiceTest
php artisan test --filter=LeadDeduplicationApiTest
```
