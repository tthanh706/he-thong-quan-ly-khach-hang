<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadSlaAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->lead_id,

            'lead' => $this->whenLoaded(
                'lead',
                fn () => [
                    'id' => $this->lead?->id,
                    'name' => $this->lead?->name,
                    'status' => $this->lead?->status?->value,
                ]
            ),

            'recipient' => $this->whenLoaded(
                'recipient',
                fn () => [
                    'id' => $this->recipient?->id,
                    'name' => $this->recipient?->name,
                    'email' => $this->recipient?->email,
                ]
            ),

            'overdue_at' => $this->overdue_at?->toDateTimeString(),
            'read_at' => $this->read_at?->toDateTimeString(),

            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}