<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StageConditionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'pipeline_stage_id' => $this->pipeline_stage_id,
            'condition_type'    => $this->condition_type,
            'parameters'        => $this->parameters,
            'error_message'     => $this->error_message,
            'is_active'         => $this->is_active,
            'priority'          => $this->priority,
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),
        ];
    }
}
