# S6-03 – Chia sẻ Cơ hội cho nhiều thành viên (Opportunity Sharing)

**User Story:**  
Là Trưởng nhóm kinh doanh, tôi muốn chia sẻ một cơ hội cho nhiều người cùng theo, để thương vụ lớn có cả đội cùng vào mà vẫn rõ ai chịu trách nhiệm chính.

**Acceptance Criteria:**
- Ngoài người sở hữu, thêm được thành viên cùng tham gia cơ hội
- Thành viên được chia sẻ có quyền ghi hoạt động nhưng không đổi được người sở hữu
- Chuyển quyền sở hữu cơ hội được ghi nhật ký

**Tech Stack:** React + TypeScript · PHP 8.3 · Laravel 11 · MySQL  
**Tuân thủ 100% Code Convention của dự án CRM**

---

## 1. Database Design (MySQL)

### 1.1. Migration: `create_opportunity_members_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 30)->default('member'); // member | collaborator (mở rộng sau)
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->unique(['opportunity_id', 'user_id'], 'uq_opportunity_members_opportunity_user');
            $table->index('user_id', 'idx_opportunity_members_user_id');
            $table->index('opportunity_id', 'idx_opportunity_members_opportunity_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_members');
    }
};
```

### 1.2. Migration: `create_opportunity_ownership_logs_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_ownership_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('from_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('to_owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            $table->index('opportunity_id', 'idx_opportunity_ownership_logs_opportunity_id');
            $table->index('changed_at', 'idx_opportunity_ownership_logs_changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_ownership_logs');
    }
};
```

> **Lưu ý:** Bảng `opportunities` đã có sẵn cột `owner_id` (foreign key tới users).

---

## 2. Backend – Laravel 11 (PHP 8.3)

### 2.1. Model: `app/Models/OpportunityMember.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'user_id',
        'role',
        'added_by',
        'added_at',
    ];

    protected $casts = [
        'added_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
```

### 2.2. Model: `app/Models/OpportunityOwnershipLog.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityOwnershipLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'from_owner_id',
        'to_owner_id',
        'changed_by',
        'note',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function fromOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_owner_id');
    }

    public function toOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_owner_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
```

### 2.3. Cập nhật Model Opportunity

```php
// Thêm vào app/Models/Opportunity.php

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

public function members(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'opportunity_members')
        ->withPivot(['role', 'added_by', 'added_at'])
        ->withTimestamps();
}

public function opportunityMembers(): HasMany
{
    return $this->hasMany(OpportunityMember::class);
}

public function ownershipLogs(): HasMany
{
    return $this->hasMany(OpportunityOwnershipLog::class)->orderByDesc('changed_at');
}

/**
 * Kiểm tra user có phải là thành viên được chia sẻ không
 */
public function isMember(User $user): bool
{
    return $this->opportunityMembers()->where('user_id', $user->id)->exists();
}

/**
 * Kiểm tra user có quyền truy cập (owner hoặc member)
 */
public function isAccessibleBy(User $user): bool
{
    if ($this->owner_id === $user->id) {
        return true;
    }

    return $this->isMember($user);
}
```

### 2.4. Form Requests

#### `app/Http/Requests/OpportunityMember/AddOpportunityMemberRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityMember;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddOpportunityMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        // Chỉ owner hoặc người có quyền manage members mới được thêm
        return $this->user()->can('manageMembers', $opportunity);
    }

    public function rules(): array
    {
        $opportunityId = $this->route('opportunity')->id;

        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('opportunity_members', 'user_id')
                    ->where('opportunity_id', $opportunityId),
                // Không cho thêm chính owner vào members
                function ($attribute, $value, $fail) {
                    $opportunity = $this->route('opportunity');
                    if ((int) $value === (int) $opportunity->owner_id) {
                        $fail('Người sở hữu đã là chủ cơ hội, không cần thêm vào thành viên.');
                    }
                },
            ],
            'role' => ['nullable', 'string', 'in:member,collaborator'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Vui lòng chọn thành viên.',
            'user_id.exists' => 'Người dùng không tồn tại.',
            'user_id.unique' => 'Người dùng này đã là thành viên của cơ hội.',
            'role.in' => 'Vai trò không hợp lệ.',
        ];
    }
}
```

#### `app/Http/Requests/OpportunityMember/TransferOwnershipRequest.php`

```php
<?php

