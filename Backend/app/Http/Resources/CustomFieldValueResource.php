<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomFieldValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'field_key' => $this->field_key,
            'field_name' => $this->field_name,
            'field_type' => $this->field_type,
            'options' => $this->options ?? [],
            'is_required' => (bool) $this->is_required,
            'value' => $this->value,
        ];
    }
}