# Task S2-01: Nhập danh sách người dùng hàng loạt từ file Excel

## 1. Thông tin nhánh
- **Tên nhánh đề xuất:** `feature/S2-01-bulk-import-users-excel` (hoặc `feature/bulk-import-users-excel`)
- **Mô tả chức năng:** Cho phép quản trị viên nhập danh sách tài khoản người dùng hàng loạt từ file Excel (.xlsx, .xls, .csv), tự động validate dữ liệu từng dòng, tạo tài khoản và gửi email thông báo mật khẩu cho người dùng mới.

## 2. Danh sách các file trong task:
### Backend (Laravel):
- `backend/app/Http/Controllers/Api/V1/UserImportController.php` (Controller tiếp nhận file upload và trả về kết quả import)
- `backend/app/Http/Requests/User/ImportUsersRequest.php` (Validate định dạng file tải lên: mime type, dung lượng tối đa)
- `backend/app/Http/Resources/UserImportResultResource.php` (Resource định dạng kết quả import thành công / danh sách dòng lỗi)
- `backend/app/Mail/ImportedUserWelcomeMail.php` (Mailable gửi thư chào mừng và thông tin đăng nhập cho user mới)
- `backend/app/Services/UserImportService.php` (Logic xử lý import người dùng theo lô, bắt lỗi và gửi email)
- `backend/app/Services/SpreadsheetReaderService.php` (Dịch vụ đọc dữ liệu bảng tính Excel/CSV)
- `backend/resources/views/emails/imported-user-welcome.blade.php` (Template HTML email chào mừng)
- `backend/routes/api.php` (Khai báo route `POST /users/import`)
- `backend/tests/Feature/UserImportTest.php` (Unit/Feature test kiểm thử chức năng import)

### Frontend (React + TypeScript):
- `frontend/src/pages/UserImportPage.tsx` (Giao diện kéo thả/chọn file Excel, tải file mẫu, xem tiến độ và bảng danh sách lỗi)
- `frontend/src/pages/UserImportPage.css` (Giao diện styling cho màn hình Import Excel)
- `frontend/src/services/userImportService.ts` (API Client gửi request upload file lên backend)
- `frontend/src/types/index.ts` (Kiểu dữ liệu TypeScript cho ImportResult, ImportError, v.v.)

## 3. Các bước để push nhánh lên Git:
Mở terminal trong thư mục repository chính của bạn và chạy:

```bash
# 1. Chuyển sang nhánh tính năng (hoặc tạo nhánh mới)
git checkout -b feature/S2-01-bulk-import-users-excel
# (hoặc: git checkout feature/bulk-import-users-excel)

# 2. Copy/đồng bộ các file của tính năng này vào dự án

# 3. Thêm các file và tạo commit
git add .
git commit -m "feat(user): S2-01 bulk import users from excel"

# 4. Push nhánh lên Git
git push -u origin feature/S2-01-bulk-import-users-excel
```
