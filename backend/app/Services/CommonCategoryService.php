<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CommonCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class CommonCategoryService
{
    public function list(?string $categoryType): Collection
    {
        return CommonCategory::query()
            ->when($categoryType && $categoryType !== 'ALL', fn ($q) => $q->where('category_type', $categoryType))
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function create(array $payload): CommonCategory
    {
        $payload['code'] = Str::upper($payload['code']);
        $payload['sort_order'] = $payload['sort_order'] ?? 0;

        return CommonCategory::query()->create($payload);
    }

    public function update(CommonCategory $category, array $payload): CommonCategory
    {
        $payload['code'] = Str::upper($payload['code']);
        $category->update($payload);

        return $category->refresh();
    }
}
