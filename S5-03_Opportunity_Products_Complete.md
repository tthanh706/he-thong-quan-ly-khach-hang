# S5-03 – Thêm Sản phẩm / Dịch vụ vào Cơ hội (Opportunity Products)

**User Story:**  
Là Nhân viên kinh doanh, tôi muốn thêm sản phẩm dịch vụ vào cơ hội để ra giá trị hợp đồng, để giá trị cơ hội là con số có căn cứ chứ không phải ước lượng.

**Acceptance Criteria:**
- Chọn sản phẩm từ danh mục, nhập số lượng và đơn giá, đơn giá mặc định lấy từ bảng giá niêm yết
- Giá trị cơ hội được tính lại tự động từ các dòng sản phẩm
- Với dịch vụ thuê bao, khai báo được số kỳ và giá trị hợp đồng theo năm

**Tech Stack:** React + TypeScript · PHP 8.3 · Laravel 11 · MySQL  
**Tuân thủ 100% Code Convention của dự án CRM**

---

## 1. Database Design (MySQL)

### 1.1. Migration: `create_products_table.php` (nếu chưa có)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('type', 30)->default('product'); // product | service
            $table->decimal('list_price', 15, 2)->default(0); // Giá niêm yết
            $table->boolean('is_subscription')->default(false); // Dịch vụ thuê bao
            $table->string('billing_period', 20)->nullable(); // monthly | yearly | quarterly
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'is_active'], 'idx_products_type_active');
            $table->index('is_subscription', 'idx_products_is_subscription');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
```

### 1.2. Migration: `create_opportunity_items_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('unit_price', 15, 2); // Đơn giá thực tế (có thể khác list_price)
            $table->decimal('discount_percent', 5, 2)->default(0); // % giảm giá
            $table->unsignedInteger('billing_cycles')->nullable(); // Số kỳ (chỉ dùng cho subscription)
            $table->decimal('line_total', 15, 2)->default(0); // Thành tiền dòng = quantity * unit_price * (1 - discount/100) * billing_cycles (nếu có)
            $table->text('notes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('opportunity_id', 'idx_opportunity_items_opportunity_id');
            $table->index('product_id', 'idx_opportunity_items_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_items');
    }
};
```

### 1.3. Migration: Đảm bảo cột `amount` trên bảng `opportunities` (nếu chưa có)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            if (!Schema::hasColumn('opportunities', 'amount')) {
                $table->decimal('amount', 15, 2)->default(0)->after('stage');
            }
            // Cờ đánh dấu giá trị được tính từ dòng sản phẩm
            if (!Schema::hasColumn('opportunities', 'is_amount_from_items')) {
                $table->boolean('is_amount_from_items')->default(false)->after('amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn(['amount', 'is_amount_from_items']);
        });
    }
};
```

---

## 2. Backend – Laravel 11 (PHP 8.3)

### 2.1. Enum: `app/Enums/ProductTypeEnum.php`

```php
<?php

namespace App\Enums;

enum ProductTypeEnum: string
{
    case PRODUCT = 'product';
    case SERVICE = 'service';

    public function label(): string
    {
        return match ($this) {
            self::PRODUCT => 'Sản phẩm',
            self::SERVICE => 'Dịch vụ',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### 2.2. Enum: `app/Enums/BillingPeriodEnum.php`

```php
<?php

namespace App\Enums;

enum BillingPeriodEnum: string
{
    case MONTHLY = 'monthly';
    case QUARTERLY = 'quarterly';
    case YEARLY = 'yearly';

