<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadSlaAlert extends Model
{
    protected $fillable = [
        'lead_id',
        'recipient_user_id',
        'overdue_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'overdue_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'recipient_user_id'
        );
    }
}