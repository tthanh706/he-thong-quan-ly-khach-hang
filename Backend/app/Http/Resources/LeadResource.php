<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,

            'assigned_to' => $this->assigned_to,
            'assigned_user' => $this->whenLoaded(
                'assignedUser',
                fn () => [
                    'id' => $this->assignedUser?->id,
                    'name' => $this->assignedUser?->name,
                    'email' => $this->assignedUser?->email,
                ]
            ),

            'team_leader_id' => $this->team_leader_id,
            'team_leader' => $this->whenLoaded(
                'teamLeader',
                fn () => [
                    'id' => $this->teamLeader?->id,
                    'name' => $this->teamLeader?->name,
                    'email' => $this->teamLeader?->email,
                ]
            ),

            'status' => $this->status?->value,

            'assigned_at' => $this->assigned_at?->toDateTimeString(),
            'accepted_at' => $this->accepted_at?->toDateTimeString(),
            'contacted_at' => $this->contacted_at?->toDateTimeString(),
            'sla_deadline' => $this->sla_deadline?->toDateTimeString(),
            'sla_flagged_at' => $this->sla_flagged_at?->toDateTimeString(),

            'is_sla_overdue' => $this->sla_deadline !== null
                && $this->contacted_at === null
                && now()->greaterThan($this->sla_deadline),

            'rejection_reason' => $this->rejection_reason,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}