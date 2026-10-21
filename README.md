# Task S5-01: Tạo và quản lý cơ hội bán hàng

## 1. Thông tin nhánh & User Story
- **Tên nhánh đề xuất:** `feature/S5-01-sales-opportunity-management`
- **Phân hệ (Epic):** `EP-05 - Quản lý Bán hàng`
- **Vai trò:** Nhân viên kinh doanh
- **Nội dung User Story:** *Là Nhân viên kinh doanh, tôi muốn tạo và quản lý một cơ hội bán hàng, để thương vụ nằm trong hệ thống thay vì trong trí nhớ của tôi.*

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
1. **Khai báo thông tin cơ hội:**
   - Tên cơ hội (`name`), khách hàng (`customer_id`), người liên hệ chính (`contact_id`), giai đoạn (`stage`), giá trị dự kiến (`value`), ngày dự kiến chốt (`expected_close_date`), nguồn (`source`).
2. **Xác suất thắng lấy mặc định theo giai đoạn, sửa tay được kèm ghi chú:**
   - Bảng tỷ lệ mặc định theo giai đoạn:
     + *Khảo sát / Tìm hiểu (`khao_sat`):* 10%
     + *Đánh giá nhu cầu (`danh_gia`):* 25%
     + *Đề xuất giải pháp (`de_xuat`):* 50%
     + *Thương thảo / Báo giá (`thuong_thao`):* 75%
     + *Thành công / Won (`won`):* 100%
     + *Thất bại / Lost (`lost`):* 0%
   - Cho phép sửa tay xác suất thắng (`win_probability`) kèm ô nhập ghi chú lý do (`probability_note`), hệ thống lưu cờ `win_probability_customized = true`.
3. **Một khách hàng có thể có nhiều cơ hội song song:**
   - Bảng `opportunities` liên kết khóa ngoại với `customers` quan hệ 1 - Nhiều (không đặt ràng buộc Unique).
   - Bộ lọc cho phép lọc danh sách theo khách hàng để xem toàn bộ cơ hội đang chạy đồng thời.
4. **Ngày dự kiến chốt không được ở quá khứ khi tạo mới:**
   - Backend validate với rule: `after_or_equal:today`.
   - Frontend thiết lập `min={today}` ngăn chặn chọn ngày trong quá khứ.

## 3. Danh sách các file trong task:
### Backend:
- `app/Http/Controllers/Api/V1/SalesOpportunityController.php` (Controller xử lý API Cơ hội bán hàng)
- `app/Models/Opportunity.php` (Model Cơ hội bán hàng)
- `database/migrations/2026_10_17_000002_enhance_opportunities_table_for_s5_s6.php` (Migration bổ sung các cột cho cơ hội: xác suất, nguồn, liên hệ)
- `routes/api.php` (Định nghĩa route `/api/v1/sales-opportunities/...`)

### Frontend:
- `src/types/salesOpportunity.ts` (Interface TypeScript cho Opportunity & Stage)
- `src/services/salesOpportunityService.ts` (Service gọi API Backend Cơ hội)
- `src/pages/OpportunityManagementPage.tsx` (Giao diện Quản lý cơ hội, tạo mới, lọc dữ liệu)
- `src/pages/OpportunityManagementPage.css` (Style giao diện Quản lý cơ hội)

## 4. Hướng dẫn các lệnh Git:
```bash
# 1. Chuyển về thư mục gốc
cd c:\Users\Hoang\Desktop\ttcs

# 2. Tạo và checkout nhánh mới
git checkout -b feature/S5-01-sales-opportunity-management

# 3. Add và commit
git add feature-S5-01-sales-opportunity-management
git commit -m "feat(sales): S5-01 sales opportunity management and stage probabilities"

# 4. Push lên Git
git push -u origin feature/S5-01-sales-opportunity-management
```
