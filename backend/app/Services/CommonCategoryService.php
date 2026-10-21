<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CategoryTypeEnum;
use App\Models\CommonCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class CommonCategoryService
{
    public function list(CategoryTypeEnum|string|null $categoryType): Collection
    {
        $typeValue = $categoryType instanceof CategoryTypeEnum ? $categoryType->value : $categoryType;

        return CommonCategory::query()
            ->when($typeValue && $typeValue !== 'ALL', fn ($q) => $q->where('category_type', $typeValue))
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function findById(int $id): ?CommonCategory
    {
        return CommonCategory::query()->find($id);
    }

    public function create(array $payload): CommonCategory
    {
        $payload['code'] = Str::upper($payload['code']);
        $payload['sort_order'] = $payload['sort_order'] ?? 0;

        return CommonCategory::query()->create($payload);
    }

    public function update(CommonCategory $category, array $payload): CommonCategory
    {
        if (isset($payload['code'])) {
            $payload['code'] = Str::upper($payload['code']);
        }
        $category->update($payload);

        return $category->refresh();
    }

    public function delete(CommonCategory $category): void
    {
        $category->delete();
    }
}
