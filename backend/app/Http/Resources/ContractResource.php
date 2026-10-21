<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysRemaining = (int) today()->diffInDays(
            $this->end_date,
            false
        );

        return [
            'id' => $this->id,
            'contract_code' => $this->contract_code,
            'customer_name' => $this->customer_name,

            'owner_user_id' => $this->owner_user_id,
            'owner' => $this->whenLoaded(
                'owner',
                fn () => $this->owner ? [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ] : null
            ),

            'accountant_user_id' => $this->accountant_user_id,
            'accountant' => $this->whenLoaded(
                'accountant',
                fn () => $this->accountant ? [
                    'id' => $this->accountant->id,
                    'name' => $this->accountant->name,
                    'email' => $this->accountant->email,
                ] : null
            ),

            'status' => is_object($this->status) ? $this->status->value : (string)$this->status,
            'contract_value' => $this->contract_value,

            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),

            'days_remaining' => $daysRemaining,

            'is_expired' => $daysRemaining < 0,

            'description' => $this->description,

            'renewal_opportunity' => $this->whenLoaded(
                'renewalOpportunity',
                fn () => $this->renewalOpportunity ? [
                    'id' => $this->renewalOpportunity->id,
                    'name' => $this->renewalOpportunity->name,
                    'status' => is_object($this->renewalOpportunity->status) ? $this->renewalOpportunity->status->value : (string)$this->renewalOpportunity->status,
                    'opportunity_type' => $this->renewalOpportunity->opportunity_type,
                ] : null
            ),

            'alerts' => $this->whenLoaded(
                'expiryAlerts',
                fn () => $this->expiryAlerts->map(
                    fn ($alert) => [
                        'id' => $alert->id,
                        'type' => is_object($alert->type) ? $alert->type->value : (string)$alert->type,
                        'message' => $alert->message,
                        'detected_at' => $alert->detected_at?->toDateTimeString(),
                    ]
                )
            ),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}