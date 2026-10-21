<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'company_name',
        'job_title',
        'source',
        'status',
        'assigned_to',
        'merged_into_lead_id',
        'linked_customer_id',
        'custom_fields',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'custom_fields' => 'array',
    ];

    /**
     * Valid statuses for a lead.
     */
    public const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost', 'merged'];

    /**
     * Fields used for duplicate detection.
     */
    public const DEDUP_FIELDS = ['email', 'phone_number', 'company_name'];

    // ─── Relationships ─────────────────────────────────────────────

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function mergedIntoLead(): BelongsTo
    {
        return $this->belongsTo(self::class, 'merged_into_lead_id');
    }

    public function linkedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'linked_customer_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(LeadActivityLog::class);
    }

    public function mergeLogsAsPrimary(): HasMany
    {
        return $this->hasMany(LeadMergeLog::class, 'primary_lead_id');
    }

    public function mergeLogsAsMerged(): HasMany
    {
        return $this->hasMany(LeadMergeLog::class, 'merged_lead_id');
    }

    // ─── Accessors ──────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    // ─── Scopes ─────────────────────────────────────────────────────

    /**
     * Scope: only active (non-merged) leads.
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'merged');
    }

    /**
     * Scope: search for potential duplicates by email, phone, or company.
     */
    public function scopeDuplicatesOf($query, self $lead)
    {
        return $query->where('id', '!=', $lead->id)
            ->where('status', '!=', 'merged')
            ->where(function ($q) use ($lead) {
                if ($lead->email) {
                    $q->orWhere('email', $lead->email);
                }
                if ($lead->phone_number) {
                    $q->orWhere('phone_number', $lead->phone_number);
                }
                if ($lead->company_name) {
                    $q->orWhere('company_name', $lead->company_name);
                }
            });
    }
}
