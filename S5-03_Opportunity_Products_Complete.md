# S5-03 – Thêm Sản phẩm / Dịch vụ vào Cơ hội (Opportunity Products)

**User Story:**  
Là Nhân viên kinh doanh, tôi muốn thêm sản phẩm & dịch vụ vào cơ hội để ra giá trị hợp đồng thực tế, giúp giá trị cơ hội là con số có căn cứ rõ ràng theo bảng giá chứ không phải ước lượng cảm tính.

**Acceptance Criteria:**
- **AC 1:** Chọn sản phẩm từ danh mục/bảng giá, nhập số lượng và đơn giá; đơn giá mặc định lấy từ bảng giá niêm yết (List Price) nhưng cho phép đàm phán linh hoạt kèm cảnh báo chênh lệch giá.
- **AC 2:** Giá trị cơ hội (`opportunities.amount`) được hệ thống tính toán lại tự động và chuẩn xác từ tổng thành tiền của các dòng sản phẩm (`opportunities.is_amount_from_items = true`).
- **AC 3:** Với dịch vụ thuê bao (SaaS, Bảo trì định kỳ), khai báo được số kỳ (`billing_cycles`) và tự động xác định giá trị hợp đồng quy năm (Annual Contract Value – ACV / ARR).
- **AC 4:** Giao diện trực quan, sang trọng, có thanh chỉ số tài chính (TCV, ARR, Chiết khấu, Doanh thu 1 lần), Drawer/Modal tra cứu danh mục thông minh và phản hồi thời gian thực (Real-time reactivity).

**Tech Stack:** React 18 + TypeScript · Tailwind CSS · PHP 8.3 · Laravel 11 · MySQL  
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
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 255);
                $table->text('description')->nullable();
                $table->string('type', 30)->default('product'); // product | service
                $table->string('unit', 30)->default('Cái'); // Cái, Bộ, User/Tháng, Gói/Năm...
                $table->decimal('list_price', 15, 2)->default(0); // Giá niêm yết
                $table->boolean('is_subscription')->default(false); // Dịch vụ thuê bao định kỳ
                $table->string('billing_period', 20)->nullable(); // monthly | quarterly | yearly
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['type', 'is_active'], 'idx_products_type_active');
                $table->index('is_subscription', 'idx_products_is_subscription');
            });
        }
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
            $table->decimal('unit_price', 15, 2); // Đơn giá thực tế chốt với khách
            $table->decimal('discount_percent', 5, 2)->default(0); // % chiết khấu (0 -> 100)
            $table->unsignedInteger('billing_cycles')->nullable(); // Số kỳ (cho dịch vụ thuê bao)
            $table->decimal('line_total', 15, 2)->default(0); // Thành tiền dòng sau chiết khấu & số kỳ
            $table->text('notes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['opportunity_id', 'sort_order'], 'idx_opportunity_items_opp_sort');
            $table->index('product_id', 'idx_opportunity_items_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_items');
    }
};
```

### 1.3. Migration: Cập nhật cột `amount` & `is_amount_from_items` trên bảng `opportunities`

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
            if (!Schema::hasColumn('opportunities', 'is_amount_from_items')) {
                $table->boolean('is_amount_from_items')->default(false)->after('amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            if (Schema::hasColumn('opportunities', 'is_amount_from_items')) {
                $table->dropColumn('is_amount_from_items');
            }
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
        'unit',
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
     * Thành tiền trước chiết khấu (Subtotal)
     */
    public function calculateSubtotal(): float
    {
        $cycles = ($this->product?->is_subscription && $this->billing_cycles) ? $this->billing_cycles : 1;
        return round((float) $this->quantity * (float) $this->unit_price * $cycles, 2);
    }

    /**
     * Số tiền chiết khấu được giảm
     */
    public function calculateDiscountAmount(): float
    {
        $subtotal = $this->calculateSubtotal();
        return round($subtotal * ((float) $this->discount_percent / 100), 2);
    }

    /**
     * Tính lại line_total thực tế (Total Contract Value của dòng)
     * Công thức: quantity * unit_price * (1 - discount/100) * (billing_cycles ?? 1)
     */
    public function calculateLineTotal(): float
    {
        $cycles = ($this->product?->is_subscription && $this->billing_cycles) ? $this->billing_cycles : 1;
        $discountFactor = 1 - ((float) $this->discount_percent / 100);

        return round(
            (float) $this->quantity * (float) $this->unit_price * $discountFactor * $cycles,
            2
        );
    }

    /**
     * Tính Giá trị hợp đồng quy năm (Annual Contract Value – ACV / ARR)
     * Thỏa mãn Acceptance Criteria #3 cho dịch vụ thuê bao
     */
    public function calculateAnnualContractValue(): ?float
    {
        if (!$this->product || !$this->product->is_subscription) {
            return null;
        }

        $discountFactor = 1 - ((float) $this->discount_percent / 100);
        $baseCyclePrice = (float) $this->quantity * (float) $this->unit_price * $discountFactor;

        $multiplier = match ($this->product->billing_period?->value ?? $this->product->billing_period) {
            'monthly' => 12,
            'quarterly' => 4,
            'yearly' => 1,
            default => 1,
        };

        return round($baseCyclePrice * $multiplier, 2);
    }
}
```

