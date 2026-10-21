# S2-05 Product/Pricing · S2-07 Common Category

Backend module cho **Laravel 13 + PHP 8.3**, theo CODE CONVENTION (PSR-12, Thin Controller, FormRequest, Service, JsonResource, Policy, snake_case).

## API `/api/v1`

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/products` | Phân trang catalog |
| POST | `/products` | Tạo Product/Service |
| GET/PATCH/DELETE | `/products/{id}` | Chi tiết / sửa / soft delete |
| GET | `/price-lists` | Danh sách bảng giá |
| POST | `/price-lists` | Tạo bảng giá (`is_standard` độc nhất) |
| GET/PATCH/DELETE | `/price-lists/{id}` | Chi tiết + items |
| POST | `/price-lists/{id}/items` | Upsert dòng giá |
| DELETE | `/price-lists/{id}/items/{item}` | Gỡ dòng giá |
| GET | `/common-categories?category_type=` | LEAD_SOURCE / INDUSTRY / BUSINESS_TYPE |
| POST/PATCH/DELETE | `/common-categories` | CRUD danh mục dùng chung |

Response: `{ success: true, data, message }` · 201 create · 422 FormRequest · 403 Policy.

## Permission (Giám đốc kinh doanh)

- `product.view` / `product.manage`
- `price_list.view` / `price_list.manage`
- `common_category.view` / `common_category.manage`

Copy thư mục `app/`, `database/migrations/`, `routes/api.php` vào project Laravel 13.
