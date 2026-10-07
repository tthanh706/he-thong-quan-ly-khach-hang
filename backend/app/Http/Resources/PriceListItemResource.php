<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price_list_id' => $this->price_list_id,
            'product_id' => $this->product_id,
            'unit_price' => $this->unit_price,
            'min_qty' => $this->min_qty,
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
