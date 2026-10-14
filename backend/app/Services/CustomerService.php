<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    private ?AuditLogService $auditLogService = null;

    public function __construct(?AuditLogService $auditLogService = null)
    {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
    }

    /**
     * S3-01 / S3-07: Lấy danh sách khách hàng theo Data Scope và bộ lọc nâng cao
     */
    public function getFilteredCustomers(array $filters, User $user, ?int $perPage = null): LengthAwarePaginator|Collection
    {
        $query = Customer::query()
            ->with(['owner:id,name,email', 'parent:id,code,name', 'contacts:id,customer_id,name,phone,email,title'])
            ->withCount(['contacts', 'contracts', 'supportRequests', 'periodicCares'])
            ->dataScope($user);

        // 1. Tìm kiếm tổng hợp theo tên công ty, mã KH, MST, SĐT, Email hoặc SĐT người liên hệ
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('tax_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('contacts', function ($cq) use ($search) {
                      $cq->where('phone', 'like', "%{$search}%")
                         ->orWhere('name', 'like', "%{$search}%");
                  });
            });
        }

        // 2. Tìm kiếm riêng theo số điện thoại người liên hệ (S3-07)
        if (!empty($filters['contact_phone'])) {
            $contactPhone = trim($filters['contact_phone']);
            $query->whereHas('contacts', function ($cq) use ($contactPhone) {
                $cq->where('phone', 'like', "%{$contactPhone}%");
            });
        }

        // 3. Lọc theo trạng thái (Tiềm năng, Đang giao dịch, Khách hàng, Ngừng hợp tác)
        if (!empty($filters['status'])) {
            $status = $filters['status'];
            // Hỗ trợ cả mã tiếng Anh và nhãn tiếng Việt
            $statusMap = [
                'lead' => Customer::STATUS_LEAD,
                'in_progress' => Customer::STATUS_IN_PROGRESS,
                'customer' => Customer::STATUS_CUSTOMER,
                'active' => Customer::STATUS_CUSTOMER,
                'stopped' => Customer::STATUS_STOPPED,
                'inactive' => Customer::STATUS_STOPPED,
            ];
            $targetStatus = $statusMap[strtolower($status)] ?? $status;
            $query->where('status', $targetStatus);
        }

        // 4. Lọc theo ngành nghề (S3-07)
        if (!empty($filters['industry'])) {
            $industry = trim($filters['industry']);
            $query->where(function ($q) use ($industry) {
                $q->where('industry', $industry)
                  ->orWhere('industry', 'like', "%{$industry}%")
                  ->orWhere('notes', 'like', "%{$industry}%");
            });
        }

        // 5. Lọc theo quy mô doanh nghiệp (S3-07)
        if (!empty($filters['company_size'])) {
            $query->where('company_size', $filters['company_size']);
        } elseif (!empty($filters['scale'])) {
            $query->where('company_size', $filters['scale']);
        }

        // 6. Lọc theo khu vực (S3-07)
        if (!empty($filters['area'])) {
            $area = trim($filters['area']);
            $query->where(function ($q) use ($area) {
                $q->where('area', $area)
                  ->orWhere('area', 'like', "%{$area}%")
                  ->orWhere('address', 'like', "%{$area}%");
            });
        }

        // 7. Lọc theo người sở hữu (dành cho Trưởng nhóm / Quản trị viên)
        if (!empty($filters['owner_id'])) {
            $query->where('owner_id', (int)$filters['owner_id']);
        }

        // 8. Lọc quan hệ công ty mẹ/con (nếu có)
        if (isset($filters['has_parent'])) {
            if (filter_var($filters['has_parent'], FILTER_VALIDATE_BOOLEAN)) {
                $query->whereNotNull('parent_id');
            } else {
                $query->whereNull('parent_id');
            }
        }

        $query->latest();

        if ($perPage !== null && $perPage > 0) {
            return $query->paginate($perPage);
        }

        return $query->get();
    }

    /**
     * S3-01: Tạo mới hồ sơ khách hàng doanh nghiệp chuẩn
     */
    public function createCustomerProfile(array $data, User $user): Customer
    {
        // Phân quyền gán người sở hữu
        $role = strtolower((string)$user->role);
        $canAssignOwner = $user->isAdmin() || $role === 'admin' || $role === 'manager' || $role === 'team_leader';

        if (!$canAssignOwner || empty($data['owner_id'])) {
            $ownerId = $user->id;
        } else {
            $ownerId = (int) $data['owner_id'];
        }

        // Tự động sinh mã khách hàng nếu chưa có
        $code = $data['code'] ?? null;
        if (empty($code)) {
            $maxId = (int)(Customer::max('id') ?? 0);
            $code = 'KH' . str_pad((string)($maxId + 1), 4, '0', STR_PAD_LEFT);
        }

        // Chuẩn hóa trạng thái
        $status = $data['status'] ?? Customer::STATUS_LEAD;
        $statusMap = [
            'lead' => Customer::STATUS_LEAD,
            'in_progress' => Customer::STATUS_IN_PROGRESS,
            'customer' => Customer::STATUS_CUSTOMER,
            'active' => Customer::STATUS_CUSTOMER,
            'stopped' => Customer::STATUS_STOPPED,
            'inactive' => Customer::STATUS_STOPPED,
        ];
        $status = $statusMap[strtolower($status)] ?? $status;

        $customer = Customer::create([
            'name' => $data['name'],
            'code' => $code,
            'tax_code' => $data['tax_code'] ?? $data['taxCode'] ?? null,
            'industry' => $data['industry'] ?? null,
            'company_size' => $data['company_size'] ?? $data['scale'] ?? null,
            'website' => $data['website'] ?? null,
            'address' => $data['address'] ?? null,
            'area' => $data['area'] ?? null,
            'status' => $status,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'notes' => $data['notes'] ?? null,
            'parent_id' => $data['parent_id'] ?? $data['parentId'] ?? null,
            'owner_id' => $ownerId,
            'is_active' => true,
        ]);

        return $customer->fresh(['owner', 'parent', 'contacts']);
    }

    /**
     * S3-01: Cập nhật hồ sơ khách hàng doanh nghiệp
     */
    public function updateCustomerProfile(Customer $customer, array $data, User $user): Customer
    {
        if (!$this->canManageCustomer($user, $customer)) {
            throw new AuthorizationException('Bạn không có quyền chỉnh sửa hồ sơ khách hàng này.');
        }

        $updates = [];
        $allowedFields = ['name', 'code', 'tax_code', 'industry', 'company_size', 'website', 'address', 'area', 'status', 'phone', 'email', 'notes', 'parent_id'];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        // Hỗ trợ alias camelCase
        if (array_key_exists('taxCode', $data)) $updates['tax_code'] = $data['taxCode'];
        if (array_key_exists('scale', $data)) $updates['company_size'] = $data['scale'];
        if (array_key_exists('parentId', $data)) $updates['parent_id'] = $data['parentId'];
        if (array_key_exists('tier', $data) && !array_key_exists('status', $data)) $updates['status'] = $data['tier'];

        // Chuẩn hóa status nếu có update
        if (isset($updates['status'])) {
            $statusMap = [
                'lead' => Customer::STATUS_LEAD,
                'in_progress' => Customer::STATUS_IN_PROGRESS,
                'customer' => Customer::STATUS_CUSTOMER,
                'active' => Customer::STATUS_CUSTOMER,
                'stopped' => Customer::STATUS_STOPPED,
                'inactive' => Customer::STATUS_STOPPED,
            ];
            $updates['status'] = $statusMap[strtolower($updates['status'])] ?? $updates['status'];
        }

        // Cập nhật người sở hữu nếu có quyền
        if (array_key_exists('owner_id', $data) || array_key_exists('ownerId', $data)) {
            $newOwnerId = (int)($data['owner_id'] ?? $data['ownerId']);
            $role = strtolower((string)$user->role);
            if ($user->isAdmin() || $role === 'admin' || $role === 'manager' || $role === 'team_leader') {
                $updates['owner_id'] = $newOwnerId;
            }
        }

        $customer->update($updates);

        return $customer->fresh(['owner', 'parent', 'contacts']);
    }

    /**
     * S3-01: Xóa hồ sơ khách hàng
     */
    public function deleteCustomerProfile(Customer $customer, User $user): void
    {
        if (!$this->canManageCustomer($user, $customer)) {
            throw new AuthorizationException('Bạn không có quyền xóa hồ sơ khách hàng này.');
        }

        $customer->delete();
    }

    /**
     * S3-07: Lấy các lựa chọn cho bộ lọc và người sở hữu phù hợp với Data Scope
     */
    public function getFilterOptions(User $user): array
    {
        $role = strtolower((string)$user->role);
        $scope = strtoupper((string)($user->data_scope ?? 'MY'));

        // Danh sách nhân sự mà user có quyền lọc
        if ($user->isAdmin() || $role === 'admin' || $role === 'manager' || $scope === 'ALL') {
            $owners = User::select('id', 'name', 'email', 'role')->where('status', 'active')->get();
        } elseif ($role === 'team_leader' || $user->hasRole('team_leader') || in_array($scope, ['TEAM', 'GROUP'])) {
            $teamMemberIds = $user->teamMemberIds();
            $owners = User::select('id', 'name', 'email', 'role')->whereIn('id', $teamMemberIds)->get();
        } else {
            $owners = User::select('id', 'name', 'email', 'role')->where('id', $user->id)->get();
        }

        $industries = Customer::whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->pluck('industry')
            ->toArray();

        $defaultIndustries = ['Công nghệ thông tin', 'Sản xuất & Chế tạo', 'Bất động sản & Xây dựng', 'Tài chính - Ngân hàng', 'Bán lẻ & Thương mại điện tử', 'Giáo dục & Đào tạo', 'Y tế & Dược phẩm', 'Logistics & Vận tải', 'Du lịch & Khách sạn'];
        $allIndustries = array_values(array_unique(array_merge($defaultIndustries, $industries)));

        $areas = Customer::whereNotNull('area')
            ->where('area', '!=', '')
            ->distinct()
            ->pluck('area')
            ->toArray();

        $defaultAreas = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];
        $allAreas = array_values(array_unique(array_merge($defaultAreas, $areas)));

        return [
            'statuses' => Customer::STATUSES,
            'company_sizes' => Customer::SIZES,
            'industries' => $allIndustries,
            'areas' => $allAreas,
            'owners' => $owners,
            'current_user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'data_scope' => $scope,
            ],
        ];
    }

    /**
     * S3-07: Lưu bộ lọc hay dùng
     */
    public function saveFilter(User $user, string $name, array $filters, string $module = 'customers'): SavedFilter
    {
        return SavedFilter::create([
            'user_id' => $user->id,
            'name' => $name,
            'module' => $module,
            'filters' => $filters,
        ]);
    }

    /**
     * S3-07: Lấy danh sách bộ lọc đã lưu của user
     */
    public function getSavedFilters(User $user, string $module = 'customers')
    {
        return SavedFilter::where('user_id', $user->id)
            ->where('module', $module)
            ->latest()
            ->get();
    }

    /**
     * S3-07: Xóa bộ lọc đã lưu
     */
    public function deleteSavedFilter(User $user, int $filterId): bool
    {
        $filter = SavedFilter::where('user_id', $user->id)->where('id', $filterId)->first();
        if ($filter) {
            $filter->delete();
            return true;
        }
        return false;
    }

    /**
     * Kiểm tra quyền quản lý khách hàng
     */
    private function canManageCustomer(User $user, Customer $customer): bool
    {
        $role = strtolower((string)$user->role);
        $scope = strtoupper((string)($user->data_scope ?? 'MY'));

        // Admin hoặc quyền ALL
        if ($user->isAdmin() || $role === 'admin' || $role === 'manager' || $scope === 'ALL') {
            return true;
        }

        // Trưởng nhóm
        if ($role === 'team_leader' || $user->hasRole('team_leader') || in_array($scope, ['TEAM', 'GROUP'])) {
            return in_array($customer->owner_id, $user->teamMemberIds(), true);
        }

        // Nhân viên
        return $customer->owner_id === $user->id;
    }

    /**
     * Lấy danh sách khách hàng có phân trang (legacy).
     */
    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = Customer::query()->with('owner');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('owner_id', $filters['assigned_to']);
        }

        return $query->latest()->paginate($perPage);
    }


    /**
     * Tìm khách hàng theo ID. Ném ModelNotFoundException nếu không tồn tại.
     *
     * @throws ModelNotFoundException
     */
    public function findOrFail(int $id): Customer
    {
        return Customer::findOrFail($id);
    }

    /**
     * Tạo khách hàng mới.
     */
    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    /**
     * Cập nhật thông tin khách hàng.
     *
     * @throws ModelNotFoundException   Nếu không tìm thấy.
     * @throws AuthorizationException   Nếu user không có quyền sửa.
     */
    public function update(int $id, array $data, int $actingUserId): Customer
    {
        $customer = $this->findOrFail($id);

        if (
            $customer->owner_id !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền chỉnh sửa khách hàng này.');
        }

        $customer->update($data);

        return $customer->fresh();
    }

    /**
     * Xoá mềm khách hàng.
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     */
    public function delete(int $id, int $actingUserId): void
    {
        $customer = $this->findOrFail($id);

        if (! $this->actingUserIsAdmin($actingUserId)) {
            throw new AuthorizationException('Chỉ quản trị viên mới có thể xóa khách hàng.');
        }

        $customer->delete();
    }

    public function updateOwner(
        Customer $customer,
        int $newOwnerId,
        User $currentUser
    ): Customer {
        return DB::transaction(function () use (
            $customer,
            $newOwnerId,
            $currentUser
        ) {
            $oldOwnerId = $customer->owner_id;

            if ($oldOwnerId === $newOwnerId) {
                return $customer;
            }

            $customer->owner_id = $newOwnerId;
            $customer->save();

            $this->auditLogService->logChange(
                $currentUser->id,
                'updated',
                'Customer',
                $customer->id,
                'owner_id',
                $oldOwnerId,
                $newOwnerId
            );

            return $customer->fresh();
        });
    }

    public function findDuplicates(): array
    {
        // 1. Group by tax_code
        $taxDuplicates = Customer::select('tax_code')
            ->whereNotNull('tax_code')
            ->where('tax_code', '!=', '')
            ->groupBy('tax_code')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('tax_code');

        $taxClusters = [];
        foreach ($taxDuplicates as $taxCode) {
            $customers = Customer::where('tax_code', $taxCode)
                ->withCount(['contacts', 'contracts', 'supportRequests'])
                ->get();
            $taxClusters[] = [
                'type' => 'tax_code',
                'field_value' => $taxCode,
                'reason' => "Trùng Mã số thuế: {$taxCode}",
                'customers' => $customers,
            ];
        }

        // 2. Group by phone
        $phoneDuplicates = Customer::select('phone')
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->groupBy('phone')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('phone');

        $phoneClusters = [];
        foreach ($phoneDuplicates as $phone) {
            $customers = Customer::where('phone', $phone)
                ->withCount(['contacts', 'contracts', 'supportRequests'])
                ->get();
            $phoneClusters[] = [
                'type' => 'phone',
                'field_value' => $phone,
                'reason' => "Trùng Số điện thoại: {$phone}",
                'customers' => $customers,
            ];
        }

        // 3. Group by email
        $emailDuplicates = Customer::select('email')
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->groupBy('email')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('email');

        $emailClusters = [];
        foreach ($emailDuplicates as $email) {
            $customers = Customer::where('email', $email)
                ->withCount(['contacts', 'contracts', 'supportRequests'])
                ->get();
            $emailClusters[] = [
                'type' => 'email',
                'field_value' => $email,
                'reason' => "Trùng Email: {$email}",
                'customers' => $customers,
            ];
        }

        return [
            'total_clusters' => count($taxClusters) + count($phoneClusters) + count($emailClusters),
            'clusters' => array_merge($taxClusters, $phoneClusters, $emailClusters),
        ];
    }

    public function mergeCustomers(int $sourceId, int $targetId, array $overrides = [], ?User $actingUser = null): Customer
    {
        if ($sourceId === $targetId) {
            throw new \InvalidArgumentException('Khách hàng nguồn và đích không thể giống nhau.');
        }

        $source = Customer::findOrFail($sourceId);
        $target = Customer::findOrFail($targetId);

        return DB::transaction(function () use ($source, $target, $overrides, $actingUser) {
            // Transfer contacts
            \App\Models\Contact::where('customer_id', $source->id)
                ->update(['customer_id' => $target->id]);

            // Transfer contracts
            \App\Models\Contract::where('customer_id', $source->id)
                ->update(['customer_id' => $target->id]);

            // Transfer support requests
            \App\Models\SupportRequest::where('customer_id', $source->id)
                ->update(['customer_id' => $target->id]);

            // Transfer periodic cares
            \App\Models\PeriodicCare::where('customer_id', $source->id)
                ->update(['customer_id' => $target->id]);

            // Transfer opportunities
            \App\Models\Opportunity::where('customer_id', $source->id)
                ->update(['customer_id' => $target->id]);

            // Transfer subsidiaries
            Customer::where('parent_id', $source->id)
                ->update(['parent_id' => $target->id]);

            // Fill missing data on target if source has it
            $fillable = ['tax_code', 'phone', 'email', 'address', 'source'];
            $updates = [];
            foreach ($fillable as $f) {
                if (empty($target->{$f}) && !empty($source->{$f})) {
                    $updates[$f] = $source->{$f};
                }
            }

            foreach ($overrides as $k => $v) {
                if ($v !== null && $v !== '') {
                    $updates[$k] = $v;
                }
            }

            if (!empty($updates)) {
                $target->update($updates);
            }

            // Append merge note to source and soft delete
            $source->notes = trim(($source->notes ?? '') . " [Đã gộp vào KH #{$target->id} - {$target->name} lúc " . now()->format('Y-m-d H:i:s') . "]");
            $source->save();
            $source->delete();

            if ($this->auditLogService && $actingUser) {
                $this->auditLogService->logChange(
                    $actingUser->id,
                    'merged',
                    'Customer',
                    $target->id,
                    'merge_from_customer_id',
                    (string)$source->id,
                    "Merged customer #{$source->id} ({$source->name}) into #{$target->id} ({$target->name})"
                );
            }

            return $target->fresh([
                'owner', 'parent', 'contacts', 'contracts', 'supportRequests', 'periodicCares'
            ]);
        });
    }

    public function getCustomer360(int $id): array
    {
        $customer = Customer::with([
            'owner:id,name,email',
            'parent:id,code,name',
            'subsidiaries:id,code,name,status,tax_code',
            'contacts',
            'contracts',
            'opportunities',
            'supportRequests' => fn ($q) => $q->latest()->limit(10),
            'periodicCares' => fn ($q) => $q->latest()->limit(10),
        ])->findOrFail($id);

        $totalContractValue = $customer->contracts->sum('total_value') ?: $customer->contracts->sum('value') ?: 0;
        $activeContractsCount = $customer->contracts->where('status', 'Active')->count();
        $openSupportCount = $customer->supportRequests->whereIn('status', ['OPEN', 'IN_PROGRESS'])->count();
        $pendingCareCount = $customer->periodicCares->where('status', 'PENDING')->count();

        return [
            'company' => [
                'id' => (string) $customer->id,
                'code' => $customer->code ?? ('KH' . str_pad($customer->id, 3, '0', STR_PAD_LEFT)),
                'name' => $customer->name,
                'taxCode' => $customer->tax_code ?? '',
                'industry' => $customer->notes ?? 'Doanh nghiệp',
                'address' => $customer->address ?? '',
                'email' => $customer->email ?? '',
                'phone' => $customer->phone ?? '',
                'tier' => $customer->status ?? 'Enterprise',
                'owner' => $customer->owner?->name ?? 'Chưa phân công',
                'createdAt' => $customer->created_at?->format('Y-m-d H:i:s'),
                'parent' => $customer->parent ? [
                    'id' => (string) $customer->parent->id,
                    'name' => $customer->parent->name,
                    'code' => $customer->parent->code,
                ] : null,
                'subsidiaries' => $customer->subsidiaries->map(fn ($s) => [
                    'id' => (string) $s->id,
                    'name' => $s->name,
                    'code' => $s->code,
                    'taxCode' => $s->tax_code,
                    'tier' => $s->status,
                ]),
            ],
            'statistics' => [
                'totalContractValue' => (float) $totalContractValue,
                'activeContractsCount' => $activeContractsCount,
                'openSupportCount' => $openSupportCount,
                'pendingCareCount' => $pendingCareCount,
                'contactsCount' => $customer->contacts->count(),
            ],
            'contacts' => $customer->contacts->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'title' => $c->title ?? '',
                'department' => $c->department ?? '',
                'email' => $c->email ?? '',
                'phone' => $c->phone ?? '',
                'isPrimary' => (bool) $c->is_primary,
                'roleInDecision' => $c->role_in_decision ?? '',
            ]),
            'contracts' => $customer->contracts->map(fn ($ct) => [
                'id' => (string) $ct->id,
                'contractNumber' => $ct->contract_number ?? ('HD-' . $ct->id),
                'title' => $ct->title ?? 'Hợp đồng dịch vụ',
                'value' => (float) ($ct->total_value ?? $ct->value ?? 0),
                'startDate' => $ct->start_date ? $ct->start_date->format('Y-m-d') : null,
                'endDate' => $ct->end_date ? $ct->end_date->format('Y-m-d') : null,
                'status' => $ct->status ?? 'Active',
            ]),
            'deals' => $customer->opportunities->map(fn ($o) => [
                'id' => (string) $o->id,
                'title' => $o->title ?? $o->name ?? 'Cơ hội bán hàng',
                'value' => (float) ($o->expected_revenue ?? $o->value ?? 0),
                'stage' => $o->stage ?? 'Đàm phán',
                'closingDate' => $o->close_date ?? null,
            ]),
            'supportRequests' => $customer->supportRequests->map(fn ($sr) => [
                'id' => (string) $sr->id,
                'code' => $sr->code,
                'subject' => $sr->subject,
                'priority' => $sr->priority?->value ?? (string)$sr->priority,
                'status' => $sr->status?->value ?? (string)$sr->status,
                'createdAt' => $sr->created_at?->format('Y-m-d H:i:s'),
                'isOverdue' => (bool) $sr->is_overdue,
            ]),
            'periodicCares' => $customer->periodicCares->map(fn ($pc) => [
                'id' => (string) $pc->id,
                'careType' => $pc->care_type?->value ?? (string)$pc->care_type,
                'scheduledDate' => $pc->scheduled_date?->format('Y-m-d'),
                'status' => $pc->status?->value ?? (string)$pc->status,
                'isOverdue' => (bool) $pc->is_overdue,
                'notes' => $pc->notes,
            ]),
        ];
    }

    private function actingUserIsAdmin(int $userId): bool
    {
        return \App\Models\User::where('id', $userId)
                               ->where('role', 'admin')
                               ->exists();
    }
}
