<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandoverLog extends Model
{
    protected $fillable = [
        'source_user_id', 'target_user_id', 'performed_by_user_id',
        'entity_type', 'entity_id', 'handed_over_at',
    ];

    protected function casts(): array
    {
        return ['handed_over_at' => 'datetime'];
    }

    public function sourceUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'source_user_id');
    }

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }
}
