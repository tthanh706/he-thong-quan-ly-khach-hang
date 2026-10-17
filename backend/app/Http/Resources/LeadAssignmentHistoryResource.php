<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadAssignmentHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->lead_id,

            'user' => $this->whenLoaded(
                'user',
                fn () => [
                    'id' => $this->user?->id,
                    'name' => $this->user?->name,
                    'email' => $this->user?->email,
                ]
            ),

            'action' => $this->action?->value,
            'old_status' => $this->old_status,
            'new_status' => $this->new_status,
            'reason' => $this->reason,

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}