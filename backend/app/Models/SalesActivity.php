<?php

namespace App\Models;

use App\Enums\SalesActivityTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesActivity extends Model
{
    protected $fillable = [
        'user_id',
        'team_leader_id',
        'lead_id',
        'activity_type',
        'title',
        'description',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_type' => SalesActivityTypeEnum::class,
            'occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'team_leader_id'
        );
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(
            Lead::class,
            'lead_id'
        );
    }
}