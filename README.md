# S6-04: Opportunity Attachments (Đính kèm & quản lý tài liệu)

## Tổng quan
Feature cho phép **nhân viên kinh doanh** tải lên, quản lý và chia sẻ tệp đính kèm trong Cơ hội bán hàng (Opportunity). Hỗ trợ upload đa tệp, phân quyền truy cập, và hiển thị metadata đầy đủ.

---

## Cấu trúc thư mục

```
S6-04_Opportunity_Attachments/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   └── OpportunityAttachmentController.php
│   │   │   ├── Requests/
│   │   │   │   └── UploadAttachmentRequest.php
│   │   │   └── Resources/
│   │   │       └── OpportunityAttachmentResource.php
│   │   ├── Models/
│   │   │   └── OpportunityAttachment.php
│   │   ├── Policies/
│   │   │   └── OpportunityAttachmentPolicy.php
│   │   └── Services/
│   │       └── OpportunityAttachmentService.php
│   ├── database/migrations/
│   │   ├── 2026_10_21_200001_create_opportunity_attachments_table.php
│   │   └── 2026_10_21_200002_create_opportunity_shared_users_table.php
│   ├── routes/
│   │   └── opportunity_attachments.php
│   └── tests/
│       ├── Unit/Services/
│       │   └── OpportunityAttachmentServiceTest.php
│       └── Feature/Api/
│           └── OpportunityAttachmentApiTest.php
├── frontend/
│   └── src/
│       ├── types/
│       │   └── attachment.types.ts
│       ├── services/
│       │   └── attachmentApi.ts
│       └── components/
│           ├── OpportunityAttachmentPanel.tsx
│           ├── FileUploadZone.tsx
│           └── AttachmentTable.tsx
└── README.md
```

---

## API Specifications

### Base Endpoints

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|--------|-------|
| `GET` | `/api/opportunities/{id}/attachments` | Danh sách tệp đính kèm | Owner / Shared / Manager |
| `POST` | `/api/opportunities/{id}/attachments` | Upload nhiều tệp | Owner / Shared / Manager |
| `GET` | `/api/attachments/{id}/download` | Tải xuống tệp | Owner / Shared / Manager |
| `DELETE` | `/api/attachments/{id}` | Xoá tệp | Owner / Manager only |

---

### 1. GET `/api/opportunities/{id}/attachments`

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "original_name": "Proposal_v2.pdf",
      "mime_type": "application/pdf",
      "file_size": 2560000,
      "formatted_size": "2.44 MB",
      "uploaded_by": 5,
      "uploader": { "id": 5, "name": "Nguyễn Văn A" },
      "download_url": "/api/attachments/1/download",
      "created_at": "2026-10-20T14:30:00.000Z"
    }
  ],
  "meta": {
    "total_files": 3,
    "total_size": 5120000,
    "total_size_formatted": "4.88 MB"
  }
}
```

### 2. POST `/api/opportunities/{id}/attachments`

**Request:** `multipart/form-data`

| Field | Type | Mô tả |
|-------|------|--------|
| `files[]` | File[] | Mảng tệp (1-10 tệp, mỗi tệp ≤ 20MB) |

**Supported formats:** PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, JPG/PNG/GIF/WEBP, ZIP/RAR/7Z

**Response (201):**
```json
{
  "message": "Đã tải lên 2 tệp thành công.",
  "data": [...]
}
```

**Response (422 - validation error):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "files.0": ["Mỗi tệp không được vượt quá 20MB."]
  }
}
```

### 3. GET `/api/attachments/{id}/download`

Binary file response with appropriate Content-Type header.

### 4. DELETE `/api/attachments/{id}`

**Response (200):**
```json
{
  "message": "Đã xoá tệp \"Proposal_v2.pdf\"."
}
```

---

## Phân quyền truy cập (Access Control)

| Hành động | Owner | Shared User | Manager/Admin | Outsider |
|-----------|-------|-------------|---------------|----------|
| Xem danh sách | ✅ | ✅ | ✅ | ❌ |
| Tải xuống | ✅ | ✅ | ✅ | ❌ |
| Tải lên | ✅ | ✅ | ✅ | ❌ |
| Xoá | ✅ | ❌ | ✅ | ❌ |

- **Owner**: `opportunity.owner_id === user.id`
- **Shared User**: Có trong bảng `opportunity_shared_users`
- **Manager/Admin**: Role `manager` hoặc `admin`

---

## Giới hạn kỹ thuật

| Giới hạn | Giá trị |
|----------|---------|
| Dung lượng tối đa / tệp | 20 MB |
| Số tệp tối đa / lần upload | 10 |
| Định dạng hỗ trợ | PDF, DOC, XLS, PPT, TXT, CSV, ảnh, archive |

---

## Metadata hiển thị

Mỗi tệp đính kèm hiển thị đầy đủ:
- **Tên tệp** (`original_name`)
- **Kích thước** (`formatted_size` — tự format từ bytes sang KB/MB)
- **Người tải lên** (`uploader.name`)
- **Thời điểm tải lên** (`created_at` — format vi-VN)
- **Icon theo loại tệp** (PDF 📄, Excel 📊, Image 🖼️, ...)

---

## Hướng dẫn tích hợp

### Backend
1. Chạy migration:
   ```bash
   php artisan migrate
   ```
2. Đăng ký routes trong `routes/api.php`:
   ```php
   require __DIR__ . '/opportunity_attachments.php';
   ```
3. Cấu hình storage disk trong `config/filesystems.php` (mặc định `local`).
4. Đảm bảo model `Opportunity` có relationships:
   ```php
   public function attachments(): HasMany
   {
       return $this->hasMany(OpportunityAttachment::class);
   }
   
   public function sharedUsers(): BelongsToMany
   {
       return $this->belongsToMany(User::class, 'opportunity_shared_users')
           ->withPivot('permission')
           ->withTimestamps();
   }
   ```

### Frontend
```tsx
import OpportunityAttachmentPanel from './components/OpportunityAttachmentPanel';

<OpportunityAttachmentPanel
  opportunityId={5}
  canUpload={true}
  canDelete={true}
/>
```

### Chạy Tests
```bash
php artisan test --filter=OpportunityAttachmentServiceTest
php artisan test --filter=OpportunityAttachmentApiTest
```
