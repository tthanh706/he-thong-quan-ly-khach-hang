<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadMergeLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'primary_lead_id',
        'merged_lead_id',
        'performed_by',
        'primary_lead_snapshot',
        'merged_lead_snapshot',
        'merged_activities_summary',
        'merge_reason',
    ];

    protected $casts = [
        'primary_lead_snapshot'     => 'array',
        'merged_lead_snapshot'      => 'array',
        'merged_activities_summary' => 'array',
    ];

    // ─── Relationships ─────────────────────────────────────────────

    public function primaryLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'primary_lead_id');
    }

    public function mergedLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'merged_lead_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
