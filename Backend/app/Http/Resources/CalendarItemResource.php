<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'item_type' => $this->item_type->value,
            'status' => $this->status->value,

            'assigned_user_id' => $this->assigned_user_id,

            'assigned_user' => $this->whenLoaded(
                'assignedUser',
                fn () => $this->assignedUser ? [
                    'id' => $this->assignedUser->id,
                    'name' => $this->assignedUser->name,
                    'email' => $this->assignedUser->email,
                ] : null
            ),

            'team_leader_id' => $this->team_leader_id,

            'team_leader' => $this->whenLoaded(
                'teamLeader',
                fn () => $this->teamLeader ? [
                    'id' => $this->teamLeader->id,
                    'name' => $this->teamLeader->name,
                    'email' => $this->teamLeader->email,
                ] : null
            ),

            'start_at' => $this->start_at?->toDateTimeString(),
            'end_at' => $this->end_at?->toDateTimeString(),
            'due_at' => $this->due_at?->toDateTimeString(),

            'location' => $this->location,
            'description' => $this->description,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}