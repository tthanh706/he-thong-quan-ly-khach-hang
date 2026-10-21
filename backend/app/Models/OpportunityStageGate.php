<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpportunityStageGate extends Model
{
    protected $fillable = [
        'stage_key',
        'stage_name',
        'require_activity_count',
        'require_product',
        'require_contact',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'require_activity_count' => 'integer',
            'require_product' => 'boolean',
            'require_contact' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
