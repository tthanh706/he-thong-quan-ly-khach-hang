# Task SCRUM-111 (S3-07): Tìm kiếm và lọc khách hàng theo nhiều điều kiện

## 1. Thông tin User Story
- **Mã Story:** `SCRUM-111` (Mã Backlog Sprint 3: `S3-07`)
- **Người thực hiện:** NGUYỄN VĂN HOÀNG
- **Vai trò:** Nhân viên kinh doanh
- **Nội dung:** Là Nhân viên kinh doanh, tôi muốn tìm kiếm và lọc khách hàng theo nhiều điều kiện, để dựng nhanh danh sách khách cần gọi trong tuần.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  1. **Lọc theo nhiều điều kiện kết hợp:**
     - Trạng thái khách hàng (Tiềm năng, Đang giao dịch, Khách hàng, Ngừng hợp tác).
     - Ngành nghề kinh doanh (Công nghệ, Sản xuất, Bán lẻ, Xây dựng, Tài chính...).
     - Quy mô công ty (< 50, 50 - 200, 200 - 500, > 500 nhân sự).
     - Khu vực địa lý (Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ, Hải Phòng...).
     - Người phụ trách (nhân viên sở hữu).
  2. **Tìm kiếm đa trường:**
     - Tìm kiếm theo tên công ty (`customers.name`).
     - Tìm kiếm theo mã số thuế (`customers.tax_code`).
     - Tìm kiếm theo số điện thoại người liên hệ (`contacts.phone`).
  3. **Lưu và tái sử dụng bộ lọc thường dùng (Saved Filters):**
     - Lưu các tham số lọc đang chọn thành một bộ lọc mẫu có tên gợi nhớ (ví dụ: "Khách gọi tuần này", "Khách IT Hà Nội").
     - Tải lại bộ lọc nhanh chóng qua danh sách thả xuống với một cú click.
     - Xóa các bộ lọc mẫu không còn sử dụng.

---

## 2. Danh sách các file trong task:

### Backend (Laravel 11):
- `database/migrations/2026_10_14_000001_add_business_profile_and_filters_to_customers_table.php`: Tạo bảng `saved_filters` lưu bộ lọc người dùng và thêm cột `area`, `industry`, `company_size` cho bảng `customers`.
- `app/Models/SavedFilter.php`: Model Eloquent quản lý các bộ lọc đã lưu của từng người dùng, tự động cast `filter_criteria` sang mảng JSON.
- `app/Models/Customer.php`: Cung cấp quan hệ `contacts()` và tích hợp logic tìm kiếm theo tên, MST, SĐT người liên hệ.
- `app/Http/Requests/Customer/FilterCustomerRequest.php`: FormRequest xác thực các tham số tìm kiếm và lọc (`search`, `status`, `industry`, `company_size`, `area`, `owner_id`, `page`, `per_page`).
- `app/Http/Requests/Customer/StoreSavedFilterRequest.php`: FormRequest xác thực tên bộ lọc và các tiêu chí lọc cần lưu.
- `app/Http/Resources/SavedFilterResource.php`: JsonResource chuẩn hóa dữ liệu trả về của bộ lọc đã lưu.
- `app/Services/CustomerService.php`:
  - `getFilteredCustomers()`: Xây dựng Query Builder lọc linh hoạt đa điều kiện, tìm kiếm regex/like trên tên công ty, MST và `whereHas('contacts', ...)` trên SĐT liên hệ.
  - `getFilterOptions()`: Cung cấp danh sách động các ngành nghề, quy mô, khu vực, người phụ trách để hiển thị lên thanh lọc.
  - `saveFilter()`, `getSavedFilters()`, `deleteSavedFilter()`: Xử lý CRUD bộ lọc người dùng.
- `app/Http/Controllers/Api/V1/CustomerController.php`: Bổ sung các endpoint `/api/v1/customers/filter-options`, `/api/v1/customers/saved-filters`.
- `routes/api.php`: Đăng ký các route tìm kiếm, lọc và lưu bộ lọc.
- `tests/Feature/CustomerProfileAndFilterTest.php`: Feature test kiểm tra tìm kiếm theo tên, MST, SĐT người liên hệ và lưu/áp dụng bộ lọc.
- `tests/run_tests.php`: Test runner kiểm tra hoàn thành 100% (53/53 passed).

### Frontend (React 18 + TypeScript + Vite):
- `src/pages/CustomerManagementPage.tsx`:
  - Thanh tìm kiếm tức thời hỗ trợ tìm theo Tên công ty, MST và SĐT người liên hệ.
  - Thanh công cụ bộ lọc đa tiêu chí: Trạng thái, Ngành nghề, Quy mô, Khu vực, Người phụ trách.
  - Modal lưu bộ lọc ("Lưu bộ lọc hiện tại") và dropdown danh sách bộ lọc đã lưu ("⭐ Bộ lọc đã lưu").
  - Đếm số kết quả tìm kiếm và nút "Đặt lại" để xóa nhanh bộ lọc.
- `src/pages/CustomerManagementPage.css`: Giao diện thanh lọc hiện đại, huy hiệu đếm kết quả, menu dropdown bộ lọc trực quan.
- `src/services/customerService.ts`: Khai báo các API call `getFilterOptions()`, `getSavedFilters()`, `saveFilter()`, `deleteSavedFilter()`.
- `src/types/index.ts`: Khai báo kiểu dữ liệu TypeScript `CustomerFilters`, `SavedFilterItem`, `CustomerFilterOptions`.

---

## 3. Hướng dẫn chạy và kiểm thử:
```bash
# 1. Chạy Backend kiểm thử
cd develop/backend
C:\xampp\php\php.exe tests/run_tests.php

# 2. Khởi động hệ thống
# Chạy start-dev.bat hoặc chạy lệnh dev thông thường
```
