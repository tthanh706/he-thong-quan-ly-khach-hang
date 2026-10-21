# Task S4-01: Thu thập lead từ biểu mẫu nhúng trên website

## 1. Thông tin nhánh & User Story
- **Tên nhánh đề xuất:** `feature/S4-01-web-form-lead-capture`
- **Phân hệ (Epic):** `EP-04 - Marketing`
- **Vai trò:** Nhân viên Marketing
- **Nội dung User Story:** *Là Nhân viên Marketing, tôi muốn thu thập lead từ biểu mẫu nhúng trên website, để mọi lead vào thẳng hệ thống thay vì nằm trong hộp thư chung.*

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
1. **Sinh mã nhúng cho một biểu mẫu, dán được vào website bất kỳ:**
   - Hệ thống tự sinh mã `<iframe>` hoặc thẻ `<script>/<form>` HTML kèm mã token định danh 40 ký tự an toàn.
   - Giao diện có nút "Lấy mã nhúng" và modal cho phép copy nhanh 1-click.
2. **Biểu mẫu gồm các trường:**
   - Họ tên (`name`), email (`email`), số điện thoại (`phone`), công ty (`company`), nhu cầu quan tâm (`interest_demand`).
   - Kiểm tra định dạng bắt buộc: họ tên, email chuẩn, số điện thoại.
3. **Có chống spam và giới hạn tần suất theo địa chỉ IP:**
   - **Honeypot:** Bố trí các trường ẩn (`_hp_website`, `fax_number_hp`). Nếu spam bot điền dữ liệu vào các trường này sẽ bị từ chối với mã lỗi `422 Unprocessable Entity`.
   - **Rate Limiting theo IP:** Tự động đếm tần suất gửi của IP qua `RateLimiter::hit()`, chặn với mã lỗi `429 Too Many Requests` nếu vượt quá giới hạn (mặc định 5 lần/phút).
4. **Gửi thành công tạo lead ở trạng thái Mới và gắn đúng nguồn của biểu mẫu:**
   - Lead được tạo trong CSDL với trạng thái `waiting_assignment` (Mới / Chờ phân công).
   - Nguồn lead tự động kế thừa đúng theo nguồn của form (`source`).

## 3. Danh sách các file trong task:
### Backend:
- `app/Enums/LeadStatusEnum.php` (Enum trạng thái Lead)
- `app/Http/Controllers/Api/V1/WebFormController.php` (Controller xử lý API Web Form & Thu thập Lead công khai)
- `app/Models/WebForm.php` (Model Web Form)
- `app/Models/Lead.php` (Model Lead)
- `database/migrations/2026_10_17_000001_create_web_forms_and_add_lead_fields.php` (Migration bảng web_forms và các cột cho leads)
- `routes/api.php` (Định nghĩa route `/api/v1/public/web-forms/...` & `/api/v1/web-forms/...`)

### Frontend:
- `src/types/webForm.ts` (Interface TypeScript cho Web Form và dữ liệu submit)
- `src/services/webFormService.ts` (Service gọi API Backend)
- `src/pages/WebFormPage.tsx` (Giao diện quản lý biểu mẫu, lấy mã nhúng, test gửi lead)
- `src/pages/WebFormPage.css` (Style giao diện Web Form)

## 4. Hướng dẫn các lệnh Git:
```bash
# 1. Chuyển về thư mục gốc
cd c:\Users\Hoang\Desktop\ttcs

# 2. Tạo và checkout nhánh mới
git checkout -b feature/S4-01-web-form-lead-capture

# 3. Add và commit
git add feature-S4-01-web-form-lead-capture
git commit -m "feat(marketing): S4-01 web forms lead capture with honeypot & ip rate limit"

# 4. Push lên Git
git push -u origin feature/S4-01-web-form-lead-capture
```
