<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageTransitionOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'from_stage_id',
        'to_stage_id',
        'overridden_by',
        'override_reason',
        'skipped_conditions',
    ];

    protected $casts = [
        'skipped_conditions' => 'array',
    ];

    // ─── Relationships ─────────────────────────────────────────────

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function fromStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'from_stage_id');
    }

    public function toStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'to_stage_id');
    }

    public function overriddenByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'overridden_by');
    }
}