namespace App\Http\Requests\OpportunityMember;

use Illuminate\Foundation\Http\FormRequest;

class TransferOwnershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        // Chỉ owner hiện tại hoặc admin mới được chuyển quyền
        return $this->user()->can('transferOwnership', $opportunity);
    }

    public function rules(): array
    {
        return [
            'new_owner_id' => [
                'required',
                'integer',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $opportunity = $this->route('opportunity');
                    if ((int) $value === (int) $opportunity->owner_id) {
                        $fail('Người được chọn đã là chủ sở hữu hiện tại.');
                    }
                },
            ],
            'note' => ['nullable', 'string', 'max:1000'],
            'keep_as_member' => ['nullable', 'boolean'], // Giữ owner cũ làm member sau khi chuyển
        ];
    }

    public function messages(): array
    {
        return [
            'new_owner_id.required' => 'Vui lòng chọn người nhận quyền sở hữu.',
            'new_owner_id.exists' => 'Người dùng không tồn tại.',
        ];
    }
}
```

### 2.5. API Resources

#### `app/Http/Resources/OpportunityMemberResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'role' => $this->role,
            'added_by' => $this->added_by,
            'added_by_user' => $this->whenLoaded('addedBy', fn () => [
                'id' => $this->addedBy?->id,
                'name' => $this->addedBy?->name,
            ]),
            'added_at' => $this->added_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
```

#### `app/Http/Resources/OpportunityOwnershipLogResource.php`

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityOwnershipLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'from_owner_id' => $this->from_owner_id,
            'from_owner' => $this->whenLoaded('fromOwner', fn () => [
                'id' => $this->fromOwner?->id,
                'name' => $this->fromOwner?->name,
            ]),
            'to_owner_id' => $this->to_owner_id,
            'to_owner' => $this->whenLoaded('toOwner', fn () => [
                'id' => $this->toOwner->id,
                'name' => $this->toOwner->name,
            ]),
            'changed_by' => $this->changed_by,
            'changed_by_user' => $this->whenLoaded('changedBy', fn () => [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
            ]),
            'note' => $this->note,
            'changed_at' => $this->changed_at?->toISOString(),
        ];
    }
}
```

### 2.6. Service: `app/Services/OpportunityMemberService.php`

