<?php

namespace App\Services;

use App\Models\CustomField;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomFieldService
{
    public function getCustomFields(
        ?string $module,
        ?bool $isActive,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = CustomField::query()
            ->with('creator')
            ->orderBy('module')
            ->orderBy('field_name');

        if ($module !== null) {
            $query->where('module', $module);
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive);
        }

        return $query->paginate($perPage);
    }

    public function createCustomField(
        array $data,
        User $currentUser
    ): CustomField {
        return DB::transaction(function () use (
            $data,
            $currentUser
        ) {
            $fieldKey = $this->generateUniqueFieldKey(
                $data['module'],
                $data['field_name']
            );

            return CustomField::create([
                'module' => $data['module'],
                'field_key' => $fieldKey,
                'field_name' => $data['field_name'],
                'field_type' => $data['field_type'],
                'options' => $data['field_type'] === 'select'
                    ? ($data['options'] ?? [])
                    : null,
                'is_required' => $data['is_required'],
                'is_active' => true,
                'created_by' => $currentUser->id,
            ]);
        });
    }

    public function updateCustomField(
        CustomField $customField,
        array $data
    ): CustomField {
        return DB::transaction(function () use (
            $customField,
            $data
        ) {
            if (array_key_exists('module', $data)) {
                $customField->module = $data['module'];
            }

            if (array_key_exists('field_name', $data)) {
                $customField->field_name = $data['field_name'];
            }

            if (array_key_exists('field_type', $data)) {
                $customField->field_type = $data['field_type'];
            }

            if (array_key_exists('options', $data)) {
                $customField->options = $data['options'];
            }

            if (
                array_key_exists('field_type', $data)
                && $data['field_type'] !== 'select'
            ) {
                $customField->options = null;
            }

            if (array_key_exists('is_required', $data)) {
                $customField->is_required =
                    $data['is_required'];
            }

            if (array_key_exists('is_active', $data)) {
                $customField->is_active =
                    $data['is_active'];
            }

            $customField->save();

            return $customField->fresh('creator');
        });
    }

    public function deleteCustomField(
        CustomField $customField
    ): void {
        DB::transaction(function () use ($customField) {
            $customField->delete();
        });
    }

    private function generateUniqueFieldKey(
        string $module,
        string $fieldName
    ): string {
        $baseKey = Str::snake(
            Str::ascii($fieldName)
        );

        if ($baseKey === '') {
            $baseKey = 'custom_field';
        }

        $fieldKey = $baseKey;
        $suffix = 1;

        while (
            CustomField::query()
                ->where('module', $module)
                ->where('field_key', $fieldKey)
                ->exists()
        ) {
            $fieldKey = $baseKey . '_' . $suffix;
            $suffix++;
        }

        return $fieldKey;
    }
}