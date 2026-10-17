<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerHierarchyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'parent_customer_id' => $this->parent_customer_id,

            'children' => CustomerHierarchyResource::collection(
                $this->whenLoaded('childCustomers')
            ),
        ];
    }
}