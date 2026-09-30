<?php

namespace App\Http\Controllers\Api;

use App\Models\Opportunity;

class OpportunityController extends ScopedApiController
{
    protected function modelClass(): string
    {
        return Opportunity::class;
    }

    protected function entityName(): string
    {
        return 'opportunity';
    }

    protected function entityLabel(): string
    {
        return 'Cơ hội';
    }

    protected function searchable(): array
    {
        return ['code', 'title'];
    }

    protected function exportColumns(): array
    {
        return ['id', 'code', 'title', 'amount', 'stage', 'close_date', 'owner_name', 'team_name'];
    }

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $id ? 'unique:opportunities,code,'.$id : 'unique:opportunities,code'],
            'title' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'stage' => ['required', 'in:prospecting,qualified,proposal,negotiation,won,lost'],
            'close_date' => ['required', 'date'],
        ];
    }

    protected function withRelations(): array
    {
        return ['owner', 'team', 'customer'];
    }

    protected function transform(\Illuminate\Database\Eloquent\Model $model): array
    {
        /** @var Opportunity $model */
        return array_merge(parent::transform($model), [
            'code' => $model->code,
            'title' => $model->title,
            'customer_id' => $model->customer_id,
            'customer_name' => $model->customer?->name,
            'amount' => (float) $model->amount,
            'stage' => $model->stage->value,
            'stage_label' => $model->stage->label(),
            'close_date' => $model->close_date?->format('Y-m-d'),
        ]);
    }
}
