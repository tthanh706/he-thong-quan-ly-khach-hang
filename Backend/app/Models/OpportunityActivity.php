<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityActivity extends Model
{
    protected $fillable = [
        'opportunity_id',
        'user_id',
        'type',
        'note',
        'activity_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_at' => 'datetime',
        ];
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}