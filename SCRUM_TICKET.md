# 🎫 SCRUM TICKET: [AUTH-102] Đặt lại mật khẩu qua Email (Forgot Password Flow)

## 📌 1. Thông Tin Tổng Quan (Overview)
- **Ticket ID:** `AUTH-102`
- **Feature Area:** Authentication / Security
- **Epic:** [AUTH-00] System Access & User Authentication
- **Priority:** High (P1)
- **Story Points:** 5 SP
- **Target Audience:** Tất cả người dùng đã có tài khoản trên hệ thống.

---

## 🎯 2. User Story (Câu Chuyện Người Dùng)

> **Là** một người dùng của hệ thống,  
> **Tôi muốn** đặt lại mật khẩu khi quên thông qua email,  
> **Để** tự lấy lại quyền truy cập tài khoản một cách nhanh chóng và an toàn (ví dụ: khi đang đi gặp khách hàng).

---

## 📝 3. Mô Tả Chi Tiết (Detailed Requirements)
1. Người dùng nhập email tại trang **"Quên mật khẩu"**.
2. Hệ thống tạo và gửi một **Liên kết đặt lại mật khẩu (Password Reset Link)** tới email đã nhập:
   - Liên kết chứa token bảo mật ngẫu nhiên (Cryptographically secure random token).
   - **Thời gian hiệu lực:** Đúng **30 phút** kể từ thời điểm khởi tạo.
3. **Tính dùng một lần (Single-use):** Liên kết/Token chỉ có hiệu lực cho **1 lần đổi mật khẩu thành công**. Sau khi đổi xong hoặc hết 30 phút, liên kết lập tức bị vô hiệu hóa.
4. **Bảo mật chống dò email (Anti-User Enumeration):**
   - Dù email **CÓ TỒN TẠI** hay **KHÔNG TỒN TẠI** trong cơ sở dữ liệu, giao diện người dùng **LUÔN HIỂN THỊ CÙNG MỘT THÔNG BÁO THÀNH CÔNG DẠNG TRUNG TÍNH**.
   - Thông báo mẫu: *"Nếu địa chỉ email của bạn tồn tại trên hệ thống, chúng tôi đã gửi một liên kết hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam)."*

---

## ✅ 4. TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA - AC)

### 🔹 AC 1: Yêu cầu gửi email khôi phục (Request Reset Link)
- **Given** người dùng đang ở trang "Quên mật khẩu"
- **When** người dùng nhập địa chỉ email hợp lệ (đúng định dạng `name@domain.com`) và nhấn "Gửi liên kết đặt lại"
- **Then**:
  - Hệ thống kiểm tra email trong CSDL.
  - Giao diện hiển thị thông báo trung tính: *"Nếu địa chỉ email của bạn tồn tại trên hệ thống, chúng tôi đã gửi một liên kết hướng dẫn đặt lại mật khẩu."*
  - Nếu email tồn tại: Hệ thống lưu Token vào CSDL (đã mã hóa SHA-256) với `expires_at = now() + 30 mins` và gửi email chứa URL dạng: `https://app.example.com/reset-password?token={raw_token}`.
  - Nếu email KHÔNG tồn tại: Hệ thống KHÔNG gửi email, không báo lỗi "Email không tồn tại" ra giao diện (chống dò email).

### 🔹 AC 2: Thời hạn hiệu lực của Token (30-Minute Expiry)
- **Given** người dùng nhận được email có chứa liên kết đặt lại mật khẩu
- **When** người dùng nhấp vào liên kết **SAU 30 PHÚT** kể từ khi yêu cầu được tạo
- **Then**:
  - Giao diện hiển thị trang thông báo lỗi: *"Liên kết đã hết hạn (chỉ có hiệu lực trong 30 phút). Vui lòng gửi lại yêu cầu mới."*
  - Hệ thống không cho phép nhập mật khẩu mới với token đã hết hạn này.

### 🔹 AC 3: Tính dùng một lần của Token (Single-Use Token)
- **Given** người dùng đã đổi mật khẩu thành công bằng liên kết nhận được
- **When** người dùng (hoặc ai đó) truy cập lại liên kết đó lần thứ hai
- **Then**:
  - Hệ thống từ chối token và hiển thị lỗi: *"Liên kết đặt lại mật khẩu này đã được sử dụng hoặc không còn hợp lệ."*
  - Bắt buộc người dùng gửi yêu cầu mới nếu muốn đổi lại.

### 🔹 AC 4: Cập nhật mật khẩu mới (Reset Password Form)
- **Given** người dùng truy cập liên kết hợp lệ (trong vòng 30 phút, chưa sử dụng)
- **When** người dùng nhập mật khẩu mới thỏa mãn chính sách bảo mật (Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt) và xác nhận mật khẩu
- **Then**:
  - Mật khẩu được cập nhật thành công (băm bằng bcrypt/Argon2 trong CSDL).
  - Token được đánh dấu là `used_at = NOW()` (hoặc xóa khỏi bảng token active).
  - Vô hiệu hóa tất cả các phiên đăng nhập (sessions/refresh tokens) cũ của tài khoản đó (bảo mật khi bị mất máy/lộ pass).
  - Hiển thị thông báo thành công và chuyển hướng về trang Đăng nhập.
  - Gửi 1 email thông báo: *"Mật khẩu tài khoản của bạn vừa được thay đổi thành công."*

### 🔹 AC 5: Chống Spam & Giới Hạn Tần Suất (Rate Limiting)
- **Given** người dùng gửi liên tiếp nhiều yêu cầu đặt lại mật khẩu cho cùng 1 email hoặc từ cùng 1 IP
- **When** số lần gửi vượt quá 3 lần / 10 phút
- **Then** hệ thống phản hồi lỗi `HTTP 429 Too Many Requests`: *"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."*
