<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractExpiryAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'message' => $this->message,
            'detected_at' => $this->detected_at?->toDateTimeString(),
            'read_at' => $this->read_at?->toDateTimeString(),

            'contract' => $this->whenLoaded(
                'contract',
                fn () => $this->contract ? [
                    'id' => $this->contract->id,
                    'contract_code' => $this->contract->contract_code,
                    'customer_name' => $this->contract->customer_name,
                    'status' => $this->contract->status->value,
                    'end_date' => $this->contract->end_date?->format('Y-m-d'),
                ] : null
            ),

            'recipient' => $this->whenLoaded(
                'recipient',
                fn () => $this->recipient ? [
                    'id' => $this->recipient->id,
                    'name' => $this->recipient->name,
                    'email' => $this->recipient->email,
                ] : null
            ),
        ];
    }
}