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
        'contact_id',
        'campaign_id',
        'source_contract_id',
        'opportunity_type',
        'expected_close_date',
        'last_activity_at',
        'stagnation_flagged_at',
        'overdue_close_flagged_at',
        'business_group_id',
        'source',
        'win_probability',
        'win_probability_customized',
        'probability_note',
        'actual_won_value',
        'contract_signed_at',
        'loss_reason',
        'competitor_name',
        'is_closed',
        'closed_outcome', // won, lost
        'closed_at',
        'reopened_at',
        'reopen_reason',
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
            'actual_won_value' => 'decimal:2',
            'win_probability' => 'integer',
            'win_probability_customized' => 'boolean',
            'is_closed' => 'boolean',
            'expected_close_date' => 'date',
            'contract_signed_at' => 'date',
            'last_activity_at' => 'datetime',
            'stagnation_flagged_at' => 'datetime',
            'overdue_close_flagged_at' => 'datetime',
            'closed_at' => 'datetime',
            'reopened_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            $this->owner_user_id ? 'owner_user_id' : 'owner_id'
        );
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class, 'campaign_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(OpportunityHistory::class, 'opportunity_id')->orderBy('created_at', 'desc');
    }

    public function products(): HasMany
    {
        return $this->hasMany(OpportunityProduct::class, 'opportunity_id');
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(OpportunityCollaborator::class, 'opportunity_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(OpportunityAttachment::class, 'opportunity_id')->orderBy('created_at', 'desc');
    }

    public function sourceContract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'source_contract_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(OpportunityActivity::class);
    }

    public function salesActivities(): HasMany
    {
        return $this->hasMany(SalesActivity::class, 'opportunity_id')->orderBy('occurred_at', 'desc');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(CalendarItem::class, 'opportunity_id')->orderBy('due_at', 'asc');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(OpportunityStagnationAlert::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(OpportunityCustomFieldValue::class, 'opportunity_id');
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
