# 🔐 [AUTH-102] Scrum User Story: Forgotten Password Reset via Email

![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-blue)
![Laravel](https://img.shields.io/badge/Laravel-11.x-red)
![Security](https://img.shields.io/badge/Security-Anti--Enumeration-green)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

## 📌 1. Scrum User Story & Requirements

> **Là** một người dùng của hệ thống,  
> **Tôi muốn** đặt lại mật khẩu khi quên thông qua email,  
> **Để** tự lấy lại quyền truy cập tài khoản một cách nhanh chóng và an toàn khi đang đi gặp khách hàng.

### 📝 Core Requirements
1. **Liên kết 30 phút:** Gửi email chứa liên kết đặt lại mật khẩu có thời gian hiệu lực đúng 30 phút (`expires_at = NOW() + 30m`).
2. **Dùng 1 lần duy nhất:** Liên kết bị vô hiệu hóa ngay lập tức sau khi đổi mật khẩu thành công (`used_at = NOW()`).
3. **Chống dò email (Anti-User Enumeration):** Dù email CÓ hay KHÔNG TỒN TẠI trong CSDL, hệ thống đều phản hồi cùng một thông báo trung tính.

---

## 🛠️ 2. Structure & Key Files

```bash
app/
├── app/
│   ├── Http/
│   │   ├── Controllers/Auth/ForgotPasswordController.php # Core Logic (Expiry, Single-use, Anti-enumeration)
│   │   └── Requests/
│   │       ├── SendResetLinkRequest.php
│   │       └── ResetPasswordRequest.php
│   ├── Models/PasswordResetToken.php                     # Eloquent Model for 30-min token
│   └── Notifications/ResetPasswordNotification.php       # Email Notification
├── database/migrations/
│   └── 2026_09_27_000000_create_custom_password_reset_tokens_table.php
├── resources/views/auth/
│   ├── forgot-password.blade.php                        # Blade View Quên mật khẩu
│   └── reset-password.blade.php                         # Blade View Đổi mật khẩu
├── tests/Feature/ForgotPasswordTest.php                  # PHPUnit / Pest Feature Tests
├── index.html                                            # Interactive Web Demo Simulator
└── SCRUM_TICKET.md                                       # Scrum Ticket & Specification
```

---

## 🚀 3. Quick Start (Laravel Setup)

```bash
# 1. Run Migration
php artisan migrate

# 2. Run Tests
php artisan test --filter=ForgotPasswordTest
```

---

## 🎨 4. Interactive Live Prototype

Mở file `index.html` trực tiếp trên trình duyệt để chạy kịch bản giả lập UI, kiểm tra bộ đếm ngược 30 phút và log Database SHA-256 theo thời gian thực!
