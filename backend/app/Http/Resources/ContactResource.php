<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded(
                'customer',
                fn () => [
                    'id' => $this->customer?->id,
                    'name' => $this->customer?->name,
                ]
            ),
            'full_name' => $this->full_name,
            'job_title' => $this->job_title,
            'email' => $this->email,
            'phone' => $this->phone,
            'decision_role' => $this->decision_role?->value,
            'is_primary' => (bool) $this->is_primary,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}