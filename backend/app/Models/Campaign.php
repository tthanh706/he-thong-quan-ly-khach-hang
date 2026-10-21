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
=======
        'channel',
        'status',       // 'draft' | 'active' | 'paused' | 'completed'
        'starts_at',
        'ends_at',
        'budget',
        'target_leads',
        'target_revenue',
        'created_by',   // FK -> users.id
        'customer_id',  // FK -> customers.id (nullable)
    ];

    protected $casts = [
        'starts_at'      => 'datetime',
        'ends_at'        => 'datetime',
        'budget'         => 'decimal:2',
        'target_revenue' => 'decimal:2',
        'target_leads'   => 'integer',
        'deleted_at'     => 'datetime',
    ];

    /** Người tạo chiến dịch */
    public function creator(): BelongsTo

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

    /** Danh sách lead thu được từ chiến dịch (S4-03) */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'campaign_id');
    }

    /** Danh sách cơ hội bán hàng từ chiến dịch (S4-03) */
    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class, 'campaign_id');

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