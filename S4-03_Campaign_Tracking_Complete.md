# S4-03 – Theo dõi Lead & Doanh thu theo Chiến dịch (Campaign Tracking)

**User Story:**  
Là Nhân viên Marketing, tôi muốn theo dõi lead theo từng chiến dịch, để đo được chiến dịch nào thực sự ra doanh thu chứ không chỉ ra nhiều lead.

**Acceptance Criteria:**
- Khai báo chiến dịch với ngân sách, thời gian chạy, kênh
- Lead và Cơ hội giữ liên kết tới chiến dịch đã sinh ra chúng
- Xem được số lead, số cơ hội và giá trị đã chốt của từng chiến dịch

**Tech Stack:** React + TypeScript · PHP 8.3 · Laravel 11 · MySQL  
**Tuân thủ 100% Code Convention của dự án CRM**

---

## 1. Database Design (MySQL)

### 1.1. Migration: `create_campaigns_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->decimal('budget', 15, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('channel', 50); // facebook, google, email, zalo, website, offline, other
            $table->string('status', 30)->default('draft'); // draft, active, paused, completed, cancelled
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_id', 'status'], 'idx_campaigns_owner_status');
            $table->index(['start_date', 'end_date'], 'idx_campaigns_dates');
            $table->index('channel', 'idx_campaigns_channel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
```

### 1.2. Migration: Add `campaign_id` to `leads` table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('source')
                ->constrained('campaigns')
                ->nullOnDelete();

            $table->index('campaign_id', 'idx_leads_campaign_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
            $table->dropIndex('idx_leads_campaign_id');
            $table->dropColumn('campaign_id');
        });
    }
};
```

### 1.3. Migration: Add `campaign_id` to `opportunities` table

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
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('lead_id')
                ->constrained('campaigns')
                ->nullOnDelete();

            $table->index('campaign_id', 'idx_opportunities_campaign_id');
        });
    }

    public function down(): void
    {
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
            $table->dropIndex('idx_opportunities_campaign_id');
            $table->dropColumn('campaign_id');
        });
    }
};
```

---

## 2. Backend – Laravel 11 (PHP 8.3)

### 2.1. Enum: `app/Enums/CampaignStatusEnum.php`

```php
<?php

namespace App\Enums;

