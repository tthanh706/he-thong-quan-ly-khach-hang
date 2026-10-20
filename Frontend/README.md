# S6-07 Team Calendar Frontend

Frontend React + TypeScript cho user story S6-07.

## Chức năng
- Đăng nhập bằng session_token.
- Xem lịch cá nhân và lịch nhóm.
- Chế độ Ngày / Tuần / Tháng.
- Meeting và task hiển thị chung.
- Lọc theo nhân viên.
- Tạo cuộc gặp và hiển thị lỗi xung đột lịch từ backend.
- Tạo công việc có deadline.
- Responsive cho điện thoại.

## Chạy dự án
Backend:
```powershell
cd D:\S6-07-Team-Calendar\Backend
php artisan serve
```

Frontend:
```powershell
cd D:\S6-07-Team-Calendar\Frontend
npm install
npm run dev
```

Mở http://localhost:5173

Tài khoản test:
- Trưởng nhóm: leader@s607.com / Leader1234
- Nhân viên A: staff1@s607.com / Staff1234
- Nhân viên B: staff2@s607.com / Staff1234

Vite proxy `/api` sang `http://127.0.0.1:8000`.
