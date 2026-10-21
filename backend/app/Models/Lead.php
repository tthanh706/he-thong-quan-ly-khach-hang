<?php

namespace App\Models;

use App\Enums\LeadStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lead extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'industry',
        'company_size',
        'interest_demand',
        'source',
        'web_form_id',
        'campaign_id',
        'ip_address',
        'assigned_to',
        'team_leader_id',
        'status',
        'score',
        'rating',
        'assigned_at',
        'accepted_at',
        'contacted_at',
        'sla_deadline',
        'sla_flagged_at',
        'rejection_reason',
        'converted_at',
        'converted_customer_id',
        'converted_contact_id',
        'converted_opportunity_id',
        'is_merged',
        'merged_into_lead_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadStatusEnum::class,
            'score' => 'integer',
            'is_merged' => 'boolean',
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'contacted_at' => 'datetime',
            'sla_deadline' => 'datetime',
            'sla_flagged_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(LeadAssignmentHistory::class)->orderBy('created_at', 'desc');
    }

    public function slaAlert(): HasOne
    {
        return $this->hasOne(LeadSlaAlert::class);
    }

    public function webForm(): BelongsTo
    {
        return $this->belongsTo(WebForm::class, 'web_form_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class, 'campaign_id');
    }

    public function convertedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    public function convertedContact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'converted_contact_id');
    }

    public function convertedOpportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class, 'converted_opportunity_id');
    }

    public function mergedIntoLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'merged_into_lead_id');
    }

    public function salesActivities(): HasMany
    {
        return $this->hasMany(SalesActivity::class, 'lead_id')->orderBy('occurred_at', 'desc');
    }
}