    public function label(): string
    {
        return match ($this) {
            self::MONTHLY => 'Hàng tháng',
            self::QUARTERLY => 'Hàng quý',
            self::YEARLY => 'Hàng năm',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### 2.3. Model: `app/Models/Product.php`

```php
<?php

namespace App\Models;

use App\Enums\BillingPeriodEnum;
use App\Enums\ProductTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'list_price',
        'is_subscription',
        'billing_period',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'list_price' => 'decimal:2',
        'is_subscription' => 'boolean',
        'is_active' => 'boolean',
        'type' => ProductTypeEnum::class,
        'billing_period' => BillingPeriodEnum::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function opportunityItems(): HasMany
    {
        return $this->hasMany(OpportunityItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

### 2.4. Model: `app/Models/OpportunityItem.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount_percent',
        'billing_cycles',
        'line_total',
        'notes',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'billing_cycles' => 'integer',
        'line_total' => 'decimal:2',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Tính lại line_total
     * Công thức: quantity * unit_price * (1 - discount_percent/100) * (billing_cycles ?? 1)
     */
    public function calculateLineTotal(): float
    {
        $cycles = $this->billing_cycles ?? 1;
        $discountFactor = 1 - ((float) $this->discount_percent / 100);

        return round(
            (float) $this->quantity * (float) $this->unit_price * $discountFactor * $cycles,
            2
        );
    }
}
```

### 2.5. Cập nhật Model Opportunity

```php
// Thêm vào app/Models/Opportunity.php

public function items(): HasMany
{
    return $this->hasMany(OpportunityItem::class)->orderBy('sort_order');
}

public function recalculateAmount(): void
{
    $total = $this->items()->sum('line_total');
    $this->amount = $total;
    $this->is_amount_from_items = true;
    $this->saveQuietly(); // Không trigger event lại
}
```

### 2.6. Form Requests

#### `app/Http/Requests/OpportunityItem/StoreOpportunityItemRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpportunityItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        return $this->user()->can('update', $opportunity);
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'billing_cycles' => ['nullable', 'integer', 'min:1', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Sản phẩm/dịch vụ là bắt buộc.',
            'product_id.exists' => 'Sản phẩm/dịch vụ không tồn tại.',
            'quantity.required' => 'Số lượng là bắt buộc.',
            'quantity.min' => 'Số lượng phải lớn hơn 0.',
            'unit_price.required' => 'Đơn giá là bắt buộc.',
            'unit_price.min' => 'Đơn giá không được âm.',
            'discount_percent.max' => 'Phần trăm giảm giá tối đa 100%.',
            'billing_cycles.min' => 'Số kỳ phải từ 1 trở lên.',
        ];
    }
}
```

#### `app/Http/Requests/OpportunityItem/UpdateOpportunityItemRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOpportunityItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $item = $this->route('item');
        return $this->user()->can('update', $item->opportunity);
    }

    public function rules(): array
    {
        return [
            'product_id' => ['sometimes', 'required', 'integer', 'exists:products,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'billing_cycles' => ['nullable', 'integer', 'min:1', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.min' => 'Số lượng phải lớn hơn 0.',
            'unit_price.min' => 'Đơn giá không được âm.',
            'discount_percent.max' => 'Phần trăm giảm giá tối đa 100%.',
        ];
    }
}
```

#### `app/Http/Requests/OpportunityItem/SyncOpportunityItemsRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityItem;

use Illuminate\Foundation\Http\FormRequest;

class SyncOpportunityItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        return $this->user()->can('update', $opportunity);
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:0'],
            'items.*.id' => ['nullable', 'integer', 'exists:opportunity_items,id'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.billing_cycles' => ['nullable', 'integer', 'min:1', 'max:120'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Danh sách sản phẩm là bắt buộc.',
            'items.*.product_id.required' => 'Sản phẩm/dịch vụ là bắt buộc.',
            'items.*.quantity.min' => 'Số lượng phải lớn hơn 0.',
            'items.*.unit_price.min' => 'Đơn giá không được âm.',
        ];
    }
}
```

### 2.7. API Resources

#### `app/Http/Resources/ProductResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'list_price' => (float) $this->list_price,
            'is_subscription' => (bool) $this->is_subscription,
            'billing_period' => $this->billing_period?->value,
            'billing_period_label' => $this->billing_period?->label(),
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

