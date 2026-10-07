<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'currency' => $this->currency,
            'is_standard' => $this->is_standard,
            'is_active' => $this->is_active,
            'effective_from' => $this->effective_from,
            'effective_to' => $this->effective_to,
            'note' => $this->note,
            'item_count' => $this->whenCounted('items'),
            'items' => PriceListItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    public function with(Request $request): array
    {
        return ['success' => true, 'message' => 'OK'];
    }
}
