<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesTarget extends Model
{
    protected $fillable = [
        'user_id',
        'target_value',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}