#### `app/Http/Resources/OpportunityItemResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'product_id' => $this->product_id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'discount_percent' => (float) $this->discount_percent,
            'billing_cycles' => $this->billing_cycles,
            'line_total' => (float) $this->line_total,
            'notes' => $this->notes,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

### 2.8. Service: `app/Services/OpportunityItemService.php`

```php
<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\OpportunityItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OpportunityItemService
{
    /**
     * Lấy danh sách dòng sản phẩm của 1 Opportunity
     */
    public function getItems(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->items()->with('product')->orderBy('sort_order')->get();
    }

    /**
     * Thêm 1 dòng sản phẩm
     */
    public function store(Opportunity $opportunity, array $data): OpportunityItem
    {
        return DB::transaction(function () use ($opportunity, $data) {
            $product = Product::findOrFail($data['product_id']);

            // Nếu client không gửi unit_price → lấy giá niêm yết
            if (!isset($data['unit_price'])) {
                $data['unit_price'] = $product->list_price;
            }

            // Chỉ cho phép billing_cycles khi sản phẩm là subscription
            if (!$product->is_subscription) {
                $data['billing_cycles'] = null;
            } else {
                $data['billing_cycles'] = $data['billing_cycles'] ?? 1;
            }

            $item = new OpportunityItem($data);
            $item->opportunity_id = $opportunity->id;
            $item->line_total = $item->calculateLineTotal();
            $item->save();

            $opportunity->recalculateAmount();

            return $item->load('product');
        });
    }

    /**
     * Cập nhật 1 dòng sản phẩm
     */
    public function update(OpportunityItem $item, array $data): OpportunityItem
    {
        return DB::transaction(function () use ($item, $data) {
            if (isset($data['product_id'])) {
                $product = Product::findOrFail($data['product_id']);
                if (!$product->is_subscription) {
                    $data['billing_cycles'] = null;
                }
            }

            $item->fill($data);
            $item->line_total = $item->calculateLineTotal();
            $item->save();

            $item->opportunity->recalculateAmount();

            return $item->load('product');
        });
    }

    /**
     * Xóa 1 dòng sản phẩm
     */
    public function delete(OpportunityItem $item): void
    {
        DB::transaction(function () use ($item) {
            $opportunity = $item->opportunity;
            $item->delete();
            $opportunity->recalculateAmount();
        });
    }

    /**
     * Đồng bộ toàn bộ danh sách dòng sản phẩm (thay thế)
     * Dùng khi form gửi cả list items lên
     */
    public function syncItems(Opportunity $opportunity, array $itemsData): \Illuminate\Database\Eloquent\Collection
    {
        return DB::transaction(function () use ($opportunity, $itemsData) {
            $existingIds = [];

            foreach ($itemsData as $index => $row) {
                $product = Product::findOrFail($row['product_id']);

                $payload = [
                    'product_id' => $row['product_id'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'] ?? $product->list_price,
                    'discount_percent' => $row['discount_percent'] ?? 0,
                    'billing_cycles' => $product->is_subscription
                        ? ($row['billing_cycles'] ?? 1)
                        : null,
                    'notes' => $row['notes'] ?? null,
                    'sort_order' => $row['sort_order'] ?? $index,
                ];

                if (!empty($row['id'])) {
                    $item = OpportunityItem::where('opportunity_id', $opportunity->id)
                        ->where('id', $row['id'])
                        ->firstOrFail();
                    $item->fill($payload);
                    $item->line_total = $item->calculateLineTotal();
                    $item->save();
                    $existingIds[] = $item->id;
                } else {
                    $item = new OpportunityItem($payload);
                    $item->opportunity_id = $opportunity->id;
                    $item->line_total = $item->calculateLineTotal();
                    $item->save();
                    $existingIds[] = $item->id;
                }
            }

            // Xóa những dòng không còn trong list
            OpportunityItem::where('opportunity_id', $opportunity->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

            $opportunity->recalculateAmount();

            return $opportunity->items()->with('product')->orderBy('sort_order')->get();
        });
    }
}
```

