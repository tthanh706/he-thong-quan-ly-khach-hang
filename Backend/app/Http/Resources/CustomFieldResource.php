<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module' => $this->module,
            'field_key' => $this->field_key,
            'field_name' => $this->field_name,
            'field_type' => $this->field_type,
            'options' => $this->options ?? [],
            'is_required' => $this->is_required,
            'is_active' => $this->is_active,

            'creator' => $this->creator
                ? [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                ]
                : null,

            'created_at' => $this->created_at
                ?->format('Y-m-d H:i:s'),

            'updated_at' => $this->updated_at
                ?->format('Y-m-d H:i:s'),
        ];
    }
}