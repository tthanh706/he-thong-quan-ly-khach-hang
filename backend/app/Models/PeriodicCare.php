<?php

namespace App\Models;

use App\Enums\CareStatusEnum;
use App\Enums\CareTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PeriodicCare extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'periodic_cares';

    protected $fillable = [
        'customer_id',
        'care_type',
        'scheduled_date',
        'assignee_id',
        'status',
        'notes',
        'completed_at',
        'created_by',
    ];

    protected $casts = [
        'care_type' => CareTypeEnum::class,
        'status' => CareStatusEnum::class,
        'scheduled_date' => 'date',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Local scope áp dụng Data Scope (MY / TEAM / ALL)
     */
    public function scopeDataScope($query, User $user)
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => $query,
            'TEAM' => $query->whereHas('customer', function ($q) use ($user) {
                $q->whereIn('owner_id', $user->teamMemberIds());
            }),
            default => $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhereHas('customer', fn ($c) => $c->where('owner_id', $user->id));
            }),
        };
    }

    /**
     * Scope cảnh báo: các lịch sắp đến hạn hoặc quá hạn chưa hoàn thành
     */
    public function scopeUpcomingOrOverdue($query, int $days = 7)
    {
        return $query
            ->where('status', CareStatusEnum::PENDING)
            ->whereDate('scheduled_date', '<=', now()->addDays($days));
    }
}
