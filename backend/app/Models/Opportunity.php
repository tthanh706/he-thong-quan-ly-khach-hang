<?php

namespace App\Models;

use App\Enums\OpportunityStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Opportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'name',
        'amount',
        'value',
        'cost_price',
        'status',
        'stage',
        'owner_id',
        'owner_user_id',
        'team_leader_id',
        'customer_id',
        'source_contract_id',
        'opportunity_type',
        'expected_close_date',
        'last_activity_at',
        'stagnation_flagged_at',
        'overdue_close_flagged_at',
        'business_group_id',
        'email',
        'phone',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => OpportunityStatusEnum::class,
            'amount' => 'decimal:2',
            'value' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'expected_close_date' => 'date',
            'last_activity_at' => 'datetime',
            'stagnation_flagged_at' => 'datetime',
            'overdue_close_flagged_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        // Supports owner_user_id or owner_id
        return $this->belongsTo(
            User::class,
            $this->owner_user_id ? 'owner_user_id' : 'owner_id'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'team_leader_id'
        );
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function sourceContract(): BelongsTo
    {
        return $this->belongsTo(
            Contract::class,
            'source_contract_id'
        );
    }

    public function activities(): HasMany
    {
        return $this->hasMany(
            OpportunityActivity::class
        );
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(
            OpportunityStagnationAlert::class
        );
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(
            OpportunityCustomFieldValue::class,
            'opportunity_id'
        );
    }

    public function getProfitMarginAttribute(): float
    {
        $value = (float) ($this->value ?? $this->amount ?? 0);
        $cost = (float) ($this->cost_price ?? 0);

        if ($value <= 0) {
            return 0;
        }

        return round(
            (($value - $cost) / $value) * 100,
            2
        );
    }
}
