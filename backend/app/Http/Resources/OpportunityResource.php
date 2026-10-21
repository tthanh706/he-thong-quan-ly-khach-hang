<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,

            'owner_user_id' => $this->owner_user_id,
            'owner' => $this->whenLoaded(
                'owner',
                fn () => $this->owner ? [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
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

            'stage' => $this->stage,
            'status' => $this->status->value,
            'value' => $this->value,

            'expected_close_date' => $this->expected_close_date?->format('Y-m-d'),
            'last_activity_at' => $this->last_activity_at?->toDateTimeString(),

            'stagnation_flagged_at' => $this->stagnation_flagged_at?->toDateTimeString(),
            'overdue_close_flagged_at' => $this->overdue_close_flagged_at?->toDateTimeString(),

            'has_stagnation_warning' => $this->stagnation_flagged_at !== null,
            'has_overdue_close_warning' => $this->overdue_close_flagged_at !== null,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}