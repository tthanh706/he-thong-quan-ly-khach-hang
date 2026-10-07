<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    protected $fillable = [
        'name',
        'owner_id',
        'business_group_id',
        'status',
        'value',
        'discount',
        'email',
        'phone',
        'notes',
    ];
}