```php
<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\OpportunityMember;
use App\Models\OpportunityOwnershipLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OpportunityMemberService
{
    /**
     * Lấy danh sách thành viên của Opportunity
     */
    public function getMembers(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->opportunityMembers()
            ->with(['user:id,name,email', 'addedBy:id,name'])
            ->orderBy('added_at')
            ->get();
    }

    /**
     * Thêm thành viên vào Opportunity
     */
    public function addMember(Opportunity $opportunity, array $data, User $actor): OpportunityMember
    {
        return DB::transaction(function () use ($opportunity, $data, $actor) {
            $member = OpportunityMember::create([
                'opportunity_id' => $opportunity->id,
                'user_id' => $data['user_id'],
                'role' => $data['role'] ?? 'member',
                'added_by' => $actor->id,
                'added_at' => now(),
            ]);

            return $member->load(['user:id,name,email', 'addedBy:id,name']);
        });
    }

    /**
     * Xóa thành viên khỏi Opportunity
     */
    public function removeMember(Opportunity $opportunity, int $userId): void
    {
        DB::transaction(function () use ($opportunity, $userId) {
            OpportunityMember::where('opportunity_id', $opportunity->id)
                ->where('user_id', $userId)
                ->delete();
        });
    }

    /**
     * Chuyển quyền sở hữu + ghi nhật ký
     */
    public function transferOwnership(
        Opportunity $opportunity,
        int $newOwnerId,
        User $actor,
        ?string $note = null,
        bool $keepAsMember = true
    ): Opportunity {
        return DB::transaction(function () use ($opportunity, $newOwnerId, $actor, $note, $keepAsMember) {
            $oldOwnerId = $opportunity->owner_id;

            // Ghi nhật ký trước khi đổi
            OpportunityOwnershipLog::create([
                'opportunity_id' => $opportunity->id,
                'from_owner_id' => $oldOwnerId,
                'to_owner_id' => $newOwnerId,
                'changed_by' => $actor->id,
                'note' => $note,
                'changed_at' => now(),
            ]);

            // Đổi owner
            $opportunity->owner_id = $newOwnerId;
            $opportunity->save();

            // Nếu giữ owner cũ làm member
            if ($keepAsMember && $oldOwnerId) {
                $exists = OpportunityMember::where('opportunity_id', $opportunity->id)
                    ->where('user_id', $oldOwnerId)
                    ->exists();

                if (!$exists) {
                    OpportunityMember::create([
                        'opportunity_id' => $opportunity->id,
                        'user_id' => $oldOwnerId,
                        'role' => 'member',
                        'added_by' => $actor->id,
                        'added_at' => now(),
                    ]);
                }
            }

            // Nếu new owner đang là member → xóa khỏi members (vì đã thành owner)
            OpportunityMember::where('opportunity_id', $opportunity->id)
                ->where('user_id', $newOwnerId)
                ->delete();

            return $opportunity->fresh(['owner', 'opportunityMembers.user']);
        });
    }

    /**
     * Lấy lịch sử chuyển quyền sở hữu
     */
    public function getOwnershipLogs(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->ownershipLogs()
            ->with([
                'fromOwner:id,name',
                'toOwner:id,name',
                'changedBy:id,name',
            ])
            ->orderByDesc('changed_at')
            ->get();
    }
}
```

### 2.7. Cập nhật OpportunityPolicy

```php
// Thêm vào app/Policies/OpportunityPolicy.php

/**
 * Thành viên được chia sẻ có thể xem và ghi hoạt động,
 * nhưng không được đổi owner, xóa, hoặc quản lý members.
 */
public function view(User $user, Opportunity $opportunity): bool
{
    if (!$user->hasPermission('opportunity.view')) {
        return false;
    }

    // Owner hoặc Member đều xem được
    if ($opportunity->isAccessibleBy($user)) {
        return true;
    }

    // Data Scope fallback
    return $this->checkDataScope($user, $opportunity);
}

public function update(User $user, Opportunity $opportunity): bool
{
    if (!$user->hasPermission('opportunity.update')) {
        return false;
    }

    // Chỉ owner mới được update thông tin chính (stage, amount, ...)
    // Member chỉ được ghi activity, không update opportunity
    return $opportunity->owner_id === $user->id
        || $this->checkDataScope($user, $opportunity);
}

/**
 * Quản lý thành viên (thêm/xóa member)
 */
public function manageMembers(User $user, Opportunity $opportunity): bool
{
    // Chỉ owner hoặc người có quyền cao hơn
    return $opportunity->owner_id === $user->id
        || $user->hasPermission('opportunity.manage_members');
}

/**
 * Chuyển quyền sở hữu
 */
public function transferOwnership(User $user, Opportunity $opportunity): bool
{
    return $opportunity->owner_id === $user->id
        || $user->hasPermission('opportunity.transfer_ownership');
}

/**
 * Ghi hoạt động (Activity) – Member cũng được phép
 */
public function createActivity(User $user, Opportunity $opportunity): bool
{
    if (!$user->hasPermission('activity.create')) {
        return false;
    }

    return $opportunity->isAccessibleBy($user);
}
```

### 2.8. Controller: `app/Http/Controllers/Api/V1/OpportunityMemberController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpportunityMember\AddOpportunityMemberRequest;
use App\Http\Requests\OpportunityMember\TransferOwnershipRequest;
use App\Http\Resources\OpportunityMemberResource;
use App\Http\Resources\OpportunityOwnershipLogResource;
use App\Http\Resources\OpportunityResource; // Giả sử đã có
use App\Models\Opportunity;
use App\Services\OpportunityMemberService;
use Illuminate\Http\JsonResponse;