### 2.9. Controller: `app/Http/Controllers/Api/V1/OpportunityItemController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpportunityItem\StoreOpportunityItemRequest;
use App\Http\Requests\OpportunityItem\UpdateOpportunityItemRequest;
use App\Http\Requests\OpportunityItem\SyncOpportunityItemsRequest;
use App\Http\Resources\OpportunityItemResource;
use App\Models\Opportunity;
use App\Models\OpportunityItem;
use App\Services\OpportunityItemService;
use Illuminate\Http\JsonResponse;

class OpportunityItemController extends Controller
{
    public function __construct(
        private readonly OpportunityItemService $opportunityItemService
    ) {}

    /**
     * GET /api/v1/opportunities/{opportunity}/items
     */
    public function index(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $items = $this->opportunityItemService->getItems($opportunity);

        return response()->json([
            'success' => true,
            'data' => OpportunityItemResource::collection($items),
            'message' => 'Danh sách sản phẩm/dịch vụ của cơ hội',
        ]);
    }

    /**
     * POST /api/v1/opportunities/{opportunity}/items
     */
    public function store(StoreOpportunityItemRequest $request, Opportunity $opportunity): JsonResponse
    {
        $item = $this->opportunityItemService->store($opportunity, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new OpportunityItemResource($item),
            'message' => 'Thêm sản phẩm/dịch vụ thành công',
        ], 201);
    }

    /**
     * PATCH /api/v1/opportunities/{opportunity}/items/{item}
     */
    public function update(
        UpdateOpportunityItemRequest $request,
        Opportunity $opportunity,
        OpportunityItem $item
    ): JsonResponse {
        // Đảm bảo item thuộc opportunity
        if ($item->opportunity_id !== $opportunity->id) {
            abort(404);
        }

        $updated = $this->opportunityItemService->update($item, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new OpportunityItemResource($updated),
            'message' => 'Cập nhật dòng sản phẩm thành công',
        ]);
    }

    /**
     * DELETE /api/v1/opportunities/{opportunity}/items/{item}
     */
    public function destroy(Opportunity $opportunity, OpportunityItem $item): JsonResponse
    {
        $this->authorize('update', $opportunity);

        if ($item->opportunity_id !== $opportunity->id) {
            abort(404);
        }

        $this->opportunityItemService->delete($item);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa dòng sản phẩm thành công',
        ]);
    }

    /**
     * PUT /api/v1/opportunities/{opportunity}/items/sync
     * Đồng bộ toàn bộ danh sách (thay thế)
     */
    public function sync(SyncOpportunityItemsRequest $request, Opportunity $opportunity): JsonResponse
    {
        $items = $this->opportunityItemService->syncItems($opportunity, $request->validated()['items']);

        return response()->json([
            'success' => true,
            'data' => OpportunityItemResource::collection($items),
            'message' => 'Cập nhật danh sách sản phẩm thành công. Giá trị cơ hội đã được tính lại.',
        ]);
    }
}
```

### 2.10. Routes (`routes/api.php`)

```php
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // ... các route khác

    // Opportunity Items
    Route::get('opportunities/{opportunity}/items', [OpportunityItemController::class, 'index']);
    Route::post('opportunities/{opportunity}/items', [OpportunityItemController::class, 'store']);
    Route::patch('opportunities/{opportunity}/items/{item}', [OpportunityItemController::class, 'update']);
    Route::delete('opportunities/{opportunity}/items/{item}', [OpportunityItemController::class, 'destroy']);
    Route::put('opportunities/{opportunity}/items/sync', [OpportunityItemController::class, 'sync']);

    // Products (để select)
    Route::get('products', [ProductController::class, 'index']); // Chỉ cần list active products
});
```

> **Lưu ý:** Bạn cần có `ProductController@index` đơn giản trả về danh sách sản phẩm active (có thể tái sử dụng Resource có sẵn).

### 2.11. ProductController (đơn giản – list để select)

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->active()->orderBy('name');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $products = $query->paginate(min((int) $request->get('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'message' => 'Danh sách sản phẩm/dịch vụ',
        ]);
    }
}
```

