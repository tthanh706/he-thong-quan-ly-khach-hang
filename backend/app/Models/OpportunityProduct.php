<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityProduct extends Model
{
    protected $fillable = [
        'opportunity_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount_percent',
        'is_subscription',
        'billing_cycle',
        'annual_value',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'is_subscription' => 'boolean',
            'annual_value' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class, 'opportunity_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