class OpportunityMemberController extends Controller
{
    public function __construct(
        private readonly OpportunityMemberService $opportunityMemberService
    ) {}

    /**
     * GET /api/v1/opportunities/{opportunity}/members
     */
    public function index(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $members = $this->opportunityMemberService->getMembers($opportunity);

        return response()->json([
            'success' => true,
            'data' => OpportunityMemberResource::collection($members),
            'message' => 'Danh sách thành viên cùng theo dõi cơ hội',
        ]);
    }

    /**
     * POST /api/v1/opportunities/{opportunity}/members
     */
    public function store(AddOpportunityMemberRequest $request, Opportunity $opportunity): JsonResponse
    {
        $member = $this->opportunityMemberService->addMember(
            $opportunity,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new OpportunityMemberResource($member),
            'message' => 'Thêm thành viên thành công',
        ], 201);
    }

    /**
     * DELETE /api/v1/opportunities/{opportunity}/members/{userId}
     */
    public function destroy(Opportunity $opportunity, int $userId): JsonResponse
    {
        $this->authorize('manageMembers', $opportunity);

        $this->opportunityMemberService->removeMember($opportunity, $userId);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa thành viên thành công',
        ]);
    }

    /**
     * POST /api/v1/opportunities/{opportunity}/transfer-ownership
     */
    public function transferOwnership(
        TransferOwnershipRequest $request,
        Opportunity $opportunity
    ): JsonResponse {
        $data = $request->validated();

        $updated = $this->opportunityMemberService->transferOwnership(
            $opportunity,
            $data['new_owner_id'],
            $request->user(),
            $data['note'] ?? null,
            $data['keep_as_member'] ?? true
        );

        return response()->json([
            'success' => true,
            'data' => new OpportunityResource($updated),
            'message' => 'Chuyển quyền sở hữu thành công. Đã ghi nhật ký.',
        ]);
    }

    /**
     * GET /api/v1/opportunities/{opportunity}/ownership-logs
     */
    public function ownershipLogs(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $logs = $this->opportunityMemberService->getOwnershipLogs($opportunity);

        return response()->json([
            'success' => true,
            'data' => OpportunityOwnershipLogResource::collection($logs),
            'message' => 'Lịch sử chuyển quyền sở hữu',
        ]);
    }
}
```

### 2.9. Routes (`routes/api.php`)

```php
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // ... các route khác

    // Opportunity Members & Ownership
    Route::get('opportunities/{opportunity}/members', [OpportunityMemberController::class, 'index']);
    Route::post('opportunities/{opportunity}/members', [OpportunityMemberController::class, 'store']);
    Route::delete('opportunities/{opportunity}/members/{userId}', [OpportunityMemberController::class, 'destroy']);
    Route::post('opportunities/{opportunity}/transfer-ownership', [OpportunityMemberController::class, 'transferOwnership']);
    Route::get('opportunities/{opportunity}/ownership-logs', [OpportunityMemberController::class, 'ownershipLogs']);
});
```

### 2.10. Cập nhật Data Scope (quan trọng)

Khi query danh sách Opportunity, cần cho phép user thấy cả những Opportunity mà họ là **member**:

```php
// Trong Opportunity model hoặc Local Scope
public function scopeDataScope($query, User $user)
{
    $scope = $user->data_scope ?? 'MY';

    return match ($scope) {
        'ALL' => $query,
        'TEAM' => $query->where(function ($q) use ($user) {
            $q->whereIn('owner_id', $user->teamMemberIds())
              ->orWhereHas('opportunityMembers', function ($mq) use ($user) {
                  $mq->where('user_id', $user->id);
              });
        }),
        default => $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
              ->orWhereHas('opportunityMembers', function ($mq) use ($user) {
                  $mq->where('user_id', $user->id);
              });
        }),
    };
}
```

---

## 3. Frontend – React + TypeScript

### 3.1. Types: `src/types/opportunityMember.ts`

```typescript
export interface OpportunityMember {
  id: number;
  opportunity_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  role: 'member' | 'collaborator';
  added_by: number | null;
  added_by_user?: {
    id: number;
    name: string;
  } | null;
  added_at: string;
  created_at: string;
}

