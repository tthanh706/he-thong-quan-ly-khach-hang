<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PriceListItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'price_list_id',
        'product_id',
        'unit_price',
        'min_qty',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'min_qty' => 'decimal:2',
        ];
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
