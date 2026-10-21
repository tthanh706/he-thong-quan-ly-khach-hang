<?php

namespace App\Models;

use App\Enums\LeadStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lead extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'assigned_to',
        'team_leader_id',
        'status',
        'assigned_at',
        'accepted_at',
        'contacted_at',
        'sla_deadline',
        'sla_flagged_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadStatusEnum::class,
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'contacted_at' => 'datetime',
            'sla_deadline' => 'datetime',
            'sla_flagged_at' => 'datetime',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'assigned_to'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'team_leader_id'
        );
    }

    public function histories(): HasMany
    {
        return $this->hasMany(
            LeadAssignmentHistory::class
        );
    }

    public function slaAlert(): HasOne
    {
        return $this->hasOne(
            LeadSlaAlert::class
        );
    }
}