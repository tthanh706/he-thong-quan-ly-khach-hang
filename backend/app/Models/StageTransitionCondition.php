<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StageTransitionCondition extends Model
{
    use HasFactory;

    protected $fillable = [
        'pipeline_stage_id',
        'condition_type',
        'parameters',
        'error_message',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'parameters' => 'array',
        'is_active'  => 'boolean',
        'priority'   => 'integer',
    ];

    /**
     * Supported condition types for the rule engine.
     */
    public const CONDITION_TYPES = [
        'has_activity',      // Requires at least N activities of a given type
        'required_field',    // Requires a field on the opportunity to be filled
        'min_value',         // Requires opportunity value >= threshold
        'has_attachment',    // Requires at least N attachments
        'has_contact',       // Requires at least 1 contact person assigned
        'custom',            // Custom condition evaluated via callback
    ];

    // ─── Relationships ─────────────────────────────────────────────

    public function pipelineStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class);
    }
}
