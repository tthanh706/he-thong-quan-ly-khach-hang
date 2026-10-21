<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PipelineStageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'pipeline_id' => $this->pipeline_id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'position'    => $this->position,
            'description' => $this->description,
            'is_active'   => $this->is_active,
            'conditions'  => StageConditionResource::collection($this->whenLoaded('transitionConditions')),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
