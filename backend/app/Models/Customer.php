<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'customers';

    // S3-01: Trạng thái chuẩn
    public const STATUS_LEAD = 'Tiềm năng';
    public const STATUS_IN_PROGRESS = 'Đang giao dịch';
    public const STATUS_CUSTOMER = 'Khách hàng';
    public const STATUS_STOPPED = 'Ngừng hợp tác';

    public const STATUSES = [
        self::STATUS_LEAD,
        self::STATUS_IN_PROGRESS,
        self::STATUS_CUSTOMER,
        self::STATUS_STOPPED,
    ];

    // S3-01 / S3-07: Quy mô doanh nghiệp
    public const SIZE_MICRO = 'Dưới 50 nhân sự';
    public const SIZE_SMALL = '50 - 200 nhân sự';
    public const SIZE_MEDIUM = '200 - 500 nhân sự';
    public const SIZE_LARGE = 'Trên 500 nhân sự';

    public const SIZES = [
        self::SIZE_MICRO,
        self::SIZE_SMALL,
        self::SIZE_MEDIUM,
        self::SIZE_LARGE,
    ];

    protected $fillable = [
        'code',
        'name',
        'tax_code',
        'industry',
        'company_size',
        'website',
        'address',
        'area',
        'owner_id',
        'status',
        'email',
        'phone',
        'business_group_id',
        'value',
        'is_active',
        'source',
        'notes',
        'parent_id',
    ];


    protected $casts = [
        'is_active' => 'boolean',
        'value' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function supportRequests(): HasMany
    {
        return $this->hasMany(SupportRequest::class);
    }

    public function periodicCares(): HasMany
    {
        return $this->hasMany(PeriodicCare::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'parent_id');
    }

    public function subsidiaries(): HasMany
    {
        return $this->hasMany(Customer::class, 'parent_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'customer_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'customer_id');
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class, 'customer_id');
    }

    /**
     * S3-01: Phân quyền xem dữ liệu khách hàng
     * - Nhân viên chỉ thấy khách hàng mình sở hữu
     * - Trưởng nhóm thấy toàn nhóm
     * - Quản trị viên / Ban giám đốc thấy toàn bộ
     */
    public function scopeDataScope($query, User $user)
    {
        $role = strtolower((string)$user->role);
        $scope = strtoupper((string)($user->data_scope ?? 'MY'));

        // 1. Quản trị viên hoặc quyền ALL -> Thấy tất cả
        if ($user->isAdmin() || $role === 'admin' || $role === 'manager' || $scope === 'ALL') {
            return $query;
        }

        // 2. Trưởng nhóm (team_leader) hoặc scope TEAM -> Thấy toàn bộ khách hàng của nhóm
        if ($role === 'team_leader' || $user->hasRole('team_leader') || in_array($scope, ['TEAM', 'GROUP'])) {
            $teamMemberIds = $user->teamMemberIds();
            return $query->whereIn('owner_id', $teamMemberIds);
        }

        // 3. Nhân viên kinh doanh thông thường -> Chỉ thấy khách hàng mình sở hữu
        return $query->where('owner_id', $user->id);
    }

}
