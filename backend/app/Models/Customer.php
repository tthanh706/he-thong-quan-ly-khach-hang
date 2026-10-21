<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model Customer cơ bản (giả định đã có từ các Sprint trước).
 * Được dùng cho import Excel, SupportRequest và PeriodicCare.
 */
class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'customers';

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'tax_code',
        'address',
        'owner_id',
        'is_active',
        'source',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function supportRequests(): HasMany
    {
        return $this->hasMany(SupportRequest::class);
    }

    public function periodicCares(): HasMany
    {
        return $this->hasMany(PeriodicCare::class);
    }

    public function scopeDataScope($query, User $user)
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => $query,
            'TEAM' => $query->whereIn('owner_id', $user->teamMemberIds()),
            default => $query->where('owner_id', $user->id),
        };
    }
}
