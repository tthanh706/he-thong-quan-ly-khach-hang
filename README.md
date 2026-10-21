# S5-04: Pipeline Stage Conditions (Ràng buộc điều kiện chuyển giai đoạn)

## Tổng quan
Feature cho phép **Giám đốc kinh doanh** cấu hình các điều kiện bắt buộc khi chuyển giai đoạn trong Pipeline cơ hội (Opportunity). Hỗ trợ chặn chuyển giai đoạn khi chưa đủ điều kiện và cho phép Override bởi cấp quản lý.

---

## Cấu trúc thư mục

```
S5-04_Pipeline_Stage_Conditions/
├── backend/
│   ├── app/
│   │   ├── Exceptions/
│   │   │   └── StageTransitionBlockedException.php
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   └── PipelineStageConditionController.php
│   │   │   ├── Requests/
│   │   │   │   ├── TransitionStageRequest.php
│   │   │   │   └── StoreStageConditionRequest.php
│   │   │   └── Resources/
│   │   │       ├── PipelineStageResource.php
│   │   │       └── StageConditionResource.php
│   │   ├── Models/
│   │   │   ├── PipelineStage.php
│   │   │   ├── StageTransitionCondition.php
│   │   │   └── StageTransitionOverride.php
│   │   ├── Policies/
│   │   │   └── StageTransitionPolicy.php
│   │   └── Services/
│   │       └── StageTransitionService.php
│   ├── database/migrations/
│   │   ├── 2026_10_21_100001_create_pipeline_stages_table.php
│   │   ├── 2026_10_21_100002_create_stage_transition_conditions_table.php
│   │   └── 2026_10_21_100003_create_stage_transition_overrides_table.php
│   ├── routes/
│   │   └── pipeline_stage_conditions.php
│   └── tests/
│       ├── Unit/Services/
│       │   └── StageTransitionServiceTest.php
│       └── Feature/Api/
│           └── PipelineStageConditionApiTest.php
├── frontend/
│   └── src/
│       ├── types/
│       │   └── pipeline.types.ts
│       ├── services/
│       │   └── pipelineApi.ts
│       └── components/
│           ├── PipelineStageManager.tsx
│           ├── StageTransitionModal.tsx
│           └── ConditionConfigPanel.tsx
└── README.md
```

---

## API Specifications

### Condition Management

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|--------|-------|
| `GET` | `/api/pipelines/{id}/stages` | Danh sách stages + conditions | All |
| `POST` | `/api/stages/{id}/conditions` | Thêm điều kiện | Manager+ |
| `PUT` | `/api/conditions/{id}` | Cập nhật điều kiện | Manager+ |
| `DELETE` | `/api/conditions/{id}` | Xoá điều kiện | Manager+ |

### Stage Transitions

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/opportunities/{id}/validate-transition` | Kiểm tra điều kiện (dry-run) |
| `POST` | `/api/opportunities/{id}/transition` | Thực hiện chuyển giai đoạn |

### POST `/api/opportunities/{id}/validate-transition`

**Body:**
```json
{ "target_stage_id": 3 }
```

**Response (200):**
```json
{
  "data": {
    "can_transition": false,
    "failed_conditions": [
      {
        "condition_id": 1,
        "condition_type": "has_activity",
        "error_message": "Cần ít nhất 1 cuộc gặp (meeting).",
        "parameters": { "activity_type": "meeting", "min_count": 1 }
      }
    ],
    "passed_conditions": [],
    "user_can_override": true
  }
}
```

### POST `/api/opportunities/{id}/transition`

**Body (normal):**
```json
{ "target_stage_id": 3 }
```

**Body (override):**
```json
{
  "target_stage_id": 3,
  "is_override": true,
  "override_reason": "Đã xác nhận qua kênh khác."
}
```

**Response (200 - success):**
```json
{
  "message": "Chuyển giai đoạn thành công.",
  "data": {
    "opportunity_id": 5,
    "new_stage": { "id": 3, "name": "Báo giá", "..." : "..." },
    "overridden": false
  }
}
```

**Response (422 - blocked):**
```json
{
  "message": "Chuyển giai đoạn bị chặn: Chưa thỏa mãn điều kiện bắt buộc.",
  "blocked": true,
  "failed_conditions": [...]
}
```

**Response (403 - unauthorized override):**
```json
{
  "message": "Bạn không có quyền ghi đè điều kiện. Yêu cầu cấp Trưởng nhóm trở lên."
}
```

---

## Loại điều kiện hỗ trợ (Condition Types)

| Type | Mô tả | Parameters |
|------|--------|------------|
| `has_activity` | Cần ≥ N hoạt động | `{ activity_type, min_count }` |
| `required_field` | Trường bắt buộc có giá trị | `{ field_name }` |
| `min_value` | Giá trị thương vụ ≥ threshold | `{ min_value }` |
| `has_attachment` | Cần ≥ N tệp đính kèm | `{ min_count }` |
| `has_contact` | Cần ≥ 1 liên hệ | `{ min_count }` |

---

## Logic Override

1. Chỉ user có role `team_lead`, `manager`, hoặc `admin` mới được Override.
2. **Bắt buộc** nhập `override_reason` — không để trống.
3. Mọi override đều ghi vào `stage_transition_overrides` (Audit Log) bao gồm:
   - Ai thực hiện override
   - Từ giai đoạn nào → giai đoạn nào
   - Lý do override
   - Các điều kiện đã bị bỏ qua (skipped_conditions)
   - Timestamp

---

## Hướng dẫn tích hợp

### Backend
```bash
php artisan migrate
```

Trong `routes/api.php`:
```php
require __DIR__ . '/pipeline_stage_conditions.php';
```

Đăng ký Policy trong `AuthServiceProvider`:
```php
use App\Policies\StageTransitionPolicy;
// Register in boot() or policies array
```

### Frontend
```tsx
import PipelineStageManager from './components/PipelineStageManager';

<PipelineStageManager
  pipelineId={1}
  opportunityId={5}
  currentStageId={2}
  userRole="manager"
/>
```

### Chạy Tests
```bash
php artisan test --filter=StageTransitionServiceTest
php artisan test --filter=PipelineStageConditionApiTest
```
