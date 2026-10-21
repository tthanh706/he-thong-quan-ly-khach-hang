<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityOwnershipLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'from_owner_id' => $this->from_owner_id,
            'from_owner' => $this->whenLoaded('fromOwner', fn () => [
                'id' => $this->fromOwner?->id,
                'name' => $this->fromOwner?->name,
            ]),
            'to_owner_id' => $this->to_owner_id,
            'to_owner' => $this->whenLoaded('toOwner', fn () => [
                'id' => $this->toOwner->id,
                'name' => $this->toOwner->name,
            ]),
            'changed_by' => $this->changed_by,
            'changed_by_user' => $this->whenLoaded('changedBy', fn () => [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
            ]),
            'note' => $this->note,
            'changed_at' => $this->changed_at?->toISOString(),
        ];
    }
}