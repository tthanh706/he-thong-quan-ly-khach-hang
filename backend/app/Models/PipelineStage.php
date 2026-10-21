<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PipelineStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'pipeline_id',
        'name',
        'slug',
        'position',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'position'  => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────────

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(Pipeline::class);
    }

    public function transitionConditions(): HasMany
    {
        return $this->hasMany(StageTransitionCondition::class, 'pipeline_stage_id');
    }

    public function activeConditions(): HasMany
    {
        return $this->hasMany(StageTransitionCondition::class, 'pipeline_stage_id')
            ->where('is_active', true)
            ->orderBy('priority');
    }

    // ─── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}
