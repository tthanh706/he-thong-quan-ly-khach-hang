<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Product::query();

        if (! empty($filters['q'])) {
            $query->search((string) $filters['q']);
        }

        if (! empty($filters['type']) && $filters['type'] !== 'ALL') {
            $query->ofType($filters['type']);
        }

        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        return $query->orderBy($sortBy, $sortOrder)
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    public function findById(int $id): ?Product
    {
        return Product::query()->find($id);
    }

    public function getActiveProducts(): Collection
    {
        return Product::query()->active()->orderBy('name')->get();
    }

    public function create(array $payload): Product
    {
        $payload['sku'] = Str::upper($payload['sku']);
        $payload['currency'] = $payload['currency'] ?? 'VND';

        return Product::query()->create($payload);
    }

    public function update(Product $product, array $payload): Product
    {
        if (isset($payload['sku'])) {
            $payload['sku'] = Str::upper($payload['sku']);
        }
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
