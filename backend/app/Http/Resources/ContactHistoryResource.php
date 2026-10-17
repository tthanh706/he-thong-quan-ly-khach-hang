<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contact_id' => $this->contact_id,

            'old_customer' => $this->whenLoaded(
                'oldCustomer',
                fn () => $this->oldCustomer
                    ? [
                        'id' => $this->oldCustomer->id,
                        'name' => $this->oldCustomer->name,
                    ]
                    : null
            ),

            'new_customer' => $this->whenLoaded(
                'newCustomer',
                fn () => $this->newCustomer
                    ? [
                        'id' => $this->newCustomer->id,
                        'name' => $this->newCustomer->name,
                    ]
                    : null
            ),

            'changed_by' => $this->whenLoaded(
                'changedByUser',
                fn () => $this->changedByUser
                    ? [
                        'id' => $this->changedByUser->id,
                        'name' => $this->changedByUser->name,
                        'email' => $this->changedByUser->email,
                    ]
                    : null
            ),

            'changed_at' => $this->changed_at,
            'created_at' => $this->created_at,
        ];
    }
}