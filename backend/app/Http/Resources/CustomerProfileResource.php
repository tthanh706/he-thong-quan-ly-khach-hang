<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code ?? ('KH' . str_pad($this->id, 3, '0', STR_PAD_LEFT)),
            'name' => $this->name,
            'tax_code' => $this->tax_code ?? '',
            'taxCode' => $this->tax_code ?? '',
            'industry' => $this->industry ?? $this->notes ?? 'Doanh nghiệp',
            'company_size' => $this->company_size ?? '',
            'scale' => $this->company_size ?? '',
            'website' => $this->website ?? '',
            'address' => $this->address ?? '',
            'area' => $this->area ?? '',
            'phone' => $this->phone ?? '',
            'email' => $this->email ?? '',
            'status' => $this->status ?? 'Tiềm năng',
            'tier' => $this->status ?? 'Tiềm năng',
            'owner_id' => $this->owner_id,
            'ownerId' => $this->owner_id,
            'owner' => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ] : null,
            'ownerName' => $this->owner?->name ?? 'Chưa phân công',
            'parent_id' => $this->parent_id,
            'parentId' => $this->parent_id,
            'parentName' => $this->parent?->name,
            'contacts' => $this->relationLoaded('contacts') ? $this->contacts->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'title' => $c->title,
                'is_primary' => (bool) $c->is_primary,
            ]) : [],
            'contactsCount' => $this->contacts_count ?? ($this->relationLoaded('contacts') ? $this->contacts->count() : 0),
            'contractsCount' => $this->contracts_count ?? ($this->relationLoaded('contracts') ? $this->contracts->count() : 0),
            'supportRequestsCount' => $this->support_requests_count ?? ($this->relationLoaded('supportRequests') ? $this->supportRequests->count() : 0),
            'periodicCaresCount' => $this->periodic_cares_count ?? ($this->relationLoaded('periodicCares') ? $this->periodicCares->count() : 0),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'createdAt' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
