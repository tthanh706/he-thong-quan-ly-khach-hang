# Task SCRUM-105 (S3-01): Quản lý hồ sơ khách hàng doanh nghiệp

## 1. Thông tin User Story
- **Mã Story:** `SCRUM-105` (Mã Backlog Sprint 3: `S3-01`)
- **Vai trò:** Nhân viên kinh doanh
- **Nội dung:** Là Nhân viên kinh doanh, tôi muốn quản lý hồ sơ khách hàng doanh nghiệp, để có một danh sách khách chuẩn thay vì file Excel riêng của từng người.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  1. Khai báo đầy đủ các trường: tên công ty, mã số thuế, ngành nghề, quy mô, website, địa chỉ, người sở hữu.
  2. Mã số thuế nếu có thì phải là duy nhất (kiểm tra tính duy nhất, báo lỗi tiếng Việt nếu trùng).
  3. Khách hàng có 4 trạng thái chuẩn: **Tiềm năng**, **Đang giao dịch**, **Khách hàng**, **Ngừng hợp tác**.
  4. Phân quyền dữ liệu (Data Scope):
     - **Nhân viên kinh doanh:** Chỉ thấy khách hàng do mình sở hữu (`owner_id = user.id`).
     - **Trưởng nhóm kinh doanh:** Thấy toàn bộ khách hàng của tất cả thành viên trong nhóm.
     - **Quản trị viên / Ban giám đốc:** Thấy toàn bộ khách hàng trên toàn hệ thống.

---

## 2. Danh sách các file trong task:

### Backend (Laravel 11):
- `database/migrations/2026_10_14_000001_add_business_profile_and_filters_to_customers_table.php`: Migration thêm các trường hồ sơ doanh nghiệp (`industry`, `company_size`, `website`, `area`) và bảng `saved_filters`.
- `app/Models/Customer.php`: Cập nhật Eloquent Model, các hằng số trạng thái chuẩn (`STATUS_LEAD`, `STATUS_IN_PROGRESS`, `STATUS_CUSTOMER`, `STATUS_STOPPED`), hằng số quy mô, và logic phân quyền `scopeDataScope($query, User $user)`.
- `app/Models/User.php`: Bổ sung phương thức `teamMemberIds()` hỗ trợ nhóm kinh doanh đa phòng ban và `hasRole()`.
- `app/Http/Requests/Customer/StoreCustomerProfileRequest.php`: FormRequest validate khai báo hồ sơ khách hàng với validation `unique:customers,tax_code` và thông báo lỗi tiếng Việt.
- `app/Http/Requests/Customer/UpdateCustomerProfileRequest.php`: FormRequest validate cập nhật hồ sơ khách hàng với validation `unique:customers,tax_code` loại trừ ID hiện tại.
- `app/Http/Resources/CustomerProfileResource.php`: JsonResource định dạng dữ liệu khách hàng theo chuẩn API.
- `app/Services/CustomerService.php`: Tầng Service xử lý nghiệp vụ tạo, cập nhật, xóa, phân quyền data scope và kiểm tra trùng mã số thuế.
- `app/Http/Controllers/Api/V1/CustomerController.php`: Controller RESTful API (`GET`, `POST`, `PUT`, `DELETE` tại `/api/v1/customers`).
- `routes/api.php`: Đăng ký các route API.
- `tests/Feature/CustomerProfileAndFilterTest.php`: Feature test tự động kiểm tra data scope, tính duy nhất của MST và 4 trạng thái chuẩn.
- `tests/run_tests.php`: Bộ test runner tích hợp chạy kiểm thử qua CLI đạt 100% (53/53 passed).

### Frontend (React 18 + TypeScript + Vite):
- `src/pages/CustomerManagementPage.tsx`: Màn hình giao diện quản lý hồ sơ khách hàng doanh nghiệp, thẻ KPI thống kê, bảng danh sách khách chuẩn, modal khai báo/chỉnh sửa đầy đủ 8 trường, modal xem chi tiết 360 thu nhỏ.
- `src/pages/CustomerManagementPage.css`: Giao diện hiện đại, responsive, thẻ trạng thái trực quan, modal mượt mà.
- `src/pages/Customers.tsx`: Xuất component phục vụ tương thích route.
- `src/services/customerService.ts`: Service gọi API backend qua token xác thực.
- `src/types/index.ts`: Khai báo kiểu dữ liệu TypeScript (`Customer`, `CustomerPayload`, `CustomerStatus`).
- `src/App.tsx`: Tích hợp menu `🏢 Hồ sơ khách hàng` trong sidebar điều hướng và routing.
- `src/api/client.ts`: HTTP client utility.

---

## 3. Hướng dẫn chạy và kiểm thử:
```bash
# 1. Chạy Backend kiểm thử
cd develop/backend
C:\xampp\php\php.exe tests/run_tests.php

# 2. Chạy Migration Database
C:\xampp\php\php.exe artisan migrate

# 3. Khởi động hệ thống
# Chạy file start-dev.bat ở thư mục gốc hoặc chạy riêng lẻ:
# Backend: php artisan serve --port=8000
# Frontend: npm run dev
```
