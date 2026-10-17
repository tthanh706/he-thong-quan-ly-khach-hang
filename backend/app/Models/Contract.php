<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    protected $fillable = [
        'customer_id',
        'contract_code',
        'contract_name',
        'contract_value',
        'status',
        'signed_date',
    ];

    protected function casts(): array
    {
        return [
            'contract_value' => 'decimal:2',
            'signed_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}