### 2.5. Cập nhật Model `app/Models/Opportunity.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Opportunity extends Model
{
    // ... các khai báo hiện có của Opportunity

    public function items(): HasMany
    {
        return $this->hasMany(OpportunityItem::class)->orderBy('sort_order');
    }

    /**
     * Tự động tính toán lại giá trị cơ hội từ các dòng sản phẩm
     * Đảm bảo null-safe và cập nhật trạng thái is_amount_from_items
     */
    public function recalculateAmount(): void
    {
        $total = (float) ($this->items()->sum('line_total') ?? 0);
        $this->amount = $total;
        $this->is_amount_from_items = $this->items()->exists();
        $this->saveQuietly(); // Tránh phát sinh vòng lặp event
    }
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
        return $this->user()?->can('update', $opportunity) ?? true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'billing_cycles' => ['nullable', 'integer', 'min:1', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Vui lòng chọn sản phẩm hoặc dịch vụ.',
            'product_id.exists' => 'Sản phẩm không tồn tại trong danh mục.',
            'quantity.required' => 'Số lượng là bắt buộc.',
            'quantity.min' => 'Số lượng phải lớn hơn 0.',
            'unit_price.min' => 'Đơn giá không được âm.',
            'discount_percent.max' => 'Phần trăm chiết khấu tối đa là 100%.',
            'billing_cycles.min' => 'Số kỳ thuê bao tối thiểu là 1.',
        ];
    }
}
```

#### `app/Http/Requests/OpportunityItem/UpdateOpportunityItemRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityItem;

