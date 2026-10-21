<?php

namespace App\Models;

use App\Enums\SupportPriorityEnum;
use App\Enums\SupportStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'support_requests';

    protected $fillable = [
        'code',
        'customer_id',
        'subject',
        'description',
        'priority',
        'status',
        'assignee_id',
        'created_by',
        'resolved_at',
        'resolution_note',
    ];

    protected $casts = [
        'priority' => SupportPriorityEnum::class,
        'status' => SupportStatusEnum::class,
        'resolved_at' => 'datetime',
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
}
