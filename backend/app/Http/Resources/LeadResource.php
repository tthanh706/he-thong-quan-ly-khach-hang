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
            'company' => $this->company,
            'industry' => $this->industry,
            'company_size' => $this->company_size,
            'interest_demand' => $this->interest_demand,
            'source' => $this->source,
            'score' => $this->score ?? 0,
            'rating' => $this->rating ?? 'cold', // hot, warm, cold

            'campaign_id' => $this->campaign_id,
            'campaign' => $this->whenLoaded('campaign', fn () => [
                'id' => $this->campaign?->id,
                'name' => $this->campaign?->name,
                'channel' => $this->campaign?->channel,
            ]),

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

            'status' => $this->status?->value ?? (is_string($this->status) ? $this->status : 'new'),

            'assigned_at' => $this->assigned_at?->toDateTimeString(),
            'accepted_at' => $this->accepted_at?->toDateTimeString(),
            'contacted_at' => $this->contacted_at?->toDateTimeString(),
            'sla_deadline' => $this->sla_deadline?->toDateTimeString(),
            'sla_flagged_at' => $this->sla_flagged_at?->toDateTimeString(),

            'is_sla_overdue' => $this->sla_deadline !== null
                && $this->contacted_at === null
                && now()->greaterThan($this->sla_deadline),

            'rejection_reason' => $this->rejection_reason,

            'converted_at' => $this->converted_at?->toDateTimeString(),
            'converted_customer_id' => $this->converted_customer_id,
            'converted_customer' => $this->whenLoaded('convertedCustomer', fn () => [
                'id' => $this->convertedCustomer?->id,
                'name' => $this->convertedCustomer?->name,
                'code' => $this->convertedCustomer?->code,
            ]),
            'converted_contact_id' => $this->converted_contact_id,
            'converted_opportunity_id' => $this->converted_opportunity_id,
            'is_merged' => (bool) $this->is_merged,
            'merged_into_lead_id' => $this->merged_into_lead_id,

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}