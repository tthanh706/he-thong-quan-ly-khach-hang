<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodicCareResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'code' => $this->customer?->code,
            ],
            'care_type' => $this->care_type?->value,
            'care_type_label' => $this->care_type?->label(),
            'scheduled_date' => $this->scheduled_date?->format('Y-m-d'),
            'assignee' => $this->when($this->assignee, [
                'id' => $this->assignee?->id,
                'name' => $this->assignee?->name,
            ]),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'notes' => $this->notes,
            'completed_at' => $this->completed_at?->toDateTimeString(),
            'created_by' => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
            ],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'is_overdue' => $this->status?->value === 'PENDING'
                && $this->scheduled_date
                && $this->scheduled_date->isPast(),
        ];
    }
}
