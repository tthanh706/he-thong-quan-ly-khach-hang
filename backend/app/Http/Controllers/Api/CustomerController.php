<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;

class CustomerController extends ScopedApiController
{
    protected function modelClass(): string
    {
        return Customer::class;
    }

    protected function entityName(): string
    {
        return 'customer';
    }

    protected function entityLabel(): string
    {
        return 'Khách hàng';
    }

    protected function searchable(): array
    {
        return ['code', 'name', 'industry', 'city', 'email', 'phone'];
    }

    protected function exportColumns(): array
    {
        return ['id', 'code', 'name', 'industry', 'city', 'phone', 'email', 'status', 'owner_name', 'team_name'];
    }

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $id ? 'unique:customers,code,'.$id : 'unique:customers,code'],
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'in:lead,active,inactive'],
        ];
    }

    protected function transform(\Illuminate\Database\Eloquent\Model $model): array
    {
        /** @var Customer $model */
        return array_merge(parent::transform($model), [
            'code' => $model->code,
            'name' => $model->name,
            'industry' => $model->industry,
            'city' => $model->city,
            'phone' => $model->phone,
            'email' => $model->email,
            'status' => $model->status->value,
            'status_label' => $model->status->label(),
        ]);
    }
}