---

## 3. Frontend – React + TypeScript

### 3.1. Types: `src/types/product.ts`

```typescript
export type ProductType = 'product' | 'service';
export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: ProductType;
  type_label: string;
  list_price: number;
  is_subscription: boolean;
  billing_period: BillingPeriod | null;
  billing_period_label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpportunityItem {
  id: number;
  opportunity_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  billing_cycles: number | null;
  line_total: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOpportunityItemRequest {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  billing_cycles?: number | null;
  notes?: string | null;
  sort_order?: number;
}

export interface UpdateOpportunityItemRequest {
  product_id?: number;
  quantity?: number;
  unit_price?: number;
  discount_percent?: number;
  billing_cycles?: number | null;
  notes?: string | null;
  sort_order?: number;
}

export interface SyncOpportunityItemsRequest {
  items: Array<{
    id?: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    billing_cycles?: number | null;
    notes?: string | null;
    sort_order?: number;
  }>;
}
```

### 3.2. Constants: `src/constants/product.ts`

```typescript
export const PRODUCT_TYPE_OPTIONS = [
  { value: 'product', label: 'Sản phẩm' },
  { value: 'service', label: 'Dịch vụ' },
] as const;

export const BILLING_PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'quarterly', label: 'Hàng quý' },
  { value: 'yearly', label: 'Hàng năm' },
] as const;
```

### 3.3. Service: `src/services/opportunityItemService.ts`

```typescript
import api from '../api';
import type {
  OpportunityItem,
  CreateOpportunityItemRequest,
  UpdateOpportunityItemRequest,
  SyncOpportunityItemsRequest,
  Product,
} from '../types/product';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const opportunityItemService = {
  async getItems(opportunityId: number): Promise<OpportunityItem[]> {
    const response = await api.get<ApiResponse<OpportunityItem[]>>(
      `/api/v1/opportunities/${opportunityId}/items`
    );
    return response.data.data;
  },

  async createItem(
    opportunityId: number,
    payload: CreateOpportunityItemRequest
  ): Promise<OpportunityItem> {
    const response = await api.post<ApiResponse<OpportunityItem>>(
      `/api/v1/opportunities/${opportunityId}/items`,
      payload
    );
    return response.data.data;
  },

  async updateItem(
    opportunityId: number,
    itemId: number,
    payload: UpdateOpportunityItemRequest
  ): Promise<OpportunityItem> {
    const response = await api.patch<ApiResponse<OpportunityItem>>(
      `/api/v1/opportunities/${opportunityId}/items/${itemId}`,
      payload
    );
    return response.data.data;
  },

  async deleteItem(opportunityId: number, itemId: number): Promise<void> {
    await api.delete(`/api/v1/opportunities/${opportunityId}/items/${itemId}`);
  },

  async syncItems(
    opportunityId: number,
    payload: SyncOpportunityItemsRequest
  ): Promise<OpportunityItem[]> {
    const response = await api.put<ApiResponse<OpportunityItem[]>>(
      `/api/v1/opportunities/${opportunityId}/items/sync`,
      payload
    );
    return response.data.data;
  },

  async getProducts(params?: {
    search?: string;
    type?: string;
    per_page?: number;
  }): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/api/v1/products', {
      params: { ...params, per_page: params?.per_page ?? 50 },
    });
    // Laravel pagination trả về data.data hoặc data tùy Resource
    return Array.isArray(response.data.data)
      ? response.data.data
      : (response.data.data as any).data ?? [];
  },
};
```

### 3.4. Hook: `src/hooks/useOpportunityItems.ts`