enum CampaignStatusEnum: string
{
    case DRAFT = 'draft';
    case ACTIVE = 'active';
    case PAUSED = 'paused';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Nháp',
            self::ACTIVE => 'Đang chạy',
            self::PAUSED => 'Tạm dừng',
            self::COMPLETED => 'Hoàn thành',
            self::CANCELLED => 'Đã hủy',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### 2.2. Enum: `app/Enums/CampaignChannelEnum.php`

```php
<?php

namespace App\Enums;

enum CampaignChannelEnum: string
{
    case FACEBOOK = 'facebook';
    case GOOGLE = 'google';
    case EMAIL = 'email';
    case ZALO = 'zalo';
    case WEBSITE = 'website';
    case OFFLINE = 'offline';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::FACEBOOK => 'Facebook Ads',
            self::GOOGLE => 'Google Ads',
            self::EMAIL => 'Email Marketing',
            self::ZALO => 'Zalo OA / Zalo Ads',
            self::WEBSITE => 'Website / SEO',
            self::OFFLINE => 'Offline / Event',
            self::OTHER => 'Khác',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### 2.3. Model: `app/Models/Campaign.php`

```php
<?php

namespace App\Models;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'budget',
        'start_date',
        'end_date',
        'channel',
        'status',
        'owner_id',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'channel' => CampaignChannelEnum::class,
        'status' => CampaignStatusEnum::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class);
    }

    // Local Scopes
    public function scopeDataScope($query, User $user)
    {
        // Data Scope: MY / TEAM / ALL (theo convention)
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => $query,
            'TEAM' => $query->whereIn('owner_id', $user->teamMemberIds()),
            default => $query->where('owner_id', $user->id),
        };
    }

    public function scopeActive($query)
    {
        return $query->where('status', CampaignStatusEnum::ACTIVE);
    }
}
```

### 2.4. Update existing Models

**Lead.php** (thêm quan hệ):

```php
// Trong class Lead
public function campaign(): BelongsTo
{
    return $this->belongsTo(Campaign::class);
}
```

**Opportunity.php** (thêm quan hệ):

```php
// Trong class Opportunity
public function campaign(): BelongsTo
{
    return $this->belongsTo(Campaign::class);
}
```

### 2.5. Form Requests

#### `app/Http/Requests/Campaign/CreateCampaignRequest.php`

```php
<?php

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Campaign::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'channel' => ['required', Rule::in(CampaignChannelEnum::values())],
            'status' => ['sometimes', Rule::in(CampaignStatusEnum::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chiến dịch là bắt buộc.',
            'name.max' => 'Tên chiến dịch không được vượt quá 255 ký tự.',
            'budget.required' => 'Ngân sách là bắt buộc.',
            'budget.min' => 'Ngân sách phải lớn hơn hoặc bằng 0.',
            'start_date.required' => 'Ngày bắt đầu là bắt buộc.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'channel.required' => 'Kênh là bắt buộc.',
            'channel.in' => 'Kênh không hợp lệ.',
        ];
    }
}
```

#### `app/Http/Requests/Campaign/UpdateCampaignRequest.php`

```php
<?php

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('campaign'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999999999.99'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'channel' => ['sometimes', 'required', Rule::in(CampaignChannelEnum::values())],
            'status' => ['sometimes', Rule::in(CampaignStatusEnum::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chiến dịch là bắt buộc.',
            'budget.min' => 'Ngân sách phải lớn hơn hoặc bằng 0.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'channel.in' => 'Kênh không hợp lệ.',
        ];
    }
}
```

### 2.6. API Resource

#### `app/Http/Resources/CampaignResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'budget' => (float) $this->budget,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'channel' => $this->channel?->value,
            'channel_label' => $this->channel?->label(),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'owner_id' => $this->owner_id,
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            // Metrics (chỉ khi load)
            'lead_count' => $this->when(isset($this->lead_count), $this->lead_count),
            'opportunity_count' => $this->when(isset($this->opportunity_count), $this->opportunity_count),
            'closed_value' => $this->when(isset($this->closed_value), (float) $this->closed_value),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

#### `app/Http/Resources/CampaignCollection.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class CampaignCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'current_page' => $this->resource->currentPage(),
                'last_page' => $this->resource->lastPage(),
                'per_page' => $this->resource->perPage(),
                'total' => $this->resource->total(),
            ],
        ];
    }
}
```

### 2.7. Service: `app/Services/CampaignService.php`

```php
<?php

namespace App\Services;

use App\Enums\CampaignStatusEnum;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Campaign::query()
            ->with(['owner:id,name,email'])
            ->withCount(['leads', 'opportunities'])
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won'); // hoặc status = 'won' tùy schema Opportunity
            }], 'amount')
            ->dataScope($user);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['channel'])) {
            $query->where('channel', $filters['channel']);
        }

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        return $query->paginate($perPage);
    }

    public function findById(int $id, User $user): Campaign
    {
        return Campaign::query()
            ->with(['owner:id,name,email'])
            ->withCount(['leads', 'opportunities'])
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won');
            }], 'amount')
            ->dataScope($user)
            ->findOrFail($id);
    }

    public function create(array $data, User $user): Campaign
    {
        return DB::transaction(function () use ($data, $user) {
            $data['owner_id'] = $user->id;
            $data['status'] = $data['status'] ?? CampaignStatusEnum::DRAFT->value;

            return Campaign::create($data);
        });
    }

    public function update(Campaign $campaign, array $data): Campaign
    {
        return DB::transaction(function () use ($campaign, $data) {
            $campaign->update($data);
            return $campaign->fresh();
        });
    }

    public function delete(Campaign $campaign): bool
    {
        return DB::transaction(function () use ($campaign) {
            // Không xóa cứng nếu đã có lead/opportunity (soft delete)
            return $campaign->delete();
        });
    }

    /**
     * Báo cáo chi tiết metrics theo chiến dịch
     */
    public function getPerformanceReport(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Campaign::query()
            ->select('campaigns.*')
            ->withCount('leads')
            ->withCount('opportunities')
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won');
            }], 'amount')
            ->dataScope($user);

        if (!empty($filters['from_date'])) {
            $query->where('start_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '<=', $filters['to_date']);
            });
        }

        return $query->orderByDesc('closed_value')->paginate($filters['per_page'] ?? 20);
    }
}
```

### 2.8. Policy: `app/Policies/CampaignPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\Campaign;
use App\Models\User;

class CampaignPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('campaign.view');
    }

    public function view(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.view')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('campaign.create');
    }

    public function update(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.update')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    public function delete(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.delete')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    private function checkDataScope(User $user, Campaign $campaign): bool
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => true,
            'TEAM' => in_array($campaign->owner_id, $user->teamMemberIds()),
            default => $campaign->owner_id === $user->id,
        };
    }
}
```

### 2.9. Controller: `app/Http/Controllers/Api/V1/CampaignController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\CreateCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignCollection;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(
        private readonly CampaignService $campaignService
    ) {}

    /**
     * GET /api/v1/campaigns
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Campaign::class);

        $campaigns = $this->campaignService->list(
            $request->user(),
            $request->only(['status', 'channel', 'search', 'sort_by', 'sort_order', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignCollection($campaigns),
            'message' => 'Danh sách chiến dịch',
        ]);
    }

    /**
     * GET /api/v1/campaigns/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaignService->findById($id, $request->user());
        $this->authorize('view', $campaign);

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($campaign),
            'message' => 'Chi tiết chiến dịch',
        ]);
    }

    /**
     * POST /api/v1/campaigns
     */
    public function store(CreateCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaignService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($campaign->load('owner')),
            'message' => 'Tạo chiến dịch thành công',
        ], 201);
    }

    /**
     * PATCH /api/v1/campaigns/{id}
     */
    public function update(UpdateCampaignRequest $request, Campaign $campaign): JsonResponse
    {
        $this->authorize('update', $campaign);

        $updated = $this->campaignService->update($campaign, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($updated->load('owner')),
            'message' => 'Cập nhật chiến dịch thành công',
        ]);
    }

    /**
     * DELETE /api/v1/campaigns/{id}
     */
    public function destroy(Campaign $campaign): JsonResponse
    {
        $this->authorize('delete', $campaign);

        $this->campaignService->delete($campaign);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa chiến dịch thành công',
        ]);
    }

    /**
     * GET /api/v1/campaigns/performance
     * Báo cáo hiệu quả chiến dịch (lead, opportunity, closed value)
     */
    public function performance(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Campaign::class);

        $report = $this->campaignService->getPerformanceReport(
            $request->user(),
            $request->only(['from_date', 'to_date', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignCollection($report),
            'message' => 'Báo cáo hiệu quả chiến dịch',
        ]);
    }
}
```

### 2.10. Routes (`routes/api.php`)

```php
// Trong nhóm auth + prefix v1
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Campaigns
    Route::get('campaigns/performance', [CampaignController::class, 'performance']);
    Route::apiResource('campaigns', CampaignController::class);

    // Khi tạo/cập nhật Lead & Opportunity cần hỗ trợ campaign_id
    // (đã có sẵn trong LeadController / OpportunityController, chỉ cần thêm field vào Request)
});
```

### 2.11. Cập nhật Lead / Opportunity Request (ví dụ)

Trong `CreateLeadRequest` và `UpdateLeadRequest` thêm:

```php
'campaign_id' => ['nullable', 'integer', 'exists:campaigns,id'],
```

Tương tự với Opportunity.

---

## 3. Frontend – React + TypeScript

### 3.1. Types: `src/types/campaign.ts`

```typescript
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignChannel = 'facebook' | 'google' | 'email' | 'zalo' | 'website' | 'offline' | 'other';

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  budget: number;
  start_date: string;
  end_date: string | null;
  channel: CampaignChannel;
  channel_label: string;
  status: CampaignStatus;
  status_label: string;
  owner_id: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  lead_count?: number;
  opportunity_count?: number;
  closed_value?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string | null;
  budget: number;
  start_date: string;
  end_date?: string | null;
  channel: CampaignChannel;
  status?: CampaignStatus;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string | null;
  budget?: number;
  start_date?: string;
  end_date?: string | null;
  channel?: CampaignChannel;
  status?: CampaignStatus;
}