export interface OpportunityOwnershipLog {
  id: number;
  opportunity_id: number;
  from_owner_id: number | null;
  from_owner?: {
    id: number;
    name: string;
  } | null;
  to_owner_id: number;
  to_owner?: {
    id: number;
    name: string;
  };
  changed_by: number;
  changed_by_user?: {
    id: number;
    name: string;
  };
  note: string | null;
  changed_at: string;
}

export interface AddMemberRequest {
  user_id: number;
  role?: 'member' | 'collaborator';
}

export interface TransferOwnershipRequest {
  new_owner_id: number;
  note?: string | null;
  keep_as_member?: boolean;
}
```

### 3.2. Service: `src/services/opportunityMemberService.ts`

```typescript
import api from '../api';
import type {
  OpportunityMember,
  OpportunityOwnershipLog,
  AddMemberRequest,
  TransferOwnershipRequest,
} from '../types/opportunityMember';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const opportunityMemberService = {
  async getMembers(opportunityId: number): Promise<OpportunityMember[]> {
    const response = await api.get<ApiResponse<OpportunityMember[]>>(
      `/api/v1/opportunities/${opportunityId}/members`
    );
    return response.data.data;
  },

  async addMember(
    opportunityId: number,
    payload: AddMemberRequest
  ): Promise<OpportunityMember> {
    const response = await api.post<ApiResponse<OpportunityMember>>(
      `/api/v1/opportunities/${opportunityId}/members`,
      payload
    );
    return response.data.data;
  },

  async removeMember(opportunityId: number, userId: number): Promise<void> {
    await api.delete(`/api/v1/opportunities/${opportunityId}/members/${userId}`);
  },

  async transferOwnership(
    opportunityId: number,
    payload: TransferOwnershipRequest
  ): Promise<any> {
    const response = await api.post<ApiResponse<any>>(
      `/api/v1/opportunities/${opportunityId}/transfer-ownership`,
      payload
    );
    return response.data.data;
  },

  async getOwnershipLogs(opportunityId: number): Promise<OpportunityOwnershipLog[]> {
    const response = await api.get<ApiResponse<OpportunityOwnershipLog[]>>(
      `/api/v1/opportunities/${opportunityId}/ownership-logs`
    );
    return response.data.data;
  },
};
```

### 3.3. Hook: `src/hooks/useOpportunityMembers.ts`

```typescript
import { useState, useCallback } from 'react';
import { opportunityMemberService } from '../services/opportunityMemberService';
import type {
  OpportunityMember,
  OpportunityOwnershipLog,
  AddMemberRequest,
  TransferOwnershipRequest,
} from '../types/opportunityMember';