```typescript
import { useState, useCallback } from 'react';
import { opportunityItemService } from '../services/opportunityItemService';
import type {
  OpportunityItem,
  CreateOpportunityItemRequest,
  SyncOpportunityItemsRequest,
} from '../types/product';

export function useOpportunityItems(opportunityId: number) {
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await opportunityItemService.getItems(opportunityId);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  const addItem = useCallback(
    async (payload: CreateOpportunityItemRequest) => {
      setLoading(true);
      setError(null);
      try {
        const created = await opportunityItemService.createItem(opportunityId, payload);
        setItems((prev) => [...prev, created]);
        return created;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Thêm sản phẩm thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setLoading(true);
      setError(null);
      try {
        await opportunityItemService.deleteItem(opportunityId, itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa sản phẩm thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const syncItems = useCallback(
    async (payload: SyncOpportunityItemsRequest) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await opportunityItemService.syncItems(opportunityId, payload);
        setItems(updated);
        return updated;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Cập nhật danh sách thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const totalAmount = items.reduce((sum, item) => sum + (item.line_total || 0), 0);

  return {
    items,
    loading,
    error,
    totalAmount,
    fetchItems,
    addItem,
    removeItem,
    syncItems,
  };
}
```

### 3.5. Component: `src/components/opportunity/OpportunityItemsEditor.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOpportunityItems } from '../../hooks/useOpportunityItems';
import { opportunityItemService } from '../../services/opportunityItemService';
import type { Product, OpportunityItem } from '../../types/product';

const itemSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().min(1, 'Chọn sản phẩm/dịch vụ'),
  quantity: z.number().min(0.01, 'Số lượng phải > 0'),
  unit_price: z.number().min(0, 'Đơn giá không được âm'),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  billing_cycles: z.number().min(1).max(120).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

