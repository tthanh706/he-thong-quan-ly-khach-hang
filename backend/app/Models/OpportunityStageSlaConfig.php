<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpportunityStageSlaConfig extends Model
{
    protected $fillable = [
        'stage',
        'inactivity_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'inactivity_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}