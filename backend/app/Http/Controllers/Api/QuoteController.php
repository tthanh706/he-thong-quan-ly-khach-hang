<?php

namespace App\Http\Controllers\Api;

use App\Models\Quote;

class QuoteController extends ScopedApiController
{
    protected function modelClass(): string
    {
        return Quote::class;
    }

    protected function entityName(): string
    {
        return 'quote';
    }

    protected function entityLabel(): string
    {
        return 'Báo giá';
    }

    protected function searchable(): array
    {
        return ['code'];
    }

    protected function exportColumns(): array
    {
        return ['id', 'code', 'customer_name', 'opportunity_title', 'amount', 'valid_until', 'status', 'owner_name', 'team_name'];
    }

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $id ? 'unique:quotes,code,'.$id : 'unique:quotes,code'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'opportunity_id' => ['nullable', 'integer', 'exists:opportunities,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'valid_until' => ['required', 'date'],
            'status' => ['required', 'in:draft,sent,accepted,rejected'],
        ];
    }

    protected function withRelations(): array
    {
        return ['owner', 'team', 'customer', 'opportunity'];
    }

    protected function transform(\Illuminate\Database\Eloquent\Model $model): array
    {
        /** @var Quote $model */
        return array_merge(parent::transform($model), [
            'code' => $model->code,
            'customer_id' => $model->customer_id,
            'customer_name' => $model->customer?->name,
            'opportunity_id' => $model->opportunity_id,
            'opportunity_title' => $model->opportunity?->title,
            'amount' => (float) $model->amount,
            'valid_until' => $model->valid_until?->format('Y-m-d'),
            'status' => $model->status->value,
            'status_label' => $model->status->label(),
        ]);
    }
}
