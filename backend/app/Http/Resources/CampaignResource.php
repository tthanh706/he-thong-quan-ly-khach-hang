<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'budget' => (float) $this->budget,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'channel' => $this->channel?->value,
            'channel_label' => $this->channel?->label(),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'owner_id' => $this->owner_id,
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            // Metrics (chỉ khi load)
            'lead_count' => $this->when(isset($this->lead_count), $this->lead_count),
            'opportunity_count' => $this->when(isset($this->opportunity_count), $this->opportunity_count),
            'closed_value' => $this->when(isset($this->closed_value), (float) $this->closed_value),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}