<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CategoryTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommonCategory extends Model
{
    use SoftDeletes;

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
}
