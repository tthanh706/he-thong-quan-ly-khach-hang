<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'code' => $this->customer?->code,
            ],
            'subject' => $this->subject,
            'description' => $this->description,
            'priority' => $this->priority?->value,
            'priority_label' => $this->priority?->label(),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'assignee' => $this->when($this->assignee, [
                'id' => $this->assignee?->id,
                'name' => $this->assignee?->name,
            ]),
            'created_by' => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
            ],
            'resolved_at' => $this->resolved_at?->toDateTimeString(),
            'resolution_note' => $this->resolution_note,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
