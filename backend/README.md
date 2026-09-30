# Backend API - SCRUM-5 / SCRUM-89 (Laravel)

Back-end cho CRM bo sung cho front-end React o thu muc goc. Phan quyen khong chi nam o giao dien:
moi API deu **kiem tra lai** quyen theo vai tro (RBAC) **va** pham vi du lieu so huu (Data Scope).

## Chay du an

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite     # mac dinh dung SQLite de chay nhanh
php artisan migrate:fresh --seed  # tao du lieu mau giong front-end
php artisan serve                 # http://localhost:8000
```

Chay kiem thu:

```bash
php artisan test
```

> Yeu cau PHP >= 8.2. Muon dung MySQL/MySQL server thi doi `DB_CONNECTION` trong `.env`.

## Tai khoan mau (mat khau chung: `12345678`)

| Tài khoản | Vai trò | Phạm vi mặc định | Nhóm |
| --- | --- | --- | --- |
| minhanh@crm.vn (U1) | Nhân viên | Dữ liệu của tôi | T1 |
| thuha@crm.vn (U2) | Nhân viên | Dữ liệu của tôi | T1 (cùng nhóm U1 nhưng **không** thấy dữ liệu của nhau) |
| quocbao@crm.vn (U3) | Trưởng nhóm | Dữ liệu của nhóm tôi | T1 |
| thidung@crm.vn (U4) | Nhân viên | Dữ liệu của tôi | T2 |
| ducthang@crm.vn (U5) | Giám đốc | Toàn bộ dữ liệu | T3 |

## Ma trận phân quyền (RBAC)

| Vai trò | Xem | Tạo | Sửa | Xoá | Xuất Excel | Phạm vi chọn được |
| --- | --- | --- | --- | --- | --- | --- |
| Nhân viên | ✔ | ✔ | ✔ (trong phạm vi) | ✖ | ✔ | của tôi |
| Trưởng nhóm | ✔ | ✔ | ✔ | ✔ | ✔ | của tôi / của nhóm tôi |
| Giám đốc | ✔ | ✔ | ✔ | ✔ | ✔ | của tôi / của nhóm tôi / tất cả |

Quy tắc dữ liệu (row-level) dùng chung cho cả 4 module:

```
own  : owner_id === user.id
team : owner_id === user.id  ||  team_id === user.team_id
all  : mọi bản ghi
```

Yêu cầu phạm vi vượt quyền bị **hạ về phạm vi mặc định của vai trò** (chống nâng quyền), kể cả khi sửa tham số.

## Endpoint

Xác thực bằng token Sanctum: `Authorization: Bearer <token>`.
Chọn phạm vi bằng header `X-Data-Scope: own|team|all` (bỏ trống = mặc định theo vai trò).

| Method | Đường dẫn | Mô tả |
| --- | --- | --- |
| POST | `/api/login` | Đăng nhập, trả token + ma trận quyền + phạm vi |
| GET | `/api/me` | Thông tin người đang đăng nhập |
| POST | `/api/logout` | Thu hồi token hiện tại |
| GET | `/api/dashboard` | Tổng hợp số liệu **trong phạm vi** |
| GET | `/api/{module}` | Danh sách (lọc theo phạm vi) |
| POST | `/api/{module}` | Tạo mới (tự gán chủ sở hữu = token) |
| GET | `/api/{module}/{id}` | Chi tiết 1 bản ghi (ngoài phạm vi → 403) |
| PUT/PATCH | `/api/{module}/{id}` | Cập nhật (chỉ trong phạm vi) |
| DELETE | `/api/{module}/{id}` | Xoá (theo quyền của vai trò) |
| GET | `/api/{module}/export` | Xuất CSV tương thích Excel, chỉ gồm bản ghi trong phạm vi |

`{module}` ∈ `customers`, `opportunities`, `activities`, `quotes`.

Tham số truy vấn hỗ trợ: `q` (tìm kiếm), `status` / `stage` / `type` (lọc), `per_page`, `scope`.

### Ví dụ

```bash
# 1. Đăng nhập
curl -X POST http://localhost:8000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"minhanh@crm.vn","password":"12345678"}'

# 2. Chỉ xem khách hàng của chính mình
curl http://localhost:8000/api/customers \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'X-Data-Scope: own'

# 3. Nhân viên cố xin phạm vi "all" -> tự động bị hạ về "own"
curl http://localhost:8000/api/customers \
  -H 'Authorization: Bearer <TOKEN_NHAN_VIEN>' \
  -H 'X-Data-Scope: all'
```

Phản hồi danh sách luôn kèm `meta` để front-end hiển thị cảnh báo:

```json
{
  "data": [ ... ],
  "meta": {
    "scope": "own",
    "scope_label": "Du lieu cua toi",
    "total_visible": 2,
    "total_all": 7,
    "hidden_count": 5
  }
}
```

Khi chạm phải bản ghi ngoài phạm vi, API trả **403** kèm thông điệp tiếng Việt giống hệt phần hiển thị ở front-end:

```json
{
  "message": "Khong co quyen thuc hien: xem khach hang \"3\". Pham vi hien tai cua ban la ...",
  "error": "AccessDeniedError",
  "entity": "customer",
  "record_id": 3,
  "scope": "own",
  "action": "xem"
}
```

## Kiến trúc

```
app/
├── Enums/                     Role, DataScope, các enum trạng thái nghiệp vụ
├── Exceptions/AccessDenied    403 + thông điệp tiếng Việt
├── Http/
│   ├── Controllers/Api/
│   │   ├── ScopedApiController   CRUD + export dùng chung cho 4 module
│   │   ├── AuthController        login / me / logout
│   │   └── DashboardController   tổng hợp theo phạm vi
│   └── Middleware/ResolveDataScope   đọc + chống nâng quyền phạm vi
├── Models/                  User, Team, Customer, Opportunity, Activity, Quote
├── Support/
│   ├── PermissionMatrix     ma trận RBAC + phạm vi mặc định/được phép
│   └── ScopeResolver        điều kiện lọc theo own/team/all
├── Providers/
routes/api.php
database/{migrations,seeders,factories}
tests/{Feature,Unit}         35 kiểm thử
```

Nguyên tắc: **không endpoint nào tự lọc dữ liệu theo cách riêng**. Mọi truy vấn đều đi qua
`ScopeResolver::apply()` và `PermissionMatrix::allows()`, nên không thể vô tình bỏ sót phân quyền.
`owner_id` / `team_id` luôn được gán từ token, không bao giờ tin giá trị gửi lên từ client.

## Kết nối với front-end

Front-end đang chạy bằng dữ liệu in-memory. Khi chuyển sang dùng API:

1. Chạy `php artisan serve` (cổng 8000).
2. Thêm `VITE_API_URL=http://localhost:8000/api` vào file `.env` của front-end.
3. Thay `src/services/repository.ts` (lớp truy cập dữ liệu có gắn phân quyền) bằng lời gọi `fetch`.
   Phần phân quyền ở UI giữ nguyên để hiển thị; server vẫn kiểm tra lại ở mọi request.
