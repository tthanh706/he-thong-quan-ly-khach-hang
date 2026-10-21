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
        'assigned_user_id',
        'team_leader_id',
        'start_at',
        'end_at',
        'due_at',
        'status',
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
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'assigned_user_id'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'team_leader_id'
        );
    }
}