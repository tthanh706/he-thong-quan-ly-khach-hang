<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CategoryTypeEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommonCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_type',
        'code',
        'name',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category_type' => CategoryTypeEnum::class,
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByType(Builder $query, CategoryTypeEnum|string $type): Builder
    {
        $value = $type instanceof CategoryTypeEnum ? $type->value : $type;
        return $query->where('category_type', $value);
    }
}
