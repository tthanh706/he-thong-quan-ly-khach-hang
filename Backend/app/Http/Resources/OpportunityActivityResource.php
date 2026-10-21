<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'type' => $this->type,
            'note' => $this->note,
            'activity_at' => $this->activity_at?->toDateTimeString(),

            'user' => $this->whenLoaded(
                'user',
                fn () => $this->user ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ] : null
            ),

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}