export interface CampaignListParams {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CampaignPerformanceParams {
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}
```

### 3.2. Constants: `src/constants/campaign.ts`

```typescript
export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Đang chạy' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

export const CAMPAIGN_CHANNEL_OPTIONS = [
  { value: 'facebook', label: 'Facebook Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'zalo', label: 'Zalo OA / Zalo Ads' },
  { value: 'website', label: 'Website / SEO' },
  { value: 'offline', label: 'Offline / Event' },
  { value: 'other', label: 'Khác' },
] as const;

export const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  active: 'green',
  paused: 'orange',
  completed: 'blue',
  cancelled: 'red',
};
```

### 3.3. API Service: `src/services/campaignService.ts`

```typescript
import api from '../api'; // Axios instance đã cấu hình JWT
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignListParams,
  CampaignPerformanceParams,
} from '../types/campaign';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedData<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const campaignService = {
  async getList(params?: CampaignListParams): Promise<PaginatedData<Campaign>> {
    const response = await api.get<ApiResponse<PaginatedData<Campaign>>>('/api/v1/campaigns', {
      params,
    });
    return response.data.data;
  },

  async getById(id: number): Promise<Campaign> {
    const response = await api.get<ApiResponse<Campaign>>(`/api/v1/campaigns/${id}`);
    return response.data.data;
  },

  async create(payload: CreateCampaignRequest): Promise<Campaign> {
    const response = await api.post<ApiResponse<Campaign>>('/api/v1/campaigns', payload);
    return response.data.data;
  },

  async update(id: number, payload: UpdateCampaignRequest): Promise<Campaign> {
    const response = await api.patch<ApiResponse<Campaign>>(`/api/v1/campaigns/${id}`, payload);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/campaigns/${id}`);
  },

  async getPerformance(params?: CampaignPerformanceParams): Promise<PaginatedData<Campaign>> {
    const response = await api.get<ApiResponse<PaginatedData<Campaign>>>(
      '/api/v1/campaigns/performance',
      { params }
    );
    return response.data.data;
  },
};
```

### 3.4. Hook: `src/hooks/useCampaign.ts`

```typescript
import { useState, useCallback } from 'react';
import { campaignService } from '../services/campaignService';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignListParams,
} from '../types/campaign';

export function useCampaign() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (params?: CampaignListParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignService.getList(params);
      setCampaigns(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (payload: CreateCampaignRequest) => {
    setLoading(true);
    setError(null);
    try {
      const created = await campaignService.create(payload);
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (id: number, payload: UpdateCampaignRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await campaignService.update(id, payload);
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await campaignService.delete(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xóa chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    campaigns,
    meta,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
```

### 3.5. Component: `src/components/campaign/CampaignForm.tsx`

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateCampaignRequest, Campaign } from '../../types/campaign';
import { CAMPAIGN_CHANNEL_OPTIONS, CAMPAIGN_STATUS_OPTIONS } from '../../constants/campaign';

const schema = z.object({
  name: z.string().min(1, 'Tên chiến dịch là bắt buộc').max(255),
  description: z.string().max(2000).optional().nullable(),
  budget: z.number().min(0, 'Ngân sách phải ≥ 0'),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional().nullable(),
  channel: z.enum(['facebook', 'google', 'email', 'zalo', 'website', 'offline', 'other']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  { message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu', path: ['end_date'] }
);

type FormData = z.infer<typeof schema>;

interface CampaignFormProps {
  initialData?: Campaign | null;
  onSubmit: (data: CreateCampaignRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      budget: initialData?.budget ?? 0,
      start_date: initialData?.start_date ?? '',
      end_date: initialData?.end_date ?? '',
      channel: initialData?.channel ?? 'facebook',
      status: initialData?.status ?? 'draft',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || null,
      budget: data.budget,
      start_date: data.start_date,
      end_date: data.end_date || null,
      channel: data.channel,
      status: data.status,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên chiến dịch *</label>
        <input
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Nhập tên chiến dịch"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngân sách (VNĐ) *</label>
          <input
            type="number"
            step="0.01"
            {...register('budget', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kênh *</label>
          <select
            {...register('channel')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {CAMPAIGN_CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
          <input
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
          <input
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {CAMPAIGN_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo chiến dịch'}
        </button>
      </div>
    </form>
  );
};
```

### 3.6. Page: `src/pages/CampaignListPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useCampaign } from '../hooks/useCampaign';
import { CampaignForm } from '../components/campaign/CampaignForm';
import { CAMPAIGN_STATUS_COLOR } from '../constants/campaign';
import type { Campaign, CreateCampaignRequest } from '../types/campaign';

export const CampaignListPage: React.FC = () => {
  const { campaigns, meta, loading, error, fetchCampaigns, createCampaign, deleteCampaign } =
    useCampaign();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCampaigns({ search, per_page: 15 });
  }, [fetchCampaigns, search]);

  const handleCreate = async (data: CreateCampaignRequest) => {
    await createCampaign(data);
    setShowForm(false);
    fetchCampaigns({ search });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa chiến dịch này?')) {
      await deleteCampaign(id);
      fetchCampaigns({ search });
    }
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Chiến dịch</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thêm chiến dịch
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên chiến dịch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Tạo chiến dịch mới</h2>
            <CampaignForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tên chiến dịch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kênh
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ngân sách
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Số Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Số Cơ hội
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Giá trị đã chốt
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && campaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Chưa có chiến dịch nào
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.channel_label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCurrency(campaign.budget)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.start_date}
                    {campaign.end_date ? ` → ${campaign.end_date}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {campaign.lead_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {campaign.opportunity_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-700 font-semibold">
                    {formatCurrency(campaign.closed_value)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${
                        CAMPAIGN_STATUS_COLOR[campaign.status]
                      }-100 text-${CAMPAIGN_STATUS_COLOR[campaign.status]}-800`}
                    >
                      {campaign.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination đơn giản */}
      {meta.last_page > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Trang {meta.current_page} / {meta.last_page} · Tổng {meta.total} chiến dịch
          </span>
        </div>
      )}
    </div>
  );
};
```

### 3.7. Cập nhật Lead & Opportunity Form (ví dụ)

Khi tạo/sửa Lead hoặc Opportunity, thêm field chọn chiến dịch:

```tsx
// Trong form Lead / Opportunity
<select {...register('campaign_id')}>
  <option value="">-- Không gắn chiến dịch --</option>
  {campaigns.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ))}
</select>
```

---

## 4. Git Branch & Commit

**Branch:** `feature/campaign-tracking`  
**Commit message gợi ý:**

```
feat(s4-03): thêm quản lý chiến dịch và theo dõi lead/cơ hội theo campaign

- Thêm bảng campaigns + foreign key campaign_id trên leads & opportunities
- CRUD Campaign với data scope, validation, policy
- API performance report (lead_count, opportunity_count, closed_value)
- Frontend: list + form tạo chiến dịch + hiển thị metrics
```

---

## 5. Checklist Definition of Done (theo Convention)

- [x] Đúng convention đặt tên (camelCase / PascalCase / snake_case)
- [x] Cấu trúc thư mục Frontend & Backend chuẩn
- [x] Validation FormRequest + Zod
- [x] Authorization + Data Scope (MY/TEAM/ALL)
- [x] Soft delete
- [x] API Resource chuẩn `{ success, data, message }`
- [x] Thin Controller – Thick Service
- [x] Migration có index & foreign key đúng chuẩn
- [x] Không hard-code secret
- [x] UI tiếng Việt, loading / empty state
- [x] Metrics: số lead, số cơ hội, giá trị đã chốt

---

**File hoàn chỉnh này chứa toàn bộ code Backend + Frontend cần thiết để implement S4-03.**  
Bạn chỉ cần copy các file tương ứng vào project Laravel 11 + React TS của team.
```
