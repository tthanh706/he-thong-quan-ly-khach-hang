# S5-07 Opportunity Stagnation Frontend

Frontend React + TypeScript cho S5-07: cảnh báo cơ hội đình trệ/quá ngày dự kiến chốt.

## Chức năng
- Đăng nhập bằng session token.
- Dashboard trưởng nhóm kinh doanh.
- Danh sách cơ hội có vấn đề.
- Danh sách toàn bộ cơ hội của nhóm.
- Cảnh báo đình trệ và quá ngày chốt.
- Bộ lọc theo tên, stage, loại cảnh báo.
- Kiểm tra cảnh báo thủ công.
- Cấu hình số ngày không hoạt động theo stage.
- Bật/tắt cấu hình cảnh báo theo stage.
- Ghi nhận hoạt động để cập nhật `last_activity_at` và reset cảnh báo đình trệ.

## Chạy dự án
Backend cần chạy tại `http://127.0.0.1:8000`.

```powershell
cd D:\S5-07-Opportunity-Stagnation\Frontend
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Tài khoản test
- Email: `leader@s507.com`
- Password: `Leader1234`

Vite proxy `/api` sang `http://127.0.0.1:8000`.