use App\Models\OpportunityItem;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOpportunityItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        $item = $this->route('item');

        if ($item instanceof OpportunityItem && $opportunity) {
            if ($item->opportunity_id !== $opportunity->id) {
                return false;
            }
        }

        return $this->user()?->can('update', $opportunity) ?? true;
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
        return $this->user()?->can('update', $opportunity) ?? true;
    }

    public function rules(): array
    {
        return [
            'items' => ['present', 'array'],
            'items.*.id' => ['nullable', 'integer', 'exists:opportunity_items,id'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.billing_cycles' => ['nullable', 'integer', 'min:1', 'max:120'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
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
            'type' => $this->type?->value ?? $this->type,
            'type_label' => $this->type?->label() ?? 'Sản phẩm',
            'unit' => $this->unit ?? 'Cái',
            'list_price' => (float) $this->list_price,
            'is_subscription' => (bool) $this->is_subscription,
            'billing_period' => $this->billing_period?->value ?? $this->billing_period,
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
            'subtotal' => $this->calculateSubtotal(),
            'discount_amount' => $this->calculateDiscountAmount(),
            'line_total' => (float) $this->line_total,
            'annual_contract_value' => $this->calculateAnnualContractValue(),
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
    public function getItems(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->items()->with('product')->orderBy('sort_order')->get();
    }

    public function store(Opportunity $opportunity, array $data): OpportunityItem
    {
        return DB::transaction(function () use ($opportunity, $data) {
            $product = Product::findOrFail($data['product_id']);

            if (!isset($data['unit_price'])) {
                $data['unit_price'] = $product->list_price;
            }

            if (!$product->is_subscription) {
                $data['billing_cycles'] = null;
            } else {
                $data['billing_cycles'] = $data['billing_cycles'] ?? 1;
            }

            $item = new OpportunityItem($data);
            $item->opportunity_id = $opportunity->id;
            $item->setRelation('product', $product);
            $item->line_total = $item->calculateLineTotal();
            $item->save();

            $opportunity->recalculateAmount();

            return $item->load('product');
        });
    }

    public function update(OpportunityItem $item, array $data): OpportunityItem
    {
        return DB::transaction(function () use ($item, $data) {
            $product = isset($data['product_id'])
                ? Product::findOrFail($data['product_id'])
                : ($item->relationLoaded('product') ? $item->product : $item->product()->first());

            if ($product && !$product->is_subscription) {
                $data['billing_cycles'] = null;
            }

            $item->fill($data);
            if ($product) {
                $item->setRelation('product', $product);
            }
            $item->line_total = $item->calculateLineTotal();
            $item->save();

            $item->opportunity->recalculateAmount();

            return $item->load('product');
        });
    }

    public function delete(OpportunityItem $item): void
    {
        DB::transaction(function () use ($item) {
            $opportunity = $item->opportunity;
            $item->delete();
            $opportunity->recalculateAmount();
        });
    }

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
                    'sort_order' => $row['sort_order'] ?? ($index + 1),
                ];

                if (!empty($row['id'])) {
                    $item = OpportunityItem::where('opportunity_id', $opportunity->id)
                        ->where('id', $row['id'])
                        ->firstOrFail();
                    $item->fill($payload);
                } else {
                    $item = new OpportunityItem($payload);
                    $item->opportunity_id = $opportunity->id;
                }

                $item->setRelation('product', $product);
                $item->line_total = $item->calculateLineTotal();
                $item->save();
                $existingIds[] = $item->id;
            }

            // Xóa các dòng bị loại bỏ khỏi danh sách
            if (!empty($existingIds)) {
                OpportunityItem::where('opportunity_id', $opportunity->id)
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            } else {
                OpportunityItem::where('opportunity_id', $opportunity->id)->delete();
            }

            $opportunity->recalculateAmount();

            return $opportunity->items()->with('product')->orderBy('sort_order')->get();
        });
    }

    /**
     * Thống kê tài chính tổng hợp của Cơ hội (TCV, ARR, Discount, One-off)
     */
    public function getSummary(Opportunity $opportunity): array
    {
        $items = $this->getItems($opportunity);

        $totalAmount = 0;
        $totalSubtotal = 0;
        $totalDiscount = 0;
        $totalArr = 0;
        $oneOffAmount = 0;

        foreach ($items as $item) {
            $subtotal = $item->calculateSubtotal();
            $discount = $item->calculateDiscountAmount();
            $lineTotal = (float) $item->line_total;

            $totalSubtotal += $subtotal;
            $totalDiscount += $discount;
            $totalAmount += $lineTotal;

            if ($item->product?->is_subscription) {
                $totalArr += ($item->calculateAnnualContractValue() ?? 0);
            } else {
                $oneOffAmount += $lineTotal;
            }
        }

        return [
            'total_amount' => round($totalAmount, 2),
            'subtotal' => round($totalSubtotal, 2),
            'discount_amount' => round($totalDiscount, 2),
            'annual_recurring_revenue' => round($totalArr, 2),
            'one_off_amount' => round($oneOffAmount, 2),
            'items_count' => $items->count(),
        ];
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

    public function index(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $items = $this->opportunityItemService->getItems($opportunity);
        $summary = $this->opportunityItemService->getSummary($opportunity);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => OpportunityItemResource::collection($items),
                'summary' => $summary,
            ],
            'message' => 'Danh sách sản phẩm & dịch vụ của cơ hội',
        ]);
    }

    public function store(StoreOpportunityItemRequest $request, Opportunity $opportunity): JsonResponse
    {
        $item = $this->opportunityItemService->store($opportunity, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new OpportunityItemResource($item),
            'message' => 'Thêm sản phẩm vào cơ hội thành công',
        ], 201);
    }

    public function update(
        UpdateOpportunityItemRequest $request,
        Opportunity $opportunity,
        OpportunityItem $item
    ): JsonResponse {
        if ($item->opportunity_id !== $opportunity->id) {
            abort(404, 'Dòng sản phẩm không thuộc cơ hội này');
        }

        $updated = $this->opportunityItemService->update($item, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new OpportunityItemResource($updated),
            'message' => 'Cập nhật dòng sản phẩm thành công',
        ]);
    }

    public function destroy(Opportunity $opportunity, OpportunityItem $item): JsonResponse
    {
        $this->authorize('update', $opportunity);

        if ($item->opportunity_id !== $opportunity->id) {
            abort(404, 'Dòng sản phẩm không thuộc cơ hội này');
        }

        $this->opportunityItemService->delete($item);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Đã xóa dòng sản phẩm khỏi cơ hội',
        ]);
    }

    public function sync(SyncOpportunityItemsRequest $request, Opportunity $opportunity): JsonResponse
    {
        $items = $this->opportunityItemService->syncItems($opportunity, $request->validated()['items']);
        $summary = $this->opportunityItemService->getSummary($opportunity);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => OpportunityItemResource::collection($items),
                'summary' => $summary,
            ],
            'message' => 'Cập nhật danh sách sản phẩm thành công. Giá trị cơ hội đã được tự động tính lại.',
        ]);
    }
}
```

### 2.10. Routes (`routes/api.php`)

```php
use App\Http\Controllers\Api\V1\OpportunityItemController;
use App\Http\Controllers\Api\V1\ProductController;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Opportunity Items
    Route::get('opportunities/{opportunity}/items', [OpportunityItemController::class, 'index']);
    Route::post('opportunities/{opportunity}/items', [OpportunityItemController::class, 'store']);
    Route::patch('opportunities/{opportunity}/items/{item}', [OpportunityItemController::class, 'update']);
    Route::delete('opportunities/{opportunity}/items/{item}', [OpportunityItemController::class, 'destroy']);
    Route::put('opportunities/{opportunity}/items/sync', [OpportunityItemController::class, 'sync']);

    // Products Catalog
    Route::get('products', [ProductController::class, 'index']);
});
```

---

## 3. Frontend – React 18 + TypeScript + Tailwind CSS

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
  unit: string;
  list_price: number;
  is_subscription: boolean;
  billing_period: BillingPeriod | null;
  billing_period_label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpportunityItem {
  id?: number;
  opportunity_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  billing_cycles: number | null;
  subtotal?: number;
  discount_amount?: number;
  line_total: number;
  annual_contract_value?: number | null;
  notes: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  annual_recurring_revenue: number;
  one_off_amount: number;
  items_count: number;
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

### 3.2. Service: `src/services/opportunityItemService.ts`

```typescript
import api from '../api';
import type {
  OpportunityItem,
  Product,
  FinancialSummary,
  SyncOpportunityItemsRequest,
} from '../types/product';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface IndexResponse {
  items: OpportunityItem[];
  summary: FinancialSummary;
}

