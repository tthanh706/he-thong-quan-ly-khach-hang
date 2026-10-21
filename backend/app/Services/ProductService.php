<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Product::query();

        if (! empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($builder) use ($q): void {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            });
        }

        if (! empty($filters['type']) && $filters['type'] !== 'ALL') {
            $query->where('type', $filters['type']);
        }

        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        return $query->orderBy($sortBy, $sortOrder)
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    public function create(array $payload): Product
    {
        $payload['sku'] = Str::upper($payload['sku']);
        $payload['currency'] = $payload['currency'] ?? 'VND';

        return Product::query()->create($payload);
    }

    public function update(Product $product, array $payload): Product
    {
        $payload['sku'] = Str::upper($payload['sku']);
        $product->update($payload);

        return $product->refresh();
    }

    public function delete(Product $product): void
    {
        DB::transaction(function () use ($product): void {
            $product->priceListItems()->delete();
            $product->delete();
        });
    }
}
