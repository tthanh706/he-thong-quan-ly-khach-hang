<?php

namespace App\Models;

use App\Enums\CalendarItemStatusEnum;
use App\Enums\CalendarItemTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarItem extends Model
{
    protected $fillable = [
        'title',
        'item_type',
        'priority', // low, medium, high
        'assigned_user_id',
        'team_leader_id',
        'customer_id',
        'opportunity_id',
        'start_at',
        'end_at',
        'due_at',
        'status',
        'completed_at',
        'postpone_reason',
        'reminder_minutes',
        'location',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => CalendarItemTypeEnum::class,
            'status' => CalendarItemStatusEnum::class,
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'reminder_minutes' => 'integer',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class, 'opportunity_id');
    }
}