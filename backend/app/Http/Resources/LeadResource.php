<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'first_name'          => $this->first_name,
            'last_name'           => $this->last_name,
            'full_name'           => $this->full_name,
            'email'               => $this->email,
            'phone_number'        => $this->phone_number,
            'company_name'        => $this->company_name,
            'job_title'           => $this->job_title,
            'source'              => $this->source,
            'status'              => $this->status,
            'assigned_to'         => $this->assigned_to,
            'assigned_user'       => $this->whenLoaded('assignedUser', fn() => [
                'id'   => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ]),
            'linked_customer_id'  => $this->linked_customer_id,
            'linked_customer'     => $this->whenLoaded('linkedCustomer', fn() => [
                'id'           => $this->linkedCustomer->id,
                'company_name' => $this->linkedCustomer->company_name,
                'email'        => $this->linkedCustomer->email,
            ]),
            'merged_into_lead_id' => $this->merged_into_lead_id,
            'custom_fields'       => $this->custom_fields,
            'notes'               => $this->notes,
            'activity_logs_count' => $this->whenCounted('activityLogs'),
            'activity_logs'       => LeadActivityLogResource::collection($this->whenLoaded('activityLogs')),
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
