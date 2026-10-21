<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadAssignmentRule extends Model
{
    protected $fillable = [
        'name',
        'priority',
        'condition_type', // region, industry, round_robin
        'condition_value',
        'assign_to_user_id',
        'assign_to_group_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assign_to_user_id');
    }

    public function assignedGroup(): BelongsTo
    {
        return $this->belongsTo(BusinessGroup::class, 'assign_to_group_id');
    }
}
