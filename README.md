# SCRUM-5 / SCRUM-89 — Phân quyền theo vai trò + theo dữ liệu sở hữu (React + TypeScript)

Ứng dụng front-end mô phỏng CRM (bán hàng) với cơ chế **RBAC (phân quyền theo vai trò)** kết hợp **Data Scope
(phân quyền theo dữ liệu sở hữu)**: ba phạm vi *của tôi / của nhóm tôi / tất cả*, áp dụng cho **khách hàng, cơ hội,
hoạt động, báo giá**.

> User Story: *Là Giám đốc kinh doanh, tôi muốn có phân quyền vừa theo vai trò vừa theo dữ liệu sở hữu, để nhân
> viên chỉ thấy khách của mình, trưởng nhóm thấy toàn nhóm, còn tôi thấy tất cả.*

## Chạy dự án trong VS Code

```bash
cd scrum-5-data-scope
npm install
npm run dev        # http://localhost:5173
```

Các lệnh khác:

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy dev server (F5 / “Run Dev Server” trong `.vscode/launch.json`) |
| `npm test` | Chạy 45 kiểm thử tự động bằng Vitest |
| `npm run test:watch` | Chạy kiểm thử ở chế độ theo dõi |
| `npm run typecheck` | Kiểm tra TypeScript (strict) |
| `npm run build` | Build production vào `dist/` |

Yêu cầu: Node.js ≥ 18.

## Tài khoản demo (chuyển tài khoản ở góc trên bên phải)

| Tài khoản | Vai trò | Phạm vi mặc định | Nhóm |
| --- | --- | --- | --- |
| Nguyễn Minh Anh (U1) | Nhân viên | Dữ liệu của tôi | T1 |
| Trần Thu Hà (U2) | Nhân viên | Dữ liệu của tôi | T1 (cùng nhóm U1 nhưng **không** thấy dữ liệu của nhau) |
| Lê Quốc Bảo (U3) | Trưởng nhóm | Dữ liệu của nhóm tôi | T1 |
| Phạm Thị Dung (U4) | Nhân viên | Dữ liệu của tôi | T2 |
| Võ Đức Thắng (U5) | Giám đốc | Toàn bộ dữ liệu | T3 |

## Ma trận phân quyền

| Vai trò | Xem | Tạo | Sửa | Xoá | Xuất Excel | Phạm vi chọn được |
| --- | --- | --- | --- | --- | --- | --- |
| Nhân viên | ✔ | ✔ | ✔ (trong phạm vi) | ✖ | ✔ | của tôi |
| Trưởng nhóm | ✔ | ✔ | ✔ | ✔ | ✔ | của tôi / của nhóm tôi |
| Giám đốc | ✔ | ✔ | ✔ | ✔ | ✔ | của tôi / của nhóm tôi / tất cả |

Quy tắc dữ liệu (row-level) dùng chung cho cả 4 module:

```
own  : ownerId === user.id
team : ownerId === user.id  ||  teamId === user.teamId
all  : mọi bản ghi
```

Yêu cầu phạm vi vượt quyền bị hạ về phạm vi mặc định của vai trò (chống nâng quyền), kể cả khi sửa tham số.

## Kiến trúc

```
src/
├── types/index.ts            Kiểu dữ liệu + nhãn tiếng Việt
├── data/seed.ts              Dữ liệu mô phỏng (5 user, 3 nhóm, 4 module)
├── auth/
│   ├── permissions.ts        Ma trận RBAC, phạm vi mặc định, chống nâng quyền
│   ├── scope.ts              Quy tắc phạm vi: isRecordInScope / canReadRecord / filterByScope
│   ├── errors.ts             AccessDeniedError + sinh thông báo tiếng Việt
│   └── SessionContext.tsx    Phiên đăng nhập, chọn phạm vi, lưu localStorage
├── services/
│   ├── store.ts              CSDL in-memory (thay cho API)
│   └── repository.ts         Lớp truy cập dữ liệu CÓ gắn phân quyền
├── checks/isolation.ts       13 kịch bản kiểm thử dùng chung test ↔ giao diện
├── config/entities.tsx       Cấu hình cột/bộ lọc/chi tiết cho 4 module
├── components/               Layout, DataTable, AccessDenied, Badge, Pagination…
├── pages/                    Login, Dashboard, EntityList/Detail, AccessChecks
├── utils/                    exportExcel (CSV tương thích Excel), text, format
└── __tests__/                45 kiểm thử Vitest
```

Điểm quan trọng: **UI không tự lọc dữ liệu**. Mọi truy vấn đều đi qua `ScopedRepository`, nơi phạm vi được áp dụng
*trước* khi tìm kiếm, bộ lọc, phân trang và xuất Excel — nên không thể rò rỉ dữ liệu bằng cách đoán mã bản ghi hay
đổi tham số.

## Đối chiếu tiêu chí nghiệm thu

| Tiêu chí trong Jira | Hiện thực |
| --- | --- |
| 3 phạm vi dữ liệu áp dụng cho khách hàng, cơ hội, hoạt động, báo giá | `auth/scope.ts` + `ScopedRepository.list/get/create/update/remove` cho cả 4 module |
| Mọi truy vấn danh sách tự động lọc theo phạm vi, kể cả tìm kiếm và xuất Excel | `ScopedRepository.list/exportRows`; nút “⤓ Xuất Excel” dùng đúng tập dữ liệu đã lọc |
| Truy cập bản ghi ngoài phạm vi hiển thị thông báo tiếng Việt rõ ràng | `AccessDeniedError` + màn hình `AccessDenied` (ghi rõ phạm vi, chủ sở hữu, cách xử lý) |
| Kiểm thử tự động chứng minh nhân viên A không đọc được khách của nhân viên B | `src/__tests__/*` (45 test) + trang “Kiểm thử phân quyền” trong ứng dụng |

### Kiểm thử tự động (npm test)

```
✓ isolation.customers.test.ts  (13)  A không đọc/sửa/tìm kiếm/xuất Excel được dữ liệu của B
✓ rbac.scope.test.ts           (16)  Phạm vi theo vai trò, chống nâng quyền, bất biến sở hữu
✓ export.scope.test.ts         (9)   Xuất Excel không rò rỉ dữ liệu ngoài phạm vi
✓ ui.permissions.test.tsx      (7)   Render giao diện: trang/list/URL trực tiếp đều lọc đúng
Test Files  4 passed | Tests  45 passed
```

Thử tay nhanh: đăng nhập **Nguyễn Minh Anh**, bấm “⤓ Xuất Excel” rồi mở file, hoặc dán URL
`http://localhost:5173/customers/C3` → hiện thông báo “Không có quyền…”. Trang **Kiểm thử phân quyền** cho phép
gõ mã bản ghi bất kỳ để xem kết quả với tài khoản hiện tại.

## Ghi chú khi đưa lên backend thật

* Phân quyền phải được kiểm tra ở **tầng server** (middleware/RLS của DB); bản demo này đặt tại `ScopedRepository`
  để mô phỏng đúng vị trí đó.
* Ánh xạ trực tiếp: `ownerId` → cột `owner_id`, `teamId` → `owner_team_id` (hoặc join bảng nhóm); phạm vi `own`
  thành `WHERE owner_id = :userId`, `team` thành `OR owner_team_id = :teamId`, `all` bỏ điều kiện.
* Bản ghi ngoài phạm vi nên trả về **403 kèm thông điệp tiếng Việt** tương ứng với `buildAccessDeniedMessage`.
