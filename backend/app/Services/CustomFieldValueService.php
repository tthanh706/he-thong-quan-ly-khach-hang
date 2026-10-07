<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomField;
use App\Models\CustomFieldValue;
use App\Models\Opportunity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomFieldValueService
{
    public function getValues(
        string $module,
        int $entityId
    ): Collection {
        $this->findEntityOrFail(
            $module,
            $entityId
        );

        $fields = CustomField::query()
            ->where('module', $module)
            ->where('is_active', true)
            ->orderBy('field_name')
            ->get();

        $values = CustomFieldValue::query()
            ->where('entity_type', $module)
            ->where('entity_id', $entityId)
            ->get()
            ->keyBy('custom_field_id');

        return $fields->map(function (
            CustomField $field
        ) use ($values) {
            $storedValue = $values->get($field->id);

            return (object) [
                'id' => $field->id,
                'field_key' => $field->field_key,
                'field_name' => $field->field_name,
                'field_type' => $field->field_type,
                'options' => $field->options ?? [],
                'is_required' => $field->is_required,
                'value' => $storedValue?->value,
            ];
        });
    }

    public function saveValues(
        string $module,
        int $entityId,
        array $values
    ): Collection {
        $this->findEntityOrFail(
            $module,
            $entityId
        );

        DB::transaction(function () use (
            $module,
            $entityId,
            $values
        ) {
            $fields = CustomField::query()
                ->where('module', $module)
                ->where('is_active', true)
                ->whereIn(
                    'field_key',
                    array_keys($values)
                )
                ->get()
                ->keyBy('field_key');

            foreach ($values as $fieldKey => $value) {
                $field = $fields->get($fieldKey);

                if (!$field) {
                    continue;
                }

                CustomFieldValue::query()
                    ->updateOrCreate(
                        [
                            'custom_field_id' =>
                                $field->id,

                            'entity_type' =>
                                $module,

                            'entity_id' =>
                                $entityId,
                        ],
                        [
                            'value' =>
                                $value === null
                                    ? null
                                    : (string) $value,
                        ]
                    );
            }
        });

        return $this->getValues(
            $module,
            $entityId
        );
    }

    public function filterEntities(
        string $module,
        ?string $search,
        array $customFields,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $this->newEntityQuery($module);

        if ($search !== null && $search !== '') {
            $query->where(function (
                Builder $builder
            ) use ($search) {
                $builder
                    ->where(
                        'name',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'email',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        '%' . $search . '%'
                    );
            });
        }

        foreach (
            $customFields
            as $fieldKey => $fieldValue
        ) {
            if (
                $fieldValue === null
                || $fieldValue === ''
            ) {
                continue;
            }

            $query->whereExists(function (
                $subQuery
            ) use (
                $module,
                $fieldKey,
                $fieldValue
            ) {
                $subQuery
                    ->select(DB::raw(1))
                    ->from('custom_field_values')
                    ->join(
                        'custom_fields',
                        'custom_fields.id',
                        '=',
                        'custom_field_values.custom_field_id'
                    )
                    ->whereColumn(
                        'custom_field_values.entity_id',
                        $this->getEntityTable($module)
                            . '.id'
                    )
                    ->where(
                        'custom_field_values.entity_type',
                        $module
                    )
                    ->where(
                        'custom_fields.module',
                        $module
                    )
                    ->where(
                        'custom_fields.field_key',
                        $fieldKey
                    )
                    ->where(
                        'custom_field_values.value',
                        (string) $fieldValue
                    );
            });
        }

        $paginator = $query
            ->orderByDesc('id')
            ->paginate($perPage);

        $entityIds = $paginator
            ->getCollection()
            ->pluck('id');

        $values = $this->getValueMap(
            $module,
            $entityIds
        );

        $paginator->setCollection(
            $paginator->getCollection()->map(
                function (Model $entity) use (
                    $values
                ) {
                    return [
                        'id' => $entity->id,
                        'name' => $entity->name,
                        'status' => $entity->status,
                        'value' => $entity->value,
                        'email' => $entity->email,
                        'phone' => $entity->phone,
                        'notes' => $entity->notes,
                        'custom_fields' =>
                            $values[$entity->id] ?? [],
                    ];
                }
            )
        );

        return $paginator;
    }

    public function getEntitiesForExport(
        string $module,
        ?string $search,
        array $customFields
    ): Collection {
        $query = $this->newEntityQuery($module);

        if ($search !== null && $search !== '') {
            $query->where(function (
                Builder $builder
            ) use ($search) {
                $builder
                    ->where(
                        'name',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'email',
                        'like',
                        '%' . $search . '%'
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        '%' . $search . '%'
                    );
            });
        }

        foreach (
            $customFields
            as $fieldKey => $fieldValue
        ) {
            if (
                $fieldValue === null
                || $fieldValue === ''
            ) {
                continue;
            }

            $query->whereExists(function (
                $subQuery
            ) use (
                $module,
                $fieldKey,
                $fieldValue
            ) {
                $subQuery
                    ->select(DB::raw(1))
                    ->from('custom_field_values')
                    ->join(
                        'custom_fields',
                        'custom_fields.id',
                        '=',
                        'custom_field_values.custom_field_id'
                    )
                    ->whereColumn(
                        'custom_field_values.entity_id',
                        $this->getEntityTable($module)
                            . '.id'
                    )
                    ->where(
                        'custom_field_values.entity_type',
                        $module
                    )
                    ->where(
                        'custom_fields.module',
                        $module
                    )
                    ->where(
                        'custom_fields.field_key',
                        $fieldKey
                    )
                    ->where(
                        'custom_field_values.value',
                        (string) $fieldValue
                    );
            });
        }

        return $query
            ->orderBy('id')
            ->get();
    }

    public function getValueMap(
        string $module,
        Collection $entityIds
    ): array {
        if ($entityIds->isEmpty()) {
            return [];
        }

        $rows = CustomFieldValue::query()
            ->join(
                'custom_fields',
                'custom_fields.id',
                '=',
                'custom_field_values.custom_field_id'
            )
            ->where(
                'custom_field_values.entity_type',
                $module
            )
            ->whereIn(
                'custom_field_values.entity_id',
                $entityIds
            )
            ->select([
                'custom_field_values.entity_id',
                'custom_field_values.value',
                'custom_fields.field_key',
            ])
            ->get();

        $result = [];

        foreach ($rows as $row) {
            $result[$row->entity_id][
                $row->field_key
            ] = $row->value;
        }

        return $result;
    }

    private function findEntityOrFail(
        string $module,
        int $entityId
    ): Model {
        return match ($module) {
            'customer' =>
                Customer::query()->findOrFail($entityId),

            'opportunity' =>
                Opportunity::query()->findOrFail($entityId),

            default =>
                abort(404, 'Module không tồn tại.'),
        };
    }

    private function newEntityQuery(
        string $module
    ): Builder {
        return match ($module) {
            'customer' => Customer::query(),

            'opportunity' => Opportunity::query(),

            default =>
                abort(404, 'Module không tồn tại.'),
        };
    }

    private function getEntityTable(
        string $module
    ): string {
        return match ($module) {
            'customer' => 'customers',
            'opportunity' => 'opportunities',
            default =>
                abort(404, 'Module không tồn tại.'),
        };
    }
}