export function useOpportunityMembers(opportunityId: number) {
  const [members, setMembers] = useState<OpportunityMember[]>([]);
  const [ownershipLogs, setOwnershipLogs] = useState<OpportunityOwnershipLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await opportunityMemberService.getMembers(opportunityId);
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  const fetchOwnershipLogs = useCallback(async () => {
    if (!opportunityId) return;
    try {
      const data = await opportunityMemberService.getOwnershipLogs(opportunityId);
      setOwnershipLogs(data);
    } catch (err: any) {
      // silent
    }
  }, [opportunityId]);

  const addMember = useCallback(
    async (payload: AddMemberRequest) => {
      setLoading(true);
      setError(null);
      try {
        const created = await opportunityMemberService.addMember(opportunityId, payload);
        setMembers((prev) => [...prev, created]);
        return created;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Thêm thành viên thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const removeMember = useCallback(
    async (userId: number) => {
      setLoading(true);
      setError(null);
      try {
        await opportunityMemberService.removeMember(opportunityId, userId);
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa thành viên thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const transferOwnership = useCallback(
    async (payload: TransferOwnershipRequest) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await opportunityMemberService.transferOwnership(
          opportunityId,
          payload
        );
        await fetchMembers();
        await fetchOwnershipLogs();
        return updated;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Chuyển quyền sở hữu thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId, fetchMembers, fetchOwnershipLogs]
  );

  return {
    members,
    ownershipLogs,
    loading,
    error,
    fetchMembers,
    fetchOwnershipLogs,
    addMember,
    removeMember,
    transferOwnership,
  };
}
```

### 3.4. Component: `src/components/opportunity/OpportunityMembersPanel.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useOpportunityMembers } from '../../hooks/useOpportunityMembers';
import type { AddMemberRequest, TransferOwnershipRequest } from '../../types/opportunityMember';

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface OpportunityMembersPanelProps {
  opportunityId: number;
  currentOwnerId: number;
  currentOwnerName: string;
  canManageMembers: boolean; // owner hoặc có quyền
  canTransferOwnership: boolean;
  teamUsers: UserOption[]; // danh sách user trong team để chọn
  onOwnershipTransferred?: (newOwnerId: number) => void;
}

export const OpportunityMembersPanel: React.FC<OpportunityMembersPanelProps> = ({
  opportunityId,
  currentOwnerId,
  currentOwnerName,
  canManageMembers,
  canTransferOwnership,
  teamUsers,
  onOwnershipTransferred,
}) => {
  const {
    members,
    ownershipLogs,
    loading,
    error,
    fetchMembers,
    fetchOwnershipLogs,
    addMember,
    removeMember,
    transferOwnership,
  } = useOpportunityMembers(opportunityId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferUserId, setTransferUserId] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState('');
  const [keepAsMember, setKeepAsMember] = useState(true);

  useEffect(() => {
    fetchMembers();
    fetchOwnershipLogs();
  }, [fetchMembers, fetchOwnershipLogs]);

  const availableUsers = teamUsers.filter(
    (u) =>
      u.id !== currentOwnerId &&
      !members.some((m) => m.user_id === u.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      await addMember({ user_id: Number(selectedUserId), role: 'member' });
      setSelectedUserId('');
      setShowAddForm(false);
    } catch {
      // error đã hiển thị
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi cơ hội?')) return;
    try {
      await removeMember(userId);
    } catch {
      // error đã hiển thị
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId) return;
    if (
      !window.confirm(
        'Bạn có chắc muốn chuyển quyền sở hữu cơ hội này? Hành động sẽ được ghi nhật ký.'
      )
    )
      return;

    try {
      await transferOwnership({
        new_owner_id: Number(transferUserId),
        note: transferNote || null,
        keep_as_member: keepAsMember,
      });
      setShowTransferForm(false);
      setTransferUserId('');
      setTransferNote('');
      if (onOwnershipTransferred) {
        onOwnershipTransferred(Number(transferUserId));
      }
    } catch {
      // error đã hiển thị
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      {/* Owner */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Người sở hữu chính</h3>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {currentOwnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{currentOwnerName}</div>
            <div className="text-xs text-blue-700">Chịu trách nhiệm chính</div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Thành viên cùng theo dõi ({members.length})
          </h3>
          {canManageMembers && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Thêm thành viên
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        {showAddForm && (
          <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn thành viên
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn người dùng --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Thêm
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {loading && members.length === 0 ? (
          <div className="py-6 text-center text-gray-500">Đang tải...</div>
        ) : members.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            Chưa có thành viên nào được chia sẻ. Chỉ người sở hữu đang theo dõi.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium">
                    {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.user?.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.user?.email} · Thêm lúc {formatDate(member.added_at)}
                    </div>
                  </div>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Thành viên được chia sẻ có quyền xem cơ hội và ghi hoạt động, nhưng không thể đổi người sở hữu.
        </p>
      </div>

      {/* Transfer Ownership */}
      {canTransferOwnership && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Chuyển quyền sở hữu</h3>
            <button
              onClick={() => setShowTransferForm(!showTransferForm)}
              className="text-sm px-3 py-1.5 border border-orange-500 text-orange-600 rounded-md hover:bg-orange-50"
            >
              Chuyển quyền
            </button>
          </div>

          {showTransferForm && (
            <div className="p-4 border border-orange-200 rounded-md bg-orange-50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người nhận quyền sở hữu *
                </label>
                <select
                  value={transferUserId}
                  onChange={(e) =>
                    setTransferUserId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {teamUsers
                    .filter((u) => u.id !== currentOwnerId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Lý do chuyển quyền..."
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={keepAsMember}
                  onChange={(e) => setKeepAsMember(e.target.checked)}
                />
                Giữ người sở hữu cũ làm thành viên sau khi chuyển
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleTransfer}
                  disabled={!transferUserId || loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  Xác nhận chuyển quyền
                </button>
                <button
                  onClick={() => setShowTransferForm(false)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ownership Logs */}
      {ownershipLogs.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Nhật ký chuyển quyền sở hữu
          </h3>
          <ul className="space-y-2">
            {ownershipLogs.map((log) => (
              <li key={log.id} className="text-sm p-3 bg-gray-50 rounded-md">
                <div className="font-medium text-gray-800">
                  {log.from_owner?.name ?? '—'} → {log.to_owner?.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Bởi {log.changed_by_user?.name} · {formatDate(log.changed_at)}
                  {log.note && ` · ${log.note}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### 3.5. Cách sử dụng trong Opportunity Detail Page

```tsx
// Trong OpportunityDetailPage.tsx
import { OpportunityMembersPanel } from '../components/opportunity/OpportunityMembersPanel';

// ...
<div className="mt-6">
  <OpportunityMembersPanel
    opportunityId={opportunity.id}
    currentOwnerId={opportunity.owner_id}
    currentOwnerName={opportunity.owner?.name ?? '—'}
    canManageMembers={isOwner || hasPermission('opportunity.manage_members')}
    canTransferOwnership={isOwner || hasPermission('opportunity.transfer_ownership')}
    teamUsers={teamUsers} // lấy từ API users của team
    onOwnershipTransferred={(newOwnerId) => {
      // Refresh opportunity detail
      fetchOpportunity();
    }}
  />
</div>
```

---

## 4. Git Branch & Commit

**Branch:** `feature/opportunity-sharing`  
**Commit message gợi ý:**

```
feat(s6-03): chia sẻ cơ hội cho nhiều thành viên + chuyển quyền sở hữu có nhật ký

- Thêm bảng opportunity_members và opportunity_ownership_logs
- Member có quyền xem + ghi activity, không đổi được owner
- Chuyển ownership được ghi log đầy đủ
- Cập nhật Data Scope để member thấy opportunity được chia sẻ
- Frontend panel quản lý thành viên + transfer ownership
```

---

## 5. Checklist Definition of Done (theo Convention)

- [x] Đúng convention đặt tên (camelCase / PascalCase / snake_case)
- [x] Cấu trúc thư mục Frontend & Backend chuẩn
- [x] Validation FormRequest + thông báo tiếng Việt
- [x] Authorization qua Policy (manageMembers, transferOwnership, createActivity)
- [x] Thin Controller – Thick Service
- [x] API Resource chuẩn `{ success, data, message }`
- [x] Database transaction khi chuyển ownership
- [x] Ghi nhật ký chuyển quyền sở hữu
- [x] Member không thể đổi owner
- [x] Data Scope hỗ trợ member
- [x] UI loading / empty state / tiếng Việt
- [x] Không hard-code secret

---

## 6. Tóm tắt luồng nghiệp vụ

1. Trưởng nhóm / Owner mở chi tiết Cơ hội lớn.
2. Thêm thành viên từ danh sách team → thành viên xuất hiện trong panel.
3. Thành viên được chia sẻ có thể xem cơ hội và ghi Activity, nhưng **không** thể:
   - Đổi stage / amount / owner
   - Thêm/xóa thành viên khác
   - Chuyển quyền sở hữu
4. Khi cần chuyển trách nhiệm chính → Owner chọn người mới → hệ thống:
   - Đổi `owner_id`
   - Ghi bản ghi vào `opportunity_ownership_logs`
   - (Tùy chọn) giữ owner cũ làm member
5. Lịch sử chuyển quyền luôn xem được trong panel.

---

**File hoàn chỉnh này chứa toàn bộ code Backend (Laravel 11 + PHP 8.3) + Frontend (React + TypeScript) cần thiết để implement S6-03.**  
Bạn chỉ cần copy các file tương ứng vào project của team.
