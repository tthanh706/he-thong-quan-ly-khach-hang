<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceListService
{
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
            $payload['code'] = Str::upper($payload['code']);

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
}
