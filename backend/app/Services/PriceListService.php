<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceListService
{
    public function getAll(): Collection
    {
        return PriceList::query()
            ->withCount('items')
            ->orderByDesc('is_standard')
            ->orderBy('name')
            ->get();
    }

    public function findById(int $id): ?PriceList
    {
        return PriceList::query()
            ->with(['items.product'])
            ->withCount('items')
            ->find($id);
    }

    public function getStandardPriceList(): ?PriceList
    {
        return PriceList::query()->standard()->first();
    }

    public function create(array $payload): PriceList
    {
        return DB::transaction(function () use ($payload): PriceList {
            $payload['code'] = Str::upper($payload['code']);
            $payload['currency'] = $payload['currency'] ?? 'VND';

            if (! empty($payload['is_standard'])) {
                PriceList::query()->where('is_standard', true)->update(['is_standard' => false]);
            }

            return PriceList::query()->create($payload);
        });
    }

    public function update(PriceList $priceList, array $payload): PriceList
    {
        return DB::transaction(function () use ($priceList, $payload): PriceList {
            if (isset($payload['code'])) {
                $payload['code'] = Str::upper($payload['code']);
            }

            if (! empty($payload['is_standard'])) {
                PriceList::query()
                    ->where('id', '!=', $priceList->id)
                    ->where('is_standard', true)
                    ->update(['is_standard' => false]);
            }

            $priceList->update($payload);

            return $priceList->refresh();
        });
    }

    public function delete(PriceList $priceList): void
    {
        DB::transaction(function () use ($priceList): void {
            $priceList->items()->delete();
            $priceList->delete();
        });
    }

    public function upsertItem(PriceList $priceList, array $payload): PriceListItem
    {
        return PriceListItem::query()->updateOrCreate(
            [
                'price_list_id' => $priceList->id,
                'product_id' => $payload['product_id'],
            ],
            [
                'unit_price' => $payload['unit_price'],
                'min_qty' => $payload['min_qty'] ?? 1,
            ]
        );
    }

    public function deleteItem(PriceList $priceList, PriceListItem $item): void
    {
        if ($item->price_list_id === $priceList->id) {
            $item->delete();
        }
    }
}
