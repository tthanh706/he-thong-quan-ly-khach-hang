<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'user' => $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ]
                : null,

            'action' => $this->action,

            'entity_type' => $this->entity_type,

            'entity_id' => $this->entity_id,

            'field_name' => $this->field_name,

            'old_value' => $this->old_value,

            'new_value' => $this->new_value,

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}