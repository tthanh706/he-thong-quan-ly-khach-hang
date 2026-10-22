<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user_id,
                'name' => $this->user?->name,
            ],
            'customer' => [
                'id' => $this->customer_id,
                'name' => $this->customer?->name,
            ],
            'contact' => $this->contact_id ? [
                'id' => $this->contact_id,
                'name' => $this->contact?->name,
            ] : null,
            'opportunity' => $this->opportunity_id ? [
                'id' => $this->opportunity_id,
                'title' => $this->opportunity?->title,
            ] : null,
            'type' => $this->type->value ?? $this->type,
            'title' => $this->title,
            'performed_at' => $this->performed_at->format('Y-m-d H:i:s'),
            'duration_minutes' => $this->duration_minutes,
            'description' => $this->description,
            'result' => $this->result,
            'status' => $this->status,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}