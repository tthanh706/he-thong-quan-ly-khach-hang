<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sku',
        'name',
        'type',
        'unit',
        'description',
        'list_price',
        'currency',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProductTypeEnum::class,
            'list_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function priceListItems(): HasMany
    {
        return $this->hasMany(PriceListItem::class);
    }
}
