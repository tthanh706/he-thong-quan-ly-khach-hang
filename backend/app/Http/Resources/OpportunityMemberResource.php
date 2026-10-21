<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opportunity_id' => $this->opportunity_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'role' => $this->role,
            'added_by' => $this->added_by,
            'added_by_user' => $this->whenLoaded('addedBy', fn () => [
                'id' => $this->addedBy?->id,
                'name' => $this->addedBy?->name,
            ]),
            'added_at' => $this->added_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}