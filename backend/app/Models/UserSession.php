<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'last_activity',
        'expires_at',
        'revoked',
    ];

    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
            'expires_at' => 'datetime',
            'revoked' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}