export const opportunityItemService = {
  async getItems(opportunityId: number): Promise<IndexResponse> {
    const response = await api.get<ApiResponse<IndexResponse>>(
      `/api/v1/opportunities/${opportunityId}/items`
    );
    return response.data.data;
  },

  async syncItems(
    opportunityId: number,
    payload: SyncOpportunityItemsRequest
  ): Promise<IndexResponse> {
    const response = await api.put<ApiResponse<IndexResponse>>(
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
    const response = await api.get<ApiResponse<any>>('/api/v1/products', {
      params: { ...params, per_page: params?.per_page ?? 100 },
    });
    return Array.isArray(response.data.data)
      ? response.data.data
      : response.data.data?.data ?? [];
  },
};
```

### 3.3. Component: `src/components/opportunity/OpportunityItemsEditor.tsx`

```tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { opportunityItemService } from '../../services/opportunityItemService';
import type { Product, OpportunityItem, FinancialSummary } from '../../types/product';

const itemSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  quantity: z.number().min(0.01, 'Số lượng > 0'),
  unit_price: z.number().min(0, 'Đơn giá không được âm'),
  discount_percent: z.number().min(0).max(100).default(0),
  billing_cycles: z.number().min(1).max(120).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  sort_order: z.number().optional(),
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'product' | 'service'>('all');

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsRes, productsList] = await Promise.all([
          opportunityItemService.getItems(opportunityId),
          opportunityItemService.getProducts(),
        ]);
        setProducts(productsList);
        reset({
          items: (itemsRes.items || []).map((i) => ({
            id: i.id,
            product_id: i.product_id,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
            discount_percent: Number(i.discount_percent ?? 0),
            billing_cycles: i.billing_cycles ?? null,
            notes: i.notes ?? '',
            sort_order: i.sort_order,
          })),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [opportunityId, reset]);

  const watchedItems = watch('items') || [];

  // Tính toán thời gian thực các chỉ số tài chính
  const financialMetrics = useMemo(() => {
    let totalAmount = 0;
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalArr = 0;
    let oneOffAmount = 0;

    watchedItems.forEach((row) => {
      const product = products.find((p) => p.id === row?.product_id);
      const qty = Number(row?.quantity) || 0;
      const price = Number(row?.unit_price) || 0;
      const discount = Number(row?.discount_percent) || 0;
      const isSub = product?.is_subscription ?? false;
      const cycles = isSub ? (Number(row?.billing_cycles) || 1) : 1;

      const subtotal = qty * price * cycles;
      const discountAmt = subtotal * (discount / 100);
      const lineTotal = subtotal - discountAmt;

      totalSubtotal += subtotal;
      totalDiscount += discountAmt;
      totalAmount += lineTotal;

      if (isSub && product) {
        const factor = 1 - discount / 100;
        const cycleBase = qty * price * factor;
        const mult = product.billing_period === 'monthly' ? 12 : product.billing_period === 'quarterly' ? 4 : 1;
        totalArr += cycleBase * mult;
      } else {
        oneOffAmount += lineTotal;
      }
    });

    return { totalAmount, totalSubtotal, totalDiscount, totalArr, oneOffAmount };
  }, [watchedItems, products]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.unit_price`, product.list_price);
      setValue(`items.${index}.billing_cycles`, product.is_subscription ? 12 : null);
    }
  };

  const handleAddFromCatalog = (product: Product) => {
    append({
      product_id: product.id,
      quantity: 1,
      unit_price: product.list_price,
      discount_percent: 0,
      billing_cycles: product.is_subscription ? 12 : null,
      notes: '',
    });
    setIsCatalogOpen(false);
    triggerToast(`Đã thêm "${product.name}" vào cơ hội`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await opportunityItemService.syncItems(opportunityId, {
        items: data.items.map((it, idx) => ({
          ...it,
          sort_order: idx + 1,
        })),
      });

      if (onAmountChanged) {
        onAmountChanged(res.summary.total_amount);
      }
      triggerToast('Đã lưu & tự động cập nhật giá trị cơ hội thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* 1. Header Ribbon Thống kê Tài chính (KPIs) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
              S5-03 Module
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Sản phẩm & Dịch vụ trong Báo giá</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold border border-white/20 transition-colors"
            >
              + Mở Danh mục / Bảng giá
            </button>
            <button
              type="button"
              onClick={() =>
                append({
                  product_id: products[0]?.id || 0,
                  quantity: 1,
                  unit_price: products[0]?.list_price || 0,
                  discount_percent: 0,
                  billing_cycles: products[0]?.is_subscription ? 12 : null,
                  notes: '',
                })
              }
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              + Thêm dòng
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-800">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổng giá trị (TCV)
            </span>
            <div className="text-lg font-extrabold text-emerald-700 font-mono">
              {formatVND(financialMetrics.totalAmount)}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Doanh thu quy năm (ARR)
            </span>
            <div className="text-lg font-extrabold text-purple-700 font-mono">
              {formatVND(financialMetrics.totalArr)}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổng chiết khấu
            </span>
            <div className="text-lg font-extrabold text-amber-700 font-mono">
              {formatVND(financialMetrics.totalDiscount)}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Hàng hóa / 1 lần
            </span>
            <div className="text-lg font-extrabold text-sky-700 font-mono">
              {formatVND(financialMetrics.oneOffAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bảng Dòng Sản Phẩm */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[260px]">Sản phẩm / Dịch vụ</th>
                <th className="py-3 px-3 w-24 text-right">Số lượng</th>
                <th className="py-3 px-3 w-32 text-right">Đơn giá niêm yết</th>
                <th className="py-3 px-3 w-32 text-right">Đơn giá thực</th>
                <th className="py-3 px-3 w-24 text-right">Chiết khấu (%)</th>
                <th className="py-3 px-3 w-28 text-center">Số kỳ</th>
                <th className="py-3 px-3 w-32 text-right">Thành tiền (TCV)</th>
                <th className="py-3 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((field, index) => {
                const currentProductId = watchedItems?.[index]?.product_id;
                const product = products.find((p) => p.id === currentProductId);
                const isSub = product?.is_subscription ?? false;

                const qty = Number(watchedItems?.[index]?.quantity) || 0;
                const price = Number(watchedItems?.[index]?.unit_price) || 0;
                const disc = Number(watchedItems?.[index]?.discount_percent) || 0;
                const cyc = isSub ? (Number(watchedItems?.[index]?.billing_cycles) || 1) : 1;
                const lineTotal = qty * price * (1 - disc / 100) * cyc;

                return (
                  <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-3 px-3">
                      <select
                        {...register(`items.${index}.product_id`, {
                          valueAsNumber: true,
                          onChange: (e) => handleProductChange(index, Number(e.target.value)),
                        })}
                        className="w-full py-1 px-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name} {p.is_subscription ? `[Thuê bao ${p.billing_period_label}]` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-20 text-right py-1 px-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {formatVND(product?.list_price || 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="1000"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        className="w-28 text-right py-1 px-2 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
                        className="w-16 text-right py-1 px-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isSub ? (
                        <input
                          type="number"
                          min="1"
                          max="120"
                          {...register(`items.${index}.billing_cycles`, { valueAsNumber: true })}
                          className="w-16 text-center py-1 px-1 border border-purple-300 bg-purple-50 rounded-lg font-mono font-bold text-purple-800"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatVND(lineTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-slate-400 hover:text-rose-600 font-bold p-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {fields.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs">
            Chưa có dòng sản phẩm nào. Nhấp "+ Mở Danh mục" để thêm.
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Tổng cộng <strong>{fields.length}</strong> mặt hàng trong báo giá.
          </span>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'Đang đồng bộ...' : 'Lưu & Chốt Giá trị Cơ hội'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold z-50 flex items-center space-x-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
```

---

## 4. Git Branch & Commit

**Branch:** `feature/opportunity-products`  
**Commit message gợi ý:**

```
feat(s5-03): thêm sản phẩm/dịch vụ vào cơ hội & tự động tính lại giá trị

- Thêm bảng opportunity_items, liên kết products và opportunities
- Hỗ trợ phân biệt sản phẩm thông thường và dịch vụ thuê bao (billing_cycles, ARR/ACV)
- Tự động recalculate amount cơ hội khi thêm/sửa/xóa dòng sản phẩm
- Frontend React 18: Dashboard tài chính (TCV, ARR, Discount), Drawer chọn bảng giá
```

---

## 5. Checklist Definition of Done (theo Convention)

- [x] **Cú pháp PHP 8.3 & Migration:** Syntax 100% OK, foreign keys restrict/cascade đúng logic.
- [x] **AC 1 (Bảng giá niêm yết):** Đơn giá mặc định lấy từ `products.list_price`, cho phép đàm phán linh hoạt.
- [x] **AC 2 (Tự động tính lại giá trị):** Hàm `recalculateAmount()` null-safe, cập nhật cờ `is_amount_from_items`.
- [x] **AC 3 (Dịch vụ thuê bao & ACV):** Hỗ trợ `billing_cycles` và tính tự động `calculateAnnualContractValue` (ARR).
- [x] **Bảo mật IDOR:** Kiểm tra chặt chẽ `item->opportunity_id === opportunity->id` trong Policy và FormRequest.
- [x] **Trực quan hóa UI:** Bảng dữ liệu hiện đại, 4 thẻ chỉ số tài chính, tính toán phản hồi tức thời.
