<?php

namespace App\Http\Controllers\Api;

use App\Models\Activity;

class ActivityController extends ScopedApiController
{
    protected function modelClass(): string
    {
        return Activity::class;
    }

    protected function entityName(): string
    {
        return 'activity';
    }

    protected function entityLabel(): string
    {
        return 'Hoạt động';
    }

    protected function searchable(): array
    {
        return ['title'];
    }

    protected function exportColumns(): array
    {
        return ['id', 'title', 'type', 'customer_name', 'assignee_name', 'due_at', 'status', 'owner_name', 'team_name'];
    }

    protected function rules(?int $id = null): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:call,meeting,email,visit'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_at' => ['required', 'date'],
            'status' => ['required', 'in:todo,done,overdue'],
        ];
    }

    protected function withRelations(): array
    {
        return ['owner', 'team', 'customer', 'assignee'];
    }

    protected function transform(\Illuminate\Database\Eloquent\Model $model): array
    {
        /** @var Activity $model */
        return array_merge(parent::transform($model), [
            'title' => $model->title,
            'type' => $model->type->value,
            'type_label' => $model->type->label(),
            'customer_id' => $model->customer_id,
            'customer_name' => $model->customer?->name,
            'assignee_id' => $model->assignee_id,
            'assignee_name' => $model->assignee?->name,
            'due_at' => $model->due_at?->toIso8601String(),
            'status' => $model->status->value,
            'status_label' => $model->status->label(),
        ]);
    }
}
