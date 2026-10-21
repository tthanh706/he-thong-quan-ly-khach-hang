# S4-07 Lead SLA Frontend

Frontend React + TypeScript cho nghiệp vụ S4-07:
- Đăng nhập bằng session token.
- Xem/lọc/tìm kiếm lead.
- Nhân viên nhận lead được phân công.
- Từ chối lead và bắt buộc nhập lý do.
- Ghi nhận đã liên hệ khách hàng.
- Xem lịch sử xử lý lead.
- Theo dõi trạng thái SLA và cảnh báo quá hạn cho trưởng nhóm.

## Chạy dự án

Backend Laravel cần chạy tại `http://127.0.0.1:8000`.

```powershell
cd D:\S4-07-Lead-SLA\Backend
php artisan serve
```

Mở PowerShell thứ hai:

```powershell
cd D:\S4-07-Lead-SLA\Frontend
npm install
npm run dev
```

Vite chạy ở `http://localhost:5173` và proxy `/api` sang Laravel `127.0.0.1:8000` nên không cần sửa CORS cho môi trường local.

## Tài khoản test hiện tại

Nhân viên:
- Email: `staff@s407.com`
- Password: `Staff1234`

Trưởng nhóm:
- Email: `leader@s407.com`
- Password: `Leader1234`

## Lưu ý

Frontend dùng `localStorage` key `session_token`, khớp custom session auth của Backend.
