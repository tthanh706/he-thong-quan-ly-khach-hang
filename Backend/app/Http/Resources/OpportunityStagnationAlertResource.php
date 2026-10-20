<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityStagnationAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'message' => $this->message,
            'detected_at' => $this->detected_at?->toDateTimeString(),
            'read_at' => $this->read_at?->toDateTimeString(),

            'opportunity' => $this->whenLoaded(
                'opportunity',
                fn () => $this->opportunity ? [
                    'id' => $this->opportunity->id,
                    'name' => $this->opportunity->name,
                    'stage' => $this->opportunity->stage,
                    'status' => $this->opportunity->status->value,
                    'expected_close_date' => $this->opportunity
                        ->expected_close_date?->format('Y-m-d'),
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