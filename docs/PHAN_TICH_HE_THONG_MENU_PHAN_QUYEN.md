# Phân tích hệ thống – Menu điều hướng theo quyền

## 1. User Story
Là người dùng của hệ thống, tôi muốn thấy menu điều hướng đúng theo quyền của mình để không bị rối bởi những chức năng mình không được dùng.

### Acceptance Criteria
1. Mục menu không thuộc quyền không hiển thị.
2. Hiển thị tên người dùng, vai trò và nhóm kinh doanh hiện tại.
3. Giao diện sử dụng thuận tiện trên màn hình từ 360px.
4. Quyền được xác định ở backend; frontend không được tự suy đoán quyền.
5. Nếu người dùng cố truy cập URL không thuộc role, backend trả về HTTP 403.

## 2. Kiến trúc
- Frontend: React + TypeScript + Vite.
- Backend: PHP + Laravel.
- Authentication: Laravel session hiện có của project.
- API: `GET /api/me`.
- Cấu hình menu: `config/menu.php`.
- Phân quyền route: `EnsureRole` middleware.

Luồng chính:

`Đăng nhập → Laravel xác thực → /dashboard → React gọi /api/me → Laravel lọc menu theo role → React render menu → Middleware bảo vệ route`

## 3. Actor
### User
- Đăng nhập.
- Xem thông tin cá nhân.
- Xem các menu được cấp quyền.
- Truy cập các chức năng được cấp quyền.
- Đăng xuất.

### Admin
- Có toàn bộ menu mẫu trong demo.
- Có thêm menu Quản lý người dùng.

### Manager
- Có Tổng quan, Khách hàng, Cơ hội bán hàng, Báo cáo.
- Không có Quản lý người dùng.

### Sales
- Có Tổng quan, Khách hàng, Cơ hội bán hàng.
- Không có Báo cáo và Quản lý người dùng.

## 4. Mô hình dữ liệu

### users
Các trường liên quan:
- `id`
- `name`
- `email`
- `password`
- `role`
- `business_group`
- `is_active`
- `failed_login_attempts`
- `locked_until`

`business_group` được bổ sung bằng migration:
`2026_09_28_000001_add_business_group_to_users_table.php`.

## 5. Quy tắc phân quyền menu

| Menu | admin | manager | sales |
|---|---:|---:|---:|
| Tổng quan | ✓ | ✓ | ✓ |
| Khách hàng | ✓ | ✓ | ✓ |
| Cơ hội bán hàng | ✓ | ✓ | ✓ |
| Báo cáo | ✓ | ✓ | - |
| Quản lý người dùng | ✓ | - | - |

Danh sách này nằm ở backend trong `config/menu.php`.

## 6. API

### GET `/api/me`
Yêu cầu: đã đăng nhập.

Response mẫu:

```json
{
  "user": {
    "id": 2,
    "name": "Sales",
    "email": "sales@company.com",
    "role": "sales",
    "role_label": "Nhân viên kinh doanh",
    "business_group": "Kinh doanh miền Bắc"
  },
  "menus": [
    {
      "key": "dashboard",
      "label": "Tổng quan",
      "icon": "⌂",
      "href": "/dashboard",
      "roles": ["admin", "sales", "manager"]
    }
  ]
}
```

Frontend chỉ hiển thị `menus` được backend trả về.

## 7. Responsive 360px
Ở kích thước ≤ 760px:
- Sidebar chuyển thành drawer.
- Có nút hamburger.
- Có backdrop khi menu mở.
- Nội dung chuyển về 1 cột.
- Card thông tin xếp dọc.
- Menu chức năng xếp 1 cột.

Ở kích thước ≤ 380px:
- Giảm padding hai bên.
- Giảm kích thước heading.
- Các item menu vẫn đủ vùng chạm.

## 8. Bảo mật
Ẩn menu chỉ là lớp UX. Backend vẫn kiểm tra role bằng middleware:

`EnsureRole`

Ví dụ:
- `/reports` → `admin, manager`
- `/admin/users` → `admin`
- `/customers` → `admin, sales, manager`

Vì vậy người dùng không thể bỏ qua giao diện bằng cách nhập URL trực tiếp.

## 9. Cấu trúc file chính

```text
app/
  Http/Controllers/MenuController.php
  Http/Middleware/EnsureRole.php
  Models/User.php

config/
  menu.php

database/migrations/
  2026_09_28_000001_add_business_group_to_users_table.php

resources/
  js/app.tsx
  css/app.css
  views/dashboard.blade.php

routes/
  web.php

docs/
  PHAN_TICH_HE_THONG_MENU_PHAN_QUYEN.md

package.json
tsconfig.json
vite.config.js
```

## 10. Tài khoản demo

Sau khi chạy migration và seeder:

- Admin: `admin@company.com` / `Admin@123456`
- Sales: `sales@company.com` / `Sales@123456`

Tài khoản Admin thuộc nhóm `Ban điều hành`.
Tài khoản Sales thuộc nhóm `Kinh doanh miền Bắc`.

## 11. Chạy project

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
npm install
npm run dev
```

Trong terminal khác:

```bash
php artisan serve
```

Sau đó mở `/login`.

> Lưu ý: trong môi trường hiện tại, `npm install` không hoàn tất trong thời gian kiểm tra nên chưa xác nhận được `vite build`; phần PHP đã được kiểm tra cú pháp với `php -l` và không phát hiện lỗi.
