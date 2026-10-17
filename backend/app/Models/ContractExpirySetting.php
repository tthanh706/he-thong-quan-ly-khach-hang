<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractExpirySetting extends Model
{
    protected $fillable = [
        'warning_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'warning_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}