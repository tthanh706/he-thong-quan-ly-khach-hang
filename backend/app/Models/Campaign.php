<?php

namespace App\Models;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'budget',
        'start_date',
        'end_date',
        'channel',
        'status',
        'owner_id',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'channel' => CampaignChannelEnum::class,
        'status' => CampaignStatusEnum::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class);
    }

    // Local Scopes
    public function scopeDataScope($query, User $user)
    {
        // Data Scope: MY / TEAM / ALL (theo convention)
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => $query,
            'TEAM' => $query->whereIn('owner_id', $user->teamMemberIds()),
            default => $query->where('owner_id', $user->id),
        };
    }

    public function scopeActive($query)
    {
        return $query->where('status', CampaignStatusEnum::ACTIVE);
    }
}