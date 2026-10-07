# Task S2-02: Xem & cập nhật Hồ sơ cá nhân (Profile + Chữ ký Email)

## 1. Thông tin nhánh
- **Tên nhánh đề xuất:** `feature/S2-02-user-profile-email-signature`
- **Mô tả chức năng:** Cho phép người dùng xem thông tin cá nhân, chỉnh sửa số điện thoại, chức danh, nhóm kinh doanh và cấu hình chữ ký email cá nhân phục vụ gửi thư cho khách hàng.

## 2. Danh sách các file trong task:
### Backend:
- `app/Http/Controllers/Api/V1/ProfileController.php` (Controller xử lý API xem và cập nhật hồ sơ)
- `app/Http/Requests/Profile/UpdateProfileRequest.php` (Validate dữ liệu cập nhật hồ sơ)
- `app/Http/Resources/UserProfileResource.php` (Resource định dạng dữ liệu hồ sơ cá nhân)
- `app/Models/User.php` (Khai báo các thuộc tính phone, job_title, email_signature, business_group)
- `app/Services/ProfileService.php` (Business logic cho hồ sơ cá nhân)
- `database/migrations/2026_10_05_000001_add_profile_fields_to_users_table.php` (Migration thêm cột vào bảng users)
- `routes/api.php` (Định nghĩa route `GET /profile` & `PATCH /profile`)

### Frontend:
- `src/pages/ProfilePage.tsx` (Giao diện xem và chỉnh sửa thông tin hồ sơ)
- `src/pages/ProfilePage.css` (Style cho trang hồ sơ cá nhân)
- `src/services/profileService.ts` (API Client gọi backend)
- `src/types/index.ts` (Khai báo kiểu dữ liệu TypeScript)

## 3. Các bước để push nhánh lên Git:
Mở terminal trong thư mục repository chính của bạn và chạy các lệnh:

```bash
# 1. Tạo và chuyển sang nhánh mới
git checkout -b feature/S2-02-user-profile-email-signature

# 2. Copy các file của task này vào đúng thư mục tương ứng trong dự án

# 3. Thêm file và commit
git add .
git commit -m "feat(profile): S2-02 view and update user profile and email signature"

# 4. Push nhánh lên Git
git push -u origin feature/S2-02-user-profile-email-signature
```
