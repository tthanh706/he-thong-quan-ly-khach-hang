# Task S6-01: Xem lịch sử thay đổi của một cơ hội bán hàng

## 1. Thông tin nhánh & User Story
- **Tên nhánh đề xuất:** `feature/S6-01-opportunity-change-history`
- **Phân hệ (Epic):** `EP-05 - Quản lý Bán hàng & Giám sát`
- **Vai trò:** Trưởng nhóm kinh doanh
- **Nội dung User Story:** *Là Trưởng nhóm kinh doanh, tôi muốn xem lịch sử thay đổi của một cơ hội, để biết vì sao giá trị hay ngày chốt bị đổi mà không phải hỏi lại.*

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
1. **Ghi lại mọi thay đổi nhạy cảm của cơ hội:**
   - Tự động ghi nhật ký (Audit Log) khi có sự biến động của 4 trường cốt lõi:
     + Giai đoạn (`stage`)
     + Giá trị dự kiến (`value`)
     + Ngày dự kiến chốt (`expected_close_date`)
     + Người sở hữu / phụ trách (`owner_user_id`)
     + *(Kèm xác suất thắng `win_probability` và khởi tạo ban đầu).*
2. **Mỗi dòng lịch sử có đầy đủ:**
   - Giá trị trước (`old_value` / `old_label`)
   - Giá trị sau (`new_value` / `new_label`)
   - Người thực hiện (`changed_by_user_id` liên kết bảng `users`)
   - Thời điểm thực hiện (`created_at`)
   - Lý do thay đổi (`reason` do nhân viên nhập vào form chỉnh sửa)
3. **Giao diện dòng thời gian (Timeline UI):**
   - Nút "Lịch sử" trên từng dòng cơ hội mở modal timeline xem chi tiết so sánh trước/sau rõ ràng.

## 3. Danh sách các file trong task:
### Backend:
- `app/Http/Controllers/Api/V1/SalesOpportunityController.php` (Phương thức `update` đối soát ghi log và `histories` trả về danh sách lịch sử)
- `app/Models/OpportunityHistory.php` (Model Lịch sử biến động cơ hội)
- `app/Models/Opportunity.php` (Model Cơ hội bán hàng - có quan hệ `hasMany` với `OpportunityHistory`)
- `database/migrations/2026_10_17_000003_create_opportunity_histories_table.php` (Migration bảng `opportunity_histories`)
- `routes/api.php` (Định nghĩa route `/api/v1/sales-opportunities/{id}/histories` & update)

### Frontend:
- `src/types/salesOpportunity.ts` (Interface TypeScript cho `OpportunityHistoryItem`, `OpportunityHistoryResponse`)
- `src/services/salesOpportunityService.ts` (Service gọi API lấy lịch sử thay đổi `getHistories`)
- `src/pages/OpportunityManagementPage.tsx` (Modal Timeline Lịch sử thay đổi & form ghi lý do điều chỉnh)
- `src/pages/OpportunityManagementPage.css` (Style timeline và diff badges)

## 4. Hướng dẫn các lệnh Git:
```bash
# 1. Chuyển về thư mục gốc
cd c:\Users\Hoang\Desktop\ttcs

# 2. Tạo và checkout nhánh mới
git checkout -b feature/S6-01-opportunity-change-history

# 3. Add và commit
git add feature-S6-01-opportunity-change-history
git commit -m "feat(sales): S6-01 opportunity change history and audit timeline"

# 4. Push lên Git
git push -u origin feature/S6-01-opportunity-change-history
```
