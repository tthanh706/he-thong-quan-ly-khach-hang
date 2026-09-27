<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class PasswordResetToken extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'email',
        'token',
        'created_at',
        'expires_at',
        'used_at',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * Scope checking if token is currently valid (Not expired and not used yet).
     */
    public function scopeValid($query)
    {
        return $query->whereNull('used_at')
                     ->where('expires_at', '>', Carbon::now());
    }

    /**
     * Check if token is expired (>30 minutes).
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token has already been consumed.
     */
    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    /**
     * Mark token as consumed/used.
     */
    public function markAsUsed(): bool
    {
        return $this->update([
            'used_at' => Carbon::now(),
        ]);
    }

    /**
     * Generate a raw token and return [raw_token, hashed_token].
     */
    public static function createTokenForEmail(string $email, ?string $ipAddress = null): array
    {
        // Invalidate old unused tokens for this email
        static::where('email', $email)->whereNull('used_at')->delete();

        $rawToken = Str::random(64);
        $hashedToken = hash('sha256', $rawToken);

        $record = static::create([
            'email'      => $email,
            'token'      => $hashedToken,
            'created_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addMinutes(30), // 30 minutes lifetime
            'used_at'    => null,
            'ip_address' => $ipAddress,
        ]);

        return [$rawToken, $record];
    }
}
