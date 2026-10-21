<?php

namespace App\Models;

use App\Enums\OpportunityAlertTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityStagnationAlert extends Model
{
    protected $fillable = [
        'opportunity_id',
        'recipient_user_id',
        'type',
        'message',
        'detected_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => OpportunityAlertTypeEnum::class,
            'detected_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'recipient_user_id'
        );
    }
}