# HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN CRM TRÊN MÁY KHÁC

Tài liệu này hướng dẫn chi tiết từng bước để clone hoặc sao chép thư mục `develop` sang một máy tính khác và khởi chạy toàn bộ hệ thống (Backend Laravel + Frontend React Vite + MySQL) thành công 100%.

---

## 🛠️ 1. Yêu cầu môi trường cài đặt sẵn (Prerequisites)

Trước khi chạy, máy tính cần cài đặt các công cụ sau:

1. **PHP >= 8.2**:
   - Nếu dùng **XAMPP**: Khởi động Apache và MySQL từ XAMPP Control Panel.
   - Kiểm tra các extension sau đã được bật trong `php.ini` (bỏ dấu `;` ở đầu dòng):
     ```ini
     extension=pdo_mysql
     extension=mbstring
     extension=openssl
     extension=curl
     extension=fileinfo
     extension=gd
     extension=zip
     ```
2. **Composer** (Công cụ quản lý thư viện PHP): Kiểm tra bằng `composer --version`.
3. **Node.js >= 18.x** & **npm**: Kiểm tra bằng `node -v` và `npm -v`.
4. **MySQL Database**: Đang chạy trên cổng mặc định `3306`.
5. **Git**: Kiểm tra bằng `git --version`.

---

## ⚙️ 2. Thiết lập Backend (Laravel API - Port 8000)

### Bước 2.1: Mở Terminal tại thư mục Backend
```bash
cd develop/backend
```

### Bước 2.2: Tạo file cấu hình môi trường `.env`
Sao chép từ file mẫu:
```bash
# Trên Windows PowerShell / CMD:
copy .env.example .env

# Trên macOS / Linux:
cp .env.example .env
```

Mở file `.env` và kiểm tra cấu hình kết nối Database (sửa lại mật khẩu MySQL nếu máy bạn có đặt mật khẩu):
```env
APP_NAME=CRM
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_system
DB_USERNAME=root
DB_PASSWORD=
```

### Bước 2.3: Tạo cơ sở dữ liệu `crm_system` trong MySQL
Mở MySQL (hoặc qua phpMyAdmin tại `http://localhost/phpmyadmin`) và chạy lệnh SQL:
```sql
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2.4: Cài đặt thư viện PHP và sinh APP_KEY
```bash
composer install
php artisan key:generate
```

### Bước 2.5: Chạy Database Migration và nạp dữ liệu mẫu (Seed Data)
Lệnh này sẽ tự động tạo toàn bộ bảng (khách hàng, sản phẩm, phân quyền, trường tùy chỉnh, nhật ký...) và tạo sẵn các tài khoản đăng nhập:
```bash
php artisan migrate --seed
```

### Bước 2.6: Tạo Symbolic Link cho thư mục ảnh Avatar
Lệnh này bắt buộc để hệ thống có thể hiển thị ảnh đại diện người dùng tải lên:
```bash
php artisan storage:link
```

### Bước 2.7: Khởi động Backend Server
```bash
php artisan serve --host=127.0.0.1 --port=8000
```
Backend API sẽ hoạt động tại: **`http://127.0.0.1:8000`**

---

## 💻 3. Thiết lập Frontend (React + Vite - Port 5173)

Mở một cửa sổ Terminal mới:

### Bước 3.1: Di chuyển vào thư mục Frontend
```bash
cd develop/frontend
```

### Bước 3.2: Tạo file cấu hình môi trường `.env`
Đảm bảo file `.env` có nội dung trỏ về Backend API:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### Bước 3.3: Cài đặt thư viện Javascript
```bash
npm install
```

### Bước 3.4: Khởi động Frontend Dev Server
```bash
npm run dev
```
Giao diện ứng dụng sẽ chạy tại: **`http://localhost:5173`**

---

## ⚡ 4. Cách chạy 1-Click tự động trên Windows (Khuyên dùng)

Ở thư mục gốc `ttcs`, đã có sẵn file kịch bản **`start-dev.bat`**:

1. Đảm bảo MySQL của XAMPP đang mở.
2. Nhấp đúp chuột vào file **`start-dev.bat`**.
3. File kịch bản sẽ tự động khởi động đồng thời cả Backend (Port 8000) và Frontend (Port 5173).
4. Mở trình duyệt vào **`http://localhost:5173`**.

---

## 🔑 5. Danh sách tài khoản đăng nhập có sẵn

Hệ thống đã có sẵn các tài khoản mặc định được sinh ra sau khi chạy seeder:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@company.com` | `Admin1234` | Toàn quyền cấu hình hệ thống, quản lý tài khoản, nhập Excel, xem nhật ký, cấu hình trường tùy chỉnh |
| **Nhân viên (Staff A)** | `a@company.com` | `Staff1234` | Quản lý dữ liệu khách hàng & cơ hội được phân công |
| **Nhân viên (Staff B)** | `b@company.com` | `Staff1234` | Quản lý dữ liệu khách hàng & cơ hội được phân công |

---

## ❓ 6. Xử lý các sự cố thường gặp (Troubleshooting)

1. **Lỗi `Access denied for user 'root'@'localhost'`:**
   - Kiểm tra file `develop/backend/.env`, chỉnh sửa `DB_PASSWORD` cho đúng với mật khẩu tài khoản MySQL trên máy đó.
2. **Lỗi `Call to undefined function imagecreatefrompng()` khi tải Avatar:**
   - Mở file `php.ini`, tìm dòng `;extension=gd`, xóa dấu `;` ở đầu dòng và khởi động lại Apache/PHP.
3. **Lỗi `Class 'ZipArchive' not found` khi xuất Excel:**
   - Mở file `php.ini`, tìm dòng `;extension=zip`, xóa dấu `;` ở đầu dòng và khởi động lại PHP.
4. **Trang báo `Phiên đăng nhập đã hết hạn (401)`:**
   - Mở Console (F12) ➔ Application ➔ Clear Local Storage rồi đăng nhập lại bằng tài khoản `admin@company.com`.
