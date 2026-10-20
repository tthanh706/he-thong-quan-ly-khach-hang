<?php

namespace App\Models;

use App\Enums\OpportunityStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Opportunity extends Model
{
    protected $fillable = [
        'name',
        'owner_user_id',
        'team_leader_id',
        'stage',
        'status',
        'value',
        'expected_close_date',
        'last_activity_at',
        'stagnation_flagged_at',
        'overdue_close_flagged_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OpportunityStatusEnum::class,
            'value' => 'decimal:2',
            'expected_close_date' => 'date',
            'last_activity_at' => 'datetime',
            'stagnation_flagged_at' => 'datetime',
            'overdue_close_flagged_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'owner_user_id'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'team_leader_id'
        );
    }

    public function activities(): HasMany
    {
        return $this->hasMany(
            OpportunityActivity::class
        );
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(
            OpportunityStagnationAlert::class
        );
    }
}