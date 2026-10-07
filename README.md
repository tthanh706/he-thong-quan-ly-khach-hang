# Task S2-03: Tải lên ảnh đại diện (Avatar)

## 1. Thông tin nhánh
- **Tên nhánh đề xuất:** `feature/S2-03-user-avatar-upload`
- **Mô tả chức năng:** Cho phép người dùng tải lên ảnh đại diện cá nhân (hỗ trợ JPG, PNG, WEBP), nén/lưu trữ ảnh an toàn trong storage, hiển thị avatar trên toàn hệ thống và xóa avatar trở về chữ cái đầu tiên mặc định.

## 2. Danh sách các file trong task:
### Backend:
- `app/Http/Controllers/Api/V1/AvatarController.php` (Controller xử lý API upload và xóa ảnh avatar)
- `app/Http/Requests/Profile/UploadAvatarRequest.php` (Validate file ảnh, dung lượng tối đa, định dạng)
- `app/Services/AvatarService.php` (Service lưu trữ file vào disk public, xóa file cũ)
- `tests/Feature/AvatarUploadTest.php` (Kiểm thử tải lên và xóa avatar)
- `routes/api.php` (Định nghĩa route `POST /profile/avatar` & `DELETE /profile/avatar`)
- *Lưu ý:* Cần chạy `php artisan storage:link` để tạo liên kết tượng trưng public sang storage.

### Frontend:
- `src/pages/ProfilePage.tsx` (Phần component upload ảnh avatar, preview ảnh và nút xóa)
- `src/pages/ProfilePage.css` (Style hiển thị avatar)
- `src/services/profileService.ts` (API Client uploadAvatar và deleteAvatar)
- `src/types/index.ts` (Khai báo kiểu dữ liệu TypeScript)

## 3. Các bước để push nhánh lên Git:
Mở terminal trong thư mục repository chính của bạn và chạy các lệnh:

```bash
# 1. Tạo và chuyển sang nhánh mới
git checkout -b feature/S2-03-user-avatar-upload

# 2. Copy các file của task này vào đúng thư mục tương ứng trong dự án

# 3. Thêm file và commit
git add .
git commit -m "feat(avatar): S2-03 upload and delete user avatar"

# 4. Push nhánh lên Git
git push -u origin feature/S2-03-user-avatar-upload
```