const formSchema = z.object({
  items: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

interface OpportunityItemsEditorProps {
  opportunityId: number;
  onAmountChanged?: (newAmount: number) => void;
}

export const OpportunityItemsEditor: React.FC<OpportunityItemsEditorProps> = ({
  opportunityId,
  onAmountChanged,
}) => {
  const { items, loading, error, totalAmount, fetchItems, syncItems } =
    useOpportunityItems(opportunityId);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Load items & products
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (items.length > 0) {
      reset({
        items: items.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          billing_cycles: item.billing_cycles,
          notes: item.notes,
        })),
      });
    }
  }, [items, reset]);

  useEffect(() => {
    const loadProducts = async () => {
      const list = await opportunityItemService.getProducts({
        search: productSearch,
        per_page: 100,
      });
      setProducts(list);
    };
    loadProducts();
  }, [productSearch]);

  // Tính lại line_total realtime trên UI
  const watchedItems = watch('items');

  const calculateLineTotal = (row: any) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unit_price) || 0;
    const discount = Number(row.discount_percent) || 0;
    const cycles = row.billing_cycles ? Number(row.billing_cycles) : 1;
    return Math.round(qty * price * (1 - discount / 100) * cycles * 100) / 100;
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.unit_price`, product.list_price);
      if (!product.is_subscription) {
        setValue(`items.${index}.billing_cycles`, null);
      } else {
        setValue(`items.${index}.billing_cycles`, 1);
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await syncItems({ items: data.items });
      if (onAmountChanged) {
        const newTotal = updated.reduce((sum, i) => sum + i.line_total, 0);
        onAmountChanged(newTotal);
      }
      alert('Cập nhật sản phẩm thành công. Giá trị cơ hội đã được tính lại.');
    } catch (err) {
      // error đã được set trong hook
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sản phẩm / Dịch vụ của Cơ hội
        </h3>
        <div className="text-right">
          <span className="text-sm text-gray-500">Tổng giá trị cơ hội:</span>
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Sản phẩm / Dịch vụ</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Số lượng</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Đơn giá</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Giảm %</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Số kỳ</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Thành tiền</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field, index) => {
                const currentProductId = watchedItems?.[index]?.product_id;
                const product = products.find((p) => p.id === currentProductId);
                const isSubscription = product?.is_subscription ?? false;
                const lineTotal = calculateLineTotal(watchedItems?.[index] || {});

                return (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <select
                        {...register(`items.${index}.product_id`, {
                          valueAsNumber: true,
                          onChange: (e) =>
                            handleProductChange(index, Number(e.target.value)),
                        })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                      >
                        <option value="">-- Chọn --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} – {p.name} ({formatCurrency(p.list_price)})
                            {p.is_subscription ? ' [Thuê bao]' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.product_id && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {errors.items[index]?.product_id?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.discount_percent`, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded border border-gray-300 px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {isSubscription ? (
                        <input
                          type="number"
                          min={1}
                          max={120}
                          {...register(`items.${index}.billing_cycles`, {
                            valueAsNumber: true,
                          })}
                          className="w-full rounded border border-gray-300 px-2 py-1.5"
                          placeholder="Số kỳ"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {fields.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Chưa có sản phẩm/dịch vụ nào. Hãy thêm dòng mới.
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() =>
              append({
                product_id: 0,
                quantity: 1,
                unit_price: 0,
                discount_percent: 0,
                billing_cycles: null,
                notes: null,
              })
            }
            className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm"
          >
            + Thêm dòng sản phẩm
          </button>

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || loading ? 'Đang lưu...' : 'Lưu & Tính lại giá trị cơ hội'}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### 3.6. Cách sử dụng trong Opportunity Detail Page

```tsx
// Trong OpportunityDetailPage.tsx
import { OpportunityItemsEditor } from '../components/opportunity/OpportunityItemsEditor';

// ...
<div className="mt-6">
  <OpportunityItemsEditor
    opportunityId={opportunity.id}
    onAmountChanged={(newAmount) => {
      // Cập nhật state amount của opportunity trên UI
      setOpportunity((prev) => prev ? { ...prev, amount: newAmount } : prev);
    }}
  />
</div>
```

---

## 4. Git Branch & Commit

**Branch:** `feature/opportunity-products`  
**Commit message gợi ý:**

```
feat(s5-03): thêm sản phẩm/dịch vụ vào cơ hội và tính tự động giá trị

- Thêm bảng products + opportunity_items
- Đơn giá mặc định lấy từ list_price
- Hỗ trợ dịch vụ thuê bao (billing_cycles)
- Tự động tính lại amount của Opportunity từ các dòng sản phẩm
- API sync items + Frontend editor với React Hook Form + Zod
```

---

## 5. Checklist Definition of Done (theo Convention)

- [x] Đúng convention đặt tên (camelCase / PascalCase / snake_case)
- [x] Cấu trúc thư mục Frontend & Backend chuẩn
- [x] Validation FormRequest + Zod tiếng Việt
- [x] Authorization qua Policy (update Opportunity)
- [x] Thin Controller – Thick Service
- [x] API Resource chuẩn `{ success, data, message }`
- [x] Database transaction khi cập nhật nhiều bảng
- [x] Tự động tính lại `amount` của Opportunity
- [x] Hỗ trợ subscription (số kỳ / billing_cycles)
- [x] Đơn giá mặc định lấy từ `list_price`
- [x] UI loading / empty state / tiếng Việt
- [x] Không hard-code secret

---

## 6. Tóm tắt luồng nghiệp vụ

1. Nhân viên kinh doanh mở chi tiết Cơ hội.
2. Thêm dòng sản phẩm → chọn từ danh mục → hệ thống tự điền đơn giá niêm yết.
3. Có thể sửa số lượng, đơn giá, % giảm giá.
4. Với dịch vụ thuê bao → nhập thêm số kỳ (billing_cycles).
5. Nhấn **Lưu & Tính lại giá trị cơ hội** → Backend tính `line_total` từng dòng và cập nhật `opportunities.amount`.
6. Giá trị cơ hội trở thành con số có căn cứ từ các dòng sản phẩm.

---

**File hoàn chỉnh này chứa toàn bộ code Backend (Laravel 11 + PHP 8.3) + Frontend (React + TypeScript) cần thiết để implement S5-03.**  
Bạn chỉ cần copy các file tương ứng vào project của team.
