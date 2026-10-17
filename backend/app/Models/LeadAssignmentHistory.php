<?php

namespace App\Models;

use App\Enums\LeadAssignmentActionEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadAssignmentHistory extends Model
{
    protected $fillable = [
        'lead_id',
        'user_id',
        'action',
        'old_status',
        'new_status',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'action' => LeadAssignmentActionEnum::class,
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}