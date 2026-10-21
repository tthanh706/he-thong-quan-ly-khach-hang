<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadScoringRule extends Model
{
    protected $fillable = [
        'name',
        'criteria_type', // industry, company_size, source, interest_demand
        'criteria_value',